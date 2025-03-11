const openaiService = require('../services/openaiService');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * AI Content Generation Controller
 */
const aiController = {
  /**
   * Generate content for a specific element
   * @route POST /api/ai/generate/content
   */
  async generateContent(req, res, next) {
    try {
      const { websiteId, pageId, elementType, prompt, tone, length } = req.body;
      
      // Log request
      logger.info('Content generation request', { 
        websiteId, 
        pageId, 
        elementType 
      });
      
      // Generate content using OpenAI service
      const content = await openaiService.generateContent({
        websiteId,
        pageId,
        elementType,
        prompt,
        tone,
        length
      });
      
      // Return generated content
      res.status(200).json(content);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Generate suggestions based on website data and user prompt
   * @route POST /api/ai/suggestions/:websiteId/:pageId
   */
  async generateSuggestions(req, res, next) {
    try {
      const { websiteId, pageId } = req.params;
      const { type, prompt } = req.body;
      
      // Log request
      logger.info('Suggestion generation request', { 
        websiteId, 
        pageId, 
        type 
      });
      
      // Generate suggestions using OpenAI service
      const suggestions = await openaiService.generateSuggestions({
        websiteId,
        pageId,
        type,
        prompt
      });
      
      // Return generated suggestions
      res.status(200).json(suggestions);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Modify existing content with AI
   * @route POST /api/ai/modify/content
   */
  async modifyContent(req, res, next) {
    try {
      const { content, action, parameters } = req.body;
      
      // Log request
      logger.info('Content modification request', { action });
      
      // Modify content using OpenAI service
      const modifiedContent = await openaiService.modifyContent({
        content,
        action,
        parameters
      });
      
      // Return modified content
      res.status(200).json(modifiedContent);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = aiController;
