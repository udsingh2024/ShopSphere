const socketAuthMiddleware = require('./socketMiddleware');
const socketEvents = require('./socketEvents');
const { joinUserRooms, leaveUserRooms } = require('./socketRooms');
const {
  handleUserConnect,
  handleUserDisconnect,
  updateProductViewerCount,
  broadcastVisitorCount,
} = require('./socketUtils');
const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../utils/logger');

const initSocketServer = (io) => {
  // Attach auth middleware to Socket.IO
  io.use(socketAuthMiddleware);

  io.on(socketEvents.CONNECTION, async (socket) => {
    logger.info(`Socket client connected: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.role})`);

    // 1. Join user rooms
    joinUserRooms(socket);

    // 2. Track online user and session
    await handleUserConnect(io, socket);

    // Custom rate-limiter check helper to prevent socket flooding
    const limitSocketThrottle = (socket, limitMs = 300) => {
      const now = Date.now();
      if (!socket.lastEventTime) {
        socket.lastEventTime = 0;
      }
      if (now - socket.lastEventTime < limitMs) {
        logger.warn(`Socket flood alert: IP ${socket.handshake.address} sent events too quickly.`);
        socket.emit('security_error', { message: 'Too many operations. Please slow down.' });
        return false;
      }
      socket.lastEventTime = now;
      return true;
    };

    // 3. User room joining/leaving controls with authorization filters
    socket.on(socketEvents.JOIN_ROOM, ({ roomId }) => {
      if (!roomId) return;
      
      // Admin room constraint check
      if (roomId === 'admin_room' && socket.user.role !== 'admin' && socket.user.role !== 'support') {
        logger.warn(`Security Warning: User ${socket.user.email} attempted to join admin_room`);
        return socket.emit('security_error', { message: 'Unauthorized room membership' });
      }

      // Check cross-user room access limits
      if (roomId.startsWith('user_')) {
        const targetUserId = roomId.split('_')[1];
        if (socket.user.id !== targetUserId && socket.user.role !== 'admin' && socket.user.role !== 'support') {
          logger.warn(`Security Warning: User ${socket.user.email} attempted to join private room ${roomId}`);
          return socket.emit('security_error', { message: 'Unauthorized room membership' });
        }
      }

      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined custom room: ${roomId}`);
    });

    socket.on(socketEvents.LEAVE_ROOM, ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      logger.info(`Socket ${socket.id} left custom room: ${roomId}`);
    });

    // 4. Product view tracking (People Viewing Feature)
    socket.on('view_product', async ({ productId }) => {
      if (!productId) return;
      socket.join(`product_${productId}`);
      logger.info(`Socket ${socket.id} viewing product: ${productId}`);
      await updateProductViewerCount(io, productId);
    });

    socket.on('leave_product', async ({ productId }) => {
      if (!productId) return;
      socket.leave(`product_${productId}`);
      logger.info(`Socket ${socket.id} left product view: ${productId}`);
      await updateProductViewerCount(io, productId);
    });

    // 5. Cart real-time sync across devices
    socket.on(socketEvents.CART_UPDATED, async ({ items }) => {
      try {
        if (!limitSocketThrottle(socket, 500)) return;
        const userId = socket.user.id;
        // Persist cart to DB
        await User.findByIdAndUpdate(userId, { cart: items });

        // Broadcast to other devices of the same user
        const userRoom = `user_${userId}`;
        socket.to(userRoom).emit(socketEvents.CART_SYNCED, items);
        logger.info(`Synced cart for user ${userId} to other active sessions`);
      } catch (err) {
        logger.error(`Error syncing cart via sockets: ${err.message}`);
      }
    });

    // 6. Support chat operations with rate limit throttling
    socket.on(socketEvents.SEND_MESSAGE, async (data) => {
      try {
        if (!limitSocketThrottle(socket, 500)) return; // Throttle to max 2 messages per second
        const { room, message, messageType, fileUrl, fileName } = data;
        if (!room) return;

        // Authorization check: User can only emit to a room they belong to
        if (room !== 'admin_room' && !room.startsWith('user_')) {
          return socket.emit('security_error', { message: 'Invalid room communication' });
        }
        if (room.startsWith('user_')) {
          const targetUserId = room.split('_')[1];
          if (socket.user.id !== targetUserId && socket.user.role !== 'admin' && socket.user.role !== 'support') {
            return socket.emit('security_error', { message: 'Unauthorized communication' });
          }
        }

        // Save to Message collection
        const newMsg = await Message.create({
          room,
          sender: socket.user.id,
          message: message || '',
          messageType: messageType || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          deliveredStatus: 'sent',
        });

        const populated = await Message.findById(newMsg._id).populate(
          'sender',
          'name avatar role'
        );

        // Emit message to everyone in the room (including sender)
        io.to(room).emit(socketEvents.RECEIVE_MESSAGE, populated);

        // If customer sent it, trigger notification to support staff
        if (room.startsWith('user_')) {
          io.to('admin_room').emit('receive_admin_notification', {
            room,
            message: populated,
          });
        }
      } catch (err) {
        logger.error(`Socket SEND_MESSAGE error: ${err.message}`);
      }
    });

    // Seen / Read Receipts
    socket.on('message_seen', async ({ roomId }) => {
      try {
        if (!roomId) return;
        if (!limitSocketThrottle(socket, 300)) return;

        // Update all unread messages in this room sent by other users
        await Message.updateMany(
          { room: roomId, sender: { $ne: socket.user.id }, deliveredStatus: { $ne: 'seen' } },
          { deliveredStatus: 'seen' }
        );

        // Broadcast seen receipt to everyone else in the room
        socket.to(roomId).emit('message_seen_receipt', { roomId });
      } catch (err) {
        logger.error(`Error marking messages as seen: ${err.message}`);
      }
    });

    // Typing Indicators
    socket.on(socketEvents.TYPING, ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit(socketEvents.TYPING, { roomId, senderId: socket.user.id });
    });

    socket.on(socketEvents.STOP_TYPING, ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit(socketEvents.STOP_TYPING, { roomId, senderId: socket.user.id });
    });

    // Handle disconnection
    socket.on(socketEvents.DISCONNECT, async () => {
      logger.info(`Socket client disconnected: ${socket.id} (User ID: ${socket.user?.id})`);

      // 1. Audit disconnection
      await handleUserDisconnect(io, socket);

      // 2. Remove from rooms
      leaveUserRooms(socket);
    });
  });
};

module.exports = { initSocketServer };
