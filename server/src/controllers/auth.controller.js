const User = require('../models/User');
const Session = require('../models/Session');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/tokens');
const {
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendAccountDeletedEmail,
} = require('../services/email.service');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const parseUserAgent = (userAgentString) => {
  if (!userAgentString) return 'Unknown Device';
  if (userAgentString.includes('iPhone')) return 'iPhone Safari';
  if (userAgentString.includes('iPad')) return 'iPad Safari';
  if (userAgentString.includes('Android')) return 'Android Mobile';
  if (userAgentString.includes('Windows')) return 'Windows PC';
  if (userAgentString.includes('Macintosh')) return 'Macbook macOS';
  if (userAgentString.includes('Linux')) return 'Linux PC';
  return 'Desktop Browser';
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'customer', // Default role
      emailVerified: true,
    });

    // Send welcome email (optional, can be done immediately if you want)
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      logger.warn(`Could not send welcome email to ${email}: ${emailError.message}`);
    }

    logger.info(`User registered successfully: ${email}. Auto-verified.`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    logger.info(`Email verified successfully for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.provider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account is linked with Google. Please use Google Login.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session record for multi-device audit
    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';

    const session = await Session.create({
      user: user._id,
      deviceInfo,
      ipAddress,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = jwt.sign(
      { id: user._id, sessionId: session._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.create({
      user: user._id,
      session: session._id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });

    // Set refresh cookie based on rememberMe
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined; // 7 days or browser session cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google Credential Token is required' });
    }

    // Decode Google JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid token structure' });
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    const { sub: googleId, email, name, picture: avatar } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email missing from Google credentials' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        provider: 'google',
        avatar,
        emailVerified: true, // Google accounts are auto-verified
      });
      await sendWelcomeEmail(user.email, user.name);
      logger.info(`New user registered via Google Sign-In: ${email}`);
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        if (!user.avatar) user.avatar = avatar;
        user.emailVerified = true;
        await user.save();
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session record
    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    const ipAddress = req.ip || '0.0.0.0';
    const session = await Session.create({
      user: user._id,
      deviceInfo,
      ipAddress,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = jwt.sign(
      { id: user._id, sessionId: session._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user: user._id,
      session: session._id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Session token not found',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token',
      });
    }

    const currentHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash: currentHash });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Session revoked',
      });
    }

    // Reuse detection
    if (storedToken.isUsed || storedToken.isRevoked) {
      logger.warn(`Potential session hijack warning: Token reuse detected for User ${decoded.id}`);
      
      // Revoke the parent session and all tokens attached to it
      await Session.findByIdAndUpdate(decoded.sessionId, { isValid: false });
      await RefreshToken.updateMany({ session: decoded.sessionId }, { isRevoked: true });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return res.status(401).json({
        success: false,
        message: 'Session compromised. Re-authentication required.',
      });
    }

    // Check parent session
    const parentSession = await Session.findById(decoded.sessionId);
    if (!parentSession || !parentSession.isValid) {
      return res.status(401).json({
        success: false,
        message: 'Session has been terminated',
      });
    }

    // Mark current token as used
    storedToken.isUsed = true;
    await storedToken.save();

    // Create new tokens (rotation)
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = jwt.sign(
      { id: decoded.id, sessionId: decoded.sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user: decoded.id,
      session: decoded.sessionId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt,
    });

    // Update session active timestamp
    parentSession.lastActive = new Date();
    await parentSession.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // Revoke target session
        await Session.findByIdAndUpdate(decoded.sessionId, { isValid: false });
        await RefreshToken.updateMany({ session: decoded.sessionId }, { isRevoked: true });
      } catch (err) {
        // Suppress token errors on logging out
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: 'Logged out successfully from this device',
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address',
      });
    }

    if (user.provider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account is linked with Google Sign-In. Password reset is not applicable.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = hashToken(resetToken);

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendResetPasswordEmail(user.email, user.name, resetToken);

    res.json({
      success: true,
      message: 'Password reset link dispatched to email',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Invalidate old sessions upon password change for security
    user.refreshTokenVersion += 1;
    await user.save();

    // Terminate all current database sessions
    await Session.updateMany({ user: user._id }, { isValid: false });
    await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });

    logger.info(`Password reset successfully for user: ${user.email}. Revoked all other active sessions.`);

    res.json({
      success: true,
      message: 'Password updated successfully. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.provider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Auth. Passwords cannot be modified here.',
      });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid current password' });
    }

    user.password = newPassword;
    user.refreshTokenVersion += 1;
    await user.save();

    // Terminate other active sessions for security
    const currentSessionId = req.user.sessionId; // will be populated by auth middleware
    await Session.updateMany({ user: user._id, _id: { $ne: currentSessionId } }, { isValid: false });
    await RefreshToken.updateMany({ user: user._id, session: { $ne: currentSessionId } }, { isRevoked: true });

    logger.info(`Password changed via dashboard for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully. Other devices have been logged out.',
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, street, city, state, zipCode, country } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    // Address updates
    if (street !== undefined) user.address.street = street;
    if (city !== undefined) user.address.city = city;
    if (state !== undefined) user.address.state = state;
    if (zipCode !== undefined) user.address.zipCode = zipCode;
    if (country !== undefined) user.address.country = country;

    await user.save();
    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile details updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Capture variables before deletion
    const { email, name } = user;

    // Delete user from DB
    await User.findByIdAndDelete(req.user.id);

    // Delete related sessions & tokens
    await Session.deleteMany({ user: req.user.id });
    await RefreshToken.deleteMany({ user: req.user.id });

    // Send account deleted confirmation email
    await sendAccountDeletedEmail(email, name);

    // Clear client cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info(`Account deleted successfully: ${email}`);

    res.json({
      success: true,
      message: 'Your account has been deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user.id, isValid: true })
      .sort({ lastActive: -1 });

    const currentSessionId = req.user.sessionId;

    const sessionList = sessions.map((s) => ({
      id: s._id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      isCurrent: s._id.toString() === currentSessionId?.toString(),
    }));

    res.json({
      success: true,
      sessions: sessionList,
    });
  } catch (error) {
    next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ _id: sessionId, user: req.user.id });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found',
      });
    }

    session.isValid = false;
    await session.save();

    // Revoke corresponding refresh tokens
    await RefreshToken.updateMany({ session: sessionId }, { isRevoked: true });

    logger.info(`Session ${sessionId} manually revoked by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Device session logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name'
    ) {
      logger.warn('Cloudinary not configured. Mocking avatar upload.');
      return resolve({
        url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
        publicId: `mock_avatar_${Date.now()}`,
      });
    }

    const cloudinary = require('../config/cloudinary');
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shopsphere/avatars' },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary avatar upload failed: ${error.message}`);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.avatar = uploadResult.url;
    await user.save();

    logger.info(`Avatar updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json({
      success: true,
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { wishlist: productId } },
      { new: true }
    ).populate('wishlist');

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('wishlist_updated', user.wishlist);
    }

    res.json({
      success: true,
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: productId } },
      { new: true }
    ).populate('wishlist');

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user.id}`).emit('wishlist_updated', user.wishlist);
    }

    res.json({
      success: true,
      wishlist: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  googleLogin,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  deleteAccount,
  getSessions,
  revokeSession,
  uploadAvatar,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
