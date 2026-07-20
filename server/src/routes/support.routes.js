const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const { getConversations, getMessages } = require('../controllers/support.controller');

router.get('/conversations', protect, adminOnly, getConversations);
router.get('/messages/:roomId', protect, getMessages);

module.exports = router;
