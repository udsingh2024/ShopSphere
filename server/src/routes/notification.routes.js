const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notification.controller');

router.get('/', protect, getNotifications);
router.put('/read/:id', protect, markRead);
router.put('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
