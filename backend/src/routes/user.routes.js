const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

// Get current user profile
router.get('/me', authenticate, userController.getCurrentUser);

// Update user profile
router.patch('/me', authenticate, userController.updateProfile);

// Get user by ID (admin only)
router.get('/:id', authenticate, userController.getUserById);

// Update user (admin only)
router.patch('/:id', authenticate, userController.updateUser);

// Delete user (admin only or self)
router.delete('/:id', authenticate, userController.deleteUser);

// Get all users (admin only)
router.get('/', authenticate, userController.getAllUsers);

module.exports = router;