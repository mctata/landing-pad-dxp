const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const projectRoutes = require('./project.routes');
const templateRoutes = require('./template.routes');
const userRoutes = require('./user.routes');
const aiRoutes = require('./ai.routes');
const stripeRoutes = require('./stripe.routes');
const healthRoutes = require('./health.routes');

// Mount all route groups
router.use('/api/auth', authRoutes);
router.use('/api/projects', projectRoutes);
router.use('/api/templates', templateRoutes);
router.use('/api/users', userRoutes);
router.use('/api/ai', aiRoutes);
router.use('/api/stripe', stripeRoutes);
router.use('/api/health', healthRoutes);

module.exports = router;