const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');
const { User, Website, Deployment, Domain } = require('../models');
const { Op } = require('sequelize');

/**
 * Controller for admin dashboard functionality
 */
const adminController = {
  /**
   * Get statistics for the admin dashboard
   * @route GET /api/admin/stats
   */
  async getStats(req, res, next) {
    try {
      // Check if the user is an admin
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access', 403);
      }

      // Get counts
      const [
        userCount,
        websiteCount,
        deploymentCount,
        domainCount
      ] = await Promise.all([
        User.count(),
        Website.count(),
        Deployment.count(),
        Domain.count()
      ]);

      // Get recent deployments
      const recentDeployments = await Deployment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['name']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Get failed deployments
      const failedDeployments = await Deployment.count({
        where: {
          status: 'failed'
        }
      });

      // Get active domains
      const activeDomains = await Domain.count({
        where: {
          status: 'active'
        }
      });

      res.status(200).json({
        stats: {
          users: userCount,
          websites: websiteCount,
          deployments: deploymentCount,
          domains: domainCount,
          failedDeployments,
          activeDomains
        },
        recentDeployments
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all websites with pagination
   * @route GET /api/admin/websites
   */
  async getWebsites(req, res, next) {
    try {
      // Check if the user is an admin
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access', 403);
      }

      const { page = 1, limit = 10, search = '', status } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // Build query conditions
      const whereClause = {};
      
      if (search) {
        whereClause.name = {
          [Op.iLike]: `%${search}%`
        };
      }

      if (status) {
        whereClause.status = status;
      }

      // Execute query with pagination
      const { count, rows } = await Website.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit, 10),
        offset,
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Calculate pagination info
      const totalItems = count;
      const totalPages = Math.ceil(totalItems / parseInt(limit, 10));

      res.status(200).json({
        websites: rows,
        pagination: {
          totalItems,
          itemsPerPage: parseInt(limit, 10),
          currentPage: parseInt(page, 10),
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all deployments with pagination
   * @route GET /api/admin/deployments
   */
  async getDeployments(req, res, next) {
    try {
      // Check if the user is an admin
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access', 403);
      }

      const { page = 1, limit = 10, status, websiteId } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // Build query conditions
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }

      if (websiteId) {
        whereClause.websiteId = websiteId;
      }

      // Execute query with pagination
      const { count, rows } = await Deployment.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit, 10),
        offset,
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
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Calculate pagination info
      const totalItems = count;
      const totalPages = Math.ceil(totalItems / parseInt(limit, 10));

      res.status(200).json({
        deployments: rows,
        pagination: {
          totalItems,
          itemsPerPage: parseInt(limit, 10),
          currentPage: parseInt(page, 10),
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all domains with pagination
   * @route GET /api/admin/domains
   */
  async getDomains(req, res, next) {
    try {
      // Check if the user is an admin
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access', 403);
      }

      const { page = 1, limit = 10, status, search = '', websiteId } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // Build query conditions
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }

      if (websiteId) {
        whereClause.websiteId = websiteId;
      }

      if (search) {
        whereClause.name = {
          [Op.iLike]: `%${search}%`
        };
      }

      // Execute query with pagination
      const { count, rows } = await Domain.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit, 10),
        offset,
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
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Calculate pagination info
      const totalItems = count;
      const totalPages = Math.ceil(totalItems / parseInt(limit, 10));

      res.status(200).json({
        domains: rows,
        pagination: {
          totalItems,
          itemsPerPage: parseInt(limit, 10),
          currentPage: parseInt(page, 10),
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get detailed information about a website
   * @route GET /api/admin/websites/:websiteId
   */
  async getWebsiteDetails(req, res, next) {
    try {
      // Check if the user is an admin
      if (req.user.role !== 'admin') {
        throw new APIError('Unauthorized access', 403);
      }

      const { websiteId } = req.params;

      // Get website with related data
      const website = await Website.findByPk(websiteId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'subscriptionTier']
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
        throw new APIError('Website not found', 404);
      }

      res.status(200).json({ website });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;