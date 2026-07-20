module.exports = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',

  // Order events
  NEW_ORDER_PLACED: 'new_order_placed',
  ORDER_STATUS_UPDATED: 'order_status_updated',

  // Inventory events
  STOCK_UPDATED: 'stock_updated',
  LOW_STOCK_ALERT: 'low_stock_alert',

  // Notification events
  NOTIFICATION_RECEIVED: 'notification_received',

  // User online events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',

  // Chat/Support events
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_SEEN: 'message_seen',

  // Sync events
  CART_UPDATED: 'cart_updated',
  CART_SYNCED: 'cart_synced',
  WISHLIST_UPDATED: 'wishlist_updated',
  DASHBOARD_UPDATED: 'dashboard_updated',

  // Viewing tracker
  PEOPLE_VIEWING_UPDATED: 'people_viewing_updated',
};
