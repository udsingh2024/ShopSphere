const mongoose = require('mongoose');

const SocketSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    socketId: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    deviceInfo: {
      type: String,
      default: '',
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    disconnectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SocketSession', SocketSessionSchema);
