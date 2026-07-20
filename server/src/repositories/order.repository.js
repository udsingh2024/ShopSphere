const Order = require('../models/Order');

class OrderRepository {
  async create(orderData) {
    return await Order.create(orderData);
  }

  async findById(id) {
    return await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'title price images');
  }

  async findByUser(userId) {
    return await Order.find({ user: userId })
      .populate('items.product', 'title price images')
      .sort({ createdAt: -1 });
  }

  async findAll({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'title price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Order.countDocuments();
    
    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
    };
  }

  async updateStatus(id, orderStatus) {
    const updateObj = { orderStatus };
    if (orderStatus === 'shipped') {
      updateObj.shippedAt = new Date();
    } else if (orderStatus === 'delivered') {
      updateObj.deliveredAt = new Date();
    }
    return await Order.findByIdAndUpdate(id, updateObj, { new: true });
  }
}

module.exports = new OrderRepository();
