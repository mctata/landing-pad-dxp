const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const logger = require('../utils/logger');

// Generate JWT Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '1h' }
  );
};

// Generate JWT Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      subscriptionTier: 'free',
      status: 'pending'
    });
    
    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();
    
    // In a production app, we would send an email with the verification link
    // For now, we'll return the token in the response for testing
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      accessToken,
      user,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
    });
  } catch (error) {
    logger.error('Register error:', error);
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return res.status(403).json({ 
          message: 'Email not verified. Please verify your email before logging in.',
          verificationRequired: true
        });
      } else {
        return res.status(403).json({ message: 'Account is suspended. Please contact support.' });
      }
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token to user and update last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      message: 'Login successful',
      accessToken,
      user
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// Refresh access token
exports.refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }
    
    // Verify refresh token
    let userData;
    try {
      userData = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Check if user exists and token matches
    const user = await User.findOne({ 
      where: { 
        id: userData.id,
        refreshToken
      } 
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();
    
    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    next(error);
  }
};

// Logout user
exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token in database
    if (req.user) {
      req.user.refreshToken = null;
      await req.user.save();
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  res.json({
    user: req.user
  });
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Find user with this verification token
    const user = await User.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    // Update user status
    await user.verifyEmail();
    
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    logger.error('Verify email error:', error);
    next(error);
  }
};

// Resend verification email
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If your email exists in our system, a verification link will be sent.' });
    }
    
    // Check if email already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();
    
    // In a production app, we would send an email with the verification link
    // For now, we'll return the token in the response for testing
    
    res.json({ 
      message: 'Verification email sent. Please check your inbox.',
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    req.user.password = newPassword;
    await req.user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

// Forgot password - Generate reset token
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // For security reasons, don't reveal if the email exists
      return res.json({ message: 'If your email exists in our system, a password reset link will be sent.' });
    }
    
    // Generate reset token
    const resetToken = await user.generatePasswordResetToken();
    
    // In a production app, we would send an email with the reset link
    // For now, we'll return the token in the response for testing
    
    res.json({ 
      message: 'Password reset link sent. Please check your email.',
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
};

// Reset password with token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    // Find user with this reset token
    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: { 
          // Use Sequelize's operator for greater than instead of MongoDB's $gt
          [require('sequelize').Op.gt]: new Date() 
        }
      } 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }
    
    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

// Handle social authentication callbacks from providers
// Social auth - Google
exports.googleCallback = async (req, res, next) => {
  try {
    const { id, emails, displayName, name, photos } = req.user;
    
    if (!emails || emails.length === 0) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    const email = emails[0].value;
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create a new user with Google info
      user = await User.create({
        firstName: name?.givenName || displayName.split(' ')[0] || 'Google',
        lastName: name?.familyName || displayName.split(' ').slice(1).join(' ') || 'User',
        email,
        // Generate a secure random password that the user won't need to know
        password: require('crypto').randomBytes(16).toString('hex'),
        googleId: id,
        profilePicture: photos && photos.length > 0 ? photos[0].value : null,
        emailVerified: true, // Google already verified the email
        status: 'active',
        subscriptionTier: 'free'
      });
    } else {
      // Update existing user with latest Google info
      user.googleId = id;
      if (photos && photos.length > 0) {
        user.profilePicture = photos[0].value;
      }
      user.emailVerified = true;
      user.status = 'active';
      await user.save();
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/social-callback?token=${accessToken}&userId=${user.id}`);
  } catch (error) {
    logger.error('Google auth callback error:', error);
    next(error);
  }
};

// Social auth - Facebook
exports.facebookCallback = async (req, res, next) => {
  try {
    const { id, emails, displayName, name, photos } = req.user;
    
    if (!emails || emails.length === 0) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    const email = emails[0].value;
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create a new user with Facebook info
      user = await User.create({
        firstName: name?.givenName || displayName.split(' ')[0] || 'Facebook',
        lastName: name?.familyName || displayName.split(' ').slice(1).join(' ') || 'User',
        email,
        // Generate a secure random password that the user won't need to know
        password: require('crypto').randomBytes(16).toString('hex'),
        facebookId: id,
        profilePicture: photos && photos.length > 0 ? photos[0].value : null,
        emailVerified: true, // Facebook already verified the email
        status: 'active',
        subscriptionTier: 'free'
      });
    } else {
      // Update existing user with latest Facebook info
      user.facebookId = id;
      if (photos && photos.length > 0) {
        user.profilePicture = photos[0].value;
      }
      user.emailVerified = true;
      user.status = 'active';
      await user.save();
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/social-callback?token=${accessToken}&userId=${user.id}`);
  } catch (error) {
    logger.error('Facebook auth callback error:', error);
    next(error);
  }
};

// Social auth - LinkedIn
exports.linkedinCallback = async (req, res, next) => {
  try {
    const { id, emails, displayName, name, photos } = req.user;
    
    if (!emails || emails.length === 0) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    const email = emails[0].value;
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create a new user with LinkedIn info
      user = await User.create({
        firstName: name?.givenName || displayName.split(' ')[0] || 'LinkedIn',
        lastName: name?.familyName || displayName.split(' ').slice(1).join(' ') || 'User',
        email,
        // Generate a secure random password that the user won't need to know
        password: require('crypto').randomBytes(16).toString('hex'),
        linkedinId: id,
        profilePicture: photos && photos.length > 0 ? photos[0].value : null,
        emailVerified: true, // LinkedIn already verified the email
        status: 'active',
        subscriptionTier: 'free'
      });
    } else {
      // Update existing user with latest LinkedIn info
      user.linkedinId = id;
      if (photos && photos.length > 0) {
        user.profilePicture = photos[0].value;
      }
      user.emailVerified = true;
      user.status = 'active';
      await user.save();
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/social-callback?token=${accessToken}&userId=${user.id}`);
  } catch (error) {
    logger.error('LinkedIn auth callback error:', error);
    next(error);
  }
};
