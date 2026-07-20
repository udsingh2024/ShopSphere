const logger = require('../utils/logger');

/**
 * Assign user to standard socket rooms on connection based on ID and role.
 */
const joinUserRooms = (socket) => {
  if (!socket.user) return;
  const { id, role } = socket.user;

  // Personal user channel
  socket.join(`user_${id}`);
  logger.info(`Socket client ${socket.id} (User: ${id}) joined room: user_${id}`);

  // Role-based administrative rooms
  if (role === 'admin') {
    socket.join('admin_room');
    logger.info(`Socket client ${socket.id} joined admin room: admin_room`);
  } else if (role === 'seller') {
    socket.join('seller_room');
    logger.info(`Socket client ${socket.id} joined seller room: seller_room`);
  }
};

/**
 * Remove user from standard socket rooms on disconnect.
 */
const leaveUserRooms = (socket) => {
  if (!socket.user) return;
  const { id, role } = socket.user;

  socket.leave(`user_${id}`);
  if (role === 'admin') {
    socket.leave('admin_room');
  } else if (role === 'seller') {
    socket.leave('seller_room');
  }
};

module.exports = {
  joinUserRooms,
  leaveUserRooms,
};
