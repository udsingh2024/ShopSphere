const ActiveUser = require('../models/ActiveUser');
const SocketSession = require('../models/SocketSession');
const logger = require('../utils/logger');
const socketEvents = require('./socketEvents');

/**
 * Audit and persist user socket connection.
 */
const handleUserConnect = async (io, socket) => {
  if (!socket.user) return;
  const userId = socket.user.id;
  const ipAddress = socket.handshake.address || '';
  const deviceInfo = socket.handshake.headers['user-agent'] || 'Unknown Device';

  try {
    // 1. Persist or update online status
    await ActiveUser.findOneAndUpdate(
      { user: userId },
      { socketId: socket.id, status: 'online', lastSeen: new Date() },
      { upsert: true, new: true }
    );

    // 2. Audit Socket Session
    await SocketSession.create({
      user: userId,
      socketId: socket.id,
      ipAddress,
      deviceInfo,
      connectedAt: new Date(),
    });

    // 3. Broadcast online status to relevant rooms
    io.emit(socketEvents.USER_ONLINE, {
      userId,
      role: socket.user.role,
      lastSeen: new Date(),
    });

    // 4. Update Admin Dashboard Visitor Count
    await broadcastVisitorCount(io);
  } catch (error) {
    logger.error(`Error saving socket connection state: ${error.message}`);
  }
};

/**
 * Audit and handle user disconnect.
 */
const handleUserDisconnect = async (io, socket) => {
  if (!socket.user) return;
  const userId = socket.user.id;

  try {
    // 1. Audit Socket Session disconnection
    await SocketSession.findOneAndUpdate(
      { socketId: socket.id },
      { disconnectedAt: new Date() }
    );

    // 2. Check if user is connected on other active sockets
    const userRoom = `user_${userId}`;
    const activeSockets = await io.in(userRoom).fetchSockets();

    if (activeSockets.length === 0) {
      // User is completely offline
      await ActiveUser.findOneAndUpdate(
        { user: userId },
        { status: 'offline', lastSeen: new Date() }
      );

      // Broadcast offline status
      io.emit(socketEvents.USER_OFFLINE, {
        userId,
        role: socket.user.role,
        lastSeen: new Date(),
      });
    }

    // 3. Update Admin Dashboard Visitor Count
    await broadcastVisitorCount(io);
  } catch (error) {
    logger.error(`Error saving socket disconnect state: ${error.message}`);
  }
};

/**
 * Calculate and broadcast active viewers for a product room.
 */
const updateProductViewerCount = async (io, productId) => {
  try {
    const room = `product_${productId}`;
    const sockets = await io.in(room).fetchSockets();
    const count = sockets.length;

    io.to(room).emit(socketEvents.PEOPLE_VIEWING_UPDATED, {
      productId,
      count,
    });
  } catch (error) {
    logger.error(`Error broadcasting product viewers: ${error.message}`);
  }
};

/**
 * Broadcast total active visitors/connections to admin dashboards.
 */
const broadcastVisitorCount = async (io) => {
  try {
    const sockets = await io.fetchSockets();
    const uniqueUserIds = new Set();

    sockets.forEach((s) => {
      if (s.user) uniqueUserIds.add(s.user.id);
    });

    io.to('admin_room').emit(socketEvents.DASHBOARD_UPDATED, {
      visitorsCount: uniqueUserIds.size,
      connectionsCount: sockets.length,
    });
  } catch (error) {
    logger.error(`Error broadcasting visitor count: ${error.message}`);
  }
};

module.exports = {
  handleUserConnect,
  handleUserDisconnect,
  updateProductViewerCount,
  broadcastVisitorCount,
};
