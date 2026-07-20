const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = {
      $or: [
        { user: userId },
        { user: null }, // Global announcements
      ],
    };

    // Admins also get low stock alerts
    if (req.user.role === 'admin') {
      query.$or.push({ type: 'low_stock' });
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership (unless it's an admin viewing a low_stock alert or a global announcement)
    if (
      notification.user &&
      notification.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = {
      $or: [{ user: userId }],
    };

    if (req.user.role === 'admin') {
      query.$or.push({ type: 'low_stock' });
    }

    await Notification.updateMany(query, { read: true });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (
      notification.user &&
      notification.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
