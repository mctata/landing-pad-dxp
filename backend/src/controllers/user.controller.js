const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Get the current user's profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

/**
 * Get a user by ID (admin only)
 */
exports.getUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    logger.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

/**
 * Update the current user's profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out sensitive fields that shouldn't be updated directly
    const { password, role, status, emailVerified, ...updateData } = req.body;

    // Update user data
    await user.update(updateData);
    
    res.status(200).json(user);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

/**
 * Update a user (admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Admin can update all fields
    await user.update(req.body);
    
    res.status(200).json(user);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

/**
 * Delete a user (admin only or self)
 */
exports.deleteUser = async (req, res) => {
  try {
    // Can only delete if admin or self
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};