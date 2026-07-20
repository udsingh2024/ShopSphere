const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

const getConversations = async (req, res, next) => {
  try {
    // Admin list of active unique chat rooms
    const rooms = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$room',
          latestMessage: { $first: '$message' },
          latestSender: { $first: '$sender' },
          lastUpdatedAt: { $first: '$createdAt' },
        },
      },
      { $sort: { lastUpdatedAt: -1 } },
    ]);

    // Populate sender details for rooms
    const conversations = await Promise.all(
      rooms.map(async (roomObj) => {
        // If the room name matches user_XXX, get that user's info
        let customerInfo = null;
        if (roomObj._id.startsWith('user_')) {
          const userId = roomObj._id.split('user_')[1];
          try {
            customerInfo = await User.findById(userId).select('name email avatarUrl');
          } catch (e) {
            // Ignore format errors
          }
        }
        return {
          room: roomObj._id,
          latestMessage: roomObj.latestMessage,
          lastUpdatedAt: roomObj.lastUpdatedAt,
          customer: customerInfo,
        };
      })
    );

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    // Validate access: Normal users can only view their own support room
    if (req.user.role !== 'admin' && roomId !== `user_${req.user.id}`) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view messages for this room',
      });
    }

    const messages = await ChatMessage.find({ room: roomId })
      .populate('sender', 'name avatarUrl role')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
};
