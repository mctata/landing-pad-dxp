const logger = require('../utils/logger');
const { Website, User, Deployment, Domain, Content } = require('../models');
const { Op } = require('sequelize');
const queueService = require('../services/queueService');
const deploymentService = require('../services/deploymentService');

/**
 * Controller for admin operations
 */
const adminController = {
  /**
   * Get dashboard statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStats(req, res, next) {
    try {
      // Get counts of various entities
      const [
        websiteCount,
        userCount,
        deploymentCount,
        domainCount,
        activeDeploymentCount,
        failedDeploymentCount,
        contentCount,
        pendingDomainCount,
        queueStats
      ] = await Promise.all([
        Website.count(),
        User.count(),
        Deployment.count(),
        Domain.count(),
        Deployment.count({ where: { status: 'in_progress' } }),
        Deployment.count({ where: { status: 'failed' } }),
        Content.count(),
        Domain.count({ where: { status: 'pending' } }),
        queueService.getQueueStatus()
      ]);
      
      // Get recent activities
      const recentDeployments = await Deployment.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      const recentDomains = await Domain.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name']
          }
        ]
      });
      
      // Calculate success rate for deployments
      const totalCompletedDeployments = await Deployment.count({
        where: {
          status: {
            [Op.in]: ['success', 'failed']
          }
        }
      });
      
      const successfulDeployments = await Deployment.count({
        where: {
          status: 'success'
        }
      });
      
      const deploymentSuccessRate = totalCompletedDeployments > 0
        ? Math.round((successfulDeployments / totalCompletedDeployments) * 100)
        : 100;
      
      // Return all statistics
      res.status(200).json({
        counts: {
          websites: websiteCount,
          users: userCount,
          deployments: deploymentCount,
          domains: domainCount,
          content: contentCount
        },
        deployments: {
          active: activeDeploymentCount,
          failed: failedDeploymentCount,
          successRate: deploymentSuccessRate
        },
        domains: {
          pending: pendingDomainCount
        },
        queues: queueStats,
        recentActivity: {
          deployments: recentDeployments,
          domains: recentDomains
        }
      });
    } catch (error) {
      logger.error('Error getting admin stats:', error);
      next(error);
    }
  },
  
  /**
   * Get list of websites
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getWebsites(req, res, next) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;
      
      // Build where clause for search
      const whereClause = {};
      if (search) {
        whereClause.name = {
          [Op.iLike]: `%${search}%`
        };
      }
      
      // Get websites with pagination
      const { count, rows } = await Website.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      res.status(200).json({
        items: rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error getting websites:', error);
      next(error);
    }
  },
  
  /**
   * Get website details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getWebsiteDetails(req, res, next) {
    try {
      const { websiteId } = req.params;
      
      // Get website with related data
      const website = await Website.findByPk(websiteId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Domain,
            as: 'domains'
          },
          {
            model: Deployment,
            as: 'deployments',
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      if (!website) {
        return res.status(404).json({ message: 'Website not found' });
      }
      
      // Get deployment stats
      const deploymentStats = await Deployment.findAll({
        attributes: [
          'status',
          [Website.sequelize.fn('COUNT', Website.sequelize.col('status')), 'count']
        ],
        where: {
          websiteId
        },
        group: ['status']
      });
      
      // Format deployment stats
      const formattedDeploymentStats = {};
      deploymentStats.forEach(stat => {
        formattedDeploymentStats[stat.status] = parseInt(stat.getDataValue('count'));
      });
      
      res.status(200).json({
        website,
        stats: {
          deployments: formattedDeploymentStats
        }
      });
    } catch (error) {
      logger.error('Error getting website details:', error);
      next(error);
    }
  },
  
  /**
   * Get list of deployments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getDeployments(req, res, next) {
    try {
      const { page = 1, limit = 10, status, websiteId } = req.query;
      const offset = (page - 1) * limit;
      
      // Build where clause for filters
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }
      if (websiteId) {
        whereClause.websiteId = websiteId;
      }
      
      // Get deployments with pagination
      const { count, rows } = await Deployment.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      res.status(200).json({
        items: rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error getting deployments:', error);
      next(error);
    }
  },
  
  /**
   * Get list of domains
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getDomains(req, res, next) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;
      
      // Build where clause for filters
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }
      if (search) {
        whereClause.name = {
          [Op.iLike]: `%${search}%`
        };
      }
      
      // Get domains with pagination
      const { count, rows } = await Domain.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name']
          }
        ]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      res.status(200).json({
        items: rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error getting domains:', error);
      next(error);
    }
  },
  
  /**
   * Get queue dashboard data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getQueueDashboard(req, res, next) {
    try {
      // Get queue statistics
      const queueStats = await queueService.getQueueStatus();
      
      // Get recent failed jobs
      const recentFailedDeployments = await Deployment.findAll({
        where: {
          status: 'failed'
        },
        limit: 10,
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name']
          }
        ]
      });
      
      // Get active jobs
      const activeDeployments = await Deployment.findAll({
        where: {
          status: 'in_progress'
        },
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['id', 'name']
          }
        ]
      });
      
      // Get deployment success rates by day (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const deploymentsByDay = await Deployment.findAll({
        attributes: [
          [Website.sequelize.fn('DATE', Website.sequelize.col('createdAt')), 'date'],
          'status',
          [Website.sequelize.fn('COUNT', Website.sequelize.col('status')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: sevenDaysAgo
          },
          status: {
            [Op.in]: ['success', 'failed']
          }
        },
        group: [
          Website.sequelize.fn('DATE', Website.sequelize.col('createdAt')),
          'status'
        ],
        order: [
          [Website.sequelize.fn('DATE', Website.sequelize.col('createdAt')), 'ASC']
        ]
      });
      
      // Format the daily stats
      const dailyStats = {};
      
      deploymentsByDay.forEach(stat => {
        const date = stat.getDataValue('date');
        const status = stat.status;
        const count = parseInt(stat.getDataValue('count'));
        
        if (!dailyStats[date]) {
          dailyStats[date] = {
            success: 0,
            failed: 0
          };
        }
        
        dailyStats[date][status] = count;
      });
      
      // Convert to array format for easier charting
      const timeSeriesData = Object.keys(dailyStats).map(date => ({
        date,
        success: dailyStats[date].success || 0,
        failed: dailyStats[date].failed || 0,
        total: (dailyStats[date].success || 0) + (dailyStats[date].failed || 0)
      }));
      
      // Get error distribution
      const errorCategories = await Deployment.findAll({
        attributes: [
          'errorCategory',
          [Website.sequelize.fn('COUNT', Website.sequelize.col('errorCategory')), 'count']
        ],
        where: {
          status: 'failed',
          errorCategory: {
            [Op.not]: null
          }
        },
        group: ['errorCategory'],
        order: [[Website.sequelize.fn('COUNT', Website.sequelize.col('errorCategory')), 'DESC']]
      });
      
      // Format error categories
      const formattedErrorCategories = errorCategories.map(category => ({
        category: category.errorCategory,
        count: parseInt(category.getDataValue('count'))
      }));
      
      res.status(200).json({
        queues: queueStats,
        recentFailures: recentFailedDeployments,
        activeJobs: activeDeployments,
        timeSeries: timeSeriesData,
        errorDistribution: formattedErrorCategories
      });
    } catch (error) {
      logger.error('Error getting queue dashboard:', error);
      next(error);
    }
  },
  
  /**
   * Retry a failed deployment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async retryDeployment(req, res, next) {
    try {
      const { deploymentId } = req.params;
      
      // Get the deployment
      const deployment = await Deployment.findByPk(deploymentId);
      
      if (!deployment) {
        return res.status(404).json({ message: 'Deployment not found' });
      }
      
      if (deployment.status !== 'failed') {
        return res.status(400).json({ message: 'Only failed deployments can be retried' });
      }
      
      // Create a new deployment based on the failed one
      const newDeployment = await deploymentService.createDeployment({
        websiteId: deployment.websiteId,
        userId: req.user.id, // Use the current admin user
        status: 'queued',
        version: `retry-${deployment.id}`,
        commitMessage: `Retry of failed deployment ${deployment.id}`
      });
      
      // Queue the new deployment
      await queueService.queueDeployment(
        newDeployment.id, 
        newDeployment.websiteId, 
        newDeployment.userId,
        { priority: 10 } // Higher priority for retries
      );
      
      res.status(200).json({
        message: 'Deployment retry initiated',
        originalDeployment: deployment.id,
        newDeployment: newDeployment.id
      });
    } catch (error) {
      logger.error('Error retrying deployment:', error);
      next(error);
    }
  },
  
  /**
   * Pause the deployment queue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async pauseQueue(req, res, next) {
    try {
      await queueService.pauseDeploymentQueue();
      res.status(200).json({ message: 'Deployment queue paused successfully' });
    } catch (error) {
      logger.error('Error pausing queue:', error);
      next(error);
    }
  },
  
  /**
   * Resume the deployment queue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async resumeQueue(req, res, next) {
    try {
      await queueService.resumeDeploymentQueue();
      res.status(200).json({ message: 'Deployment queue resumed successfully' });
    } catch (error) {
      logger.error('Error resuming queue:', error);
      next(error);
    }
  }
};

module.exports = adminController;