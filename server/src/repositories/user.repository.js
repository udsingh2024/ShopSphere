const User = require('../models/User');

class UserRepository {
  async findByEmail(email, selectPassword = false) {
    let query = User.findOne({ email });
    if (selectPassword) {
      query = query.select('+password');
    }
    return await query;
  }

  async findById(id) {
    return await User.findById(id);
  }

  async create(userData) {
    return await User.create(userData);
  }

  async updateRefreshToken(id, refreshTokenHash) {
    return await User.findByIdAndUpdate(
      id,
      { refreshTokenHash },
      { new: true }
    );
  }

  async clearRefreshToken(id) {
    return await User.findByIdAndUpdate(
      id,
      { $unset: { refreshTokenHash: 1 } },
      { new: true }
    );
  }

  async verifyRefreshToken(id, hash) {
    const user = await User.findById(id).select('+refreshTokenHash');
    if (!user || user.refreshTokenHash !== hash) {
      return null;
    }
    return user;
  }
}

module.exports = new UserRepository();
