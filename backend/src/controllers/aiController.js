const { validationResult } = require('express-validator');
const openaiService = require('../services/openaiService');
const logger = require('../utils/logger');

/**
 * AI controller responsible for handling AI-related requests
 */
class AIController {
  /**
   * Generate content for a specific element
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateContent(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { websiteId, pageId, elementType, prompt, tone, length } = req.body;
      
      logger.info(`Generating ${elementType} content for websiteId: ${websiteId}, pageId: ${pageId}`);
      
      const content = await openaiService.generateContent({
        elementType,
        prompt,
        tone,
        length
      });
      
      return res.status(200).json(content);
    } catch (error) {
      logger.error(`Error in generateContent: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error generating content',
        error: error.message 
      });
    }
  }

  /**
   * Generate layout structure based on website data and prompt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateLayout(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { websiteId, pageId, prompt, pageType } = req.body;
      
      logger.info(`Generating layout for websiteId: ${websiteId}, pageId: ${pageId}, pageType: ${pageType || 'landing'}`);
      
      const layout = await openaiService.generateLayout({
        websiteId,
        pageId,
        prompt,
        pageType
      });
      
      return res.status(200).json(layout);
    } catch (error) {
      logger.error(`Error in generateLayout: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error generating layout',
        error: error.message 
      });
    }
  }

  /**
   * Generate style recommendations including colors and typography
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateStyle(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { websiteId, prompt, existingColors, existingFonts } = req.body;
      
      logger.info(`Generating style for websiteId: ${websiteId}`);
      
      const style = await openaiService.generateStyle({
        websiteId,
        prompt,
        existingColors,
        existingFonts
      });
      
      return res.status(200).json(style);
    } catch (error) {
      logger.error(`Error in generateStyle: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error generating style recommendations',
        error: error.message 
      });
    }
  }

  /**
   * Modify existing content with AI (rewrite, expand, shorten, etc.)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async modifyContent(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { content, action, parameters } = req.body;
      
      logger.info(`Modifying content with action: ${action}`);
      
      const modifiedContent = await openaiService.modifyContent({
        content,
        action,
        parameters
      });
      
      return res.status(200).json(modifiedContent);
    } catch (error) {
      logger.error(`Error in modifyContent: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error modifying content',
        error: error.message 
      });
    }
  }

  /**
   * Generate AI suggestions based on website data and user prompt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSuggestions(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { websiteId, pageId } = req.params;
      const { type, prompt } = req.body;
      
      logger.info(`Getting ${type} suggestions for websiteId: ${websiteId}, pageId: ${pageId}`);
      
      const suggestions = await openaiService.generateSuggestions({
        websiteId,
        pageId,
        type,
        prompt
      });
      
      return res.status(200).json(suggestions);
    } catch (error) {
      logger.error(`Error in getSuggestions: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error generating suggestions',
        error: error.message 
      });
    }
  }

  /**
   * Generate color scheme based on industry, mood, or base color
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateColorScheme(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { industry, mood, baseColor } = req.body;
      
      logger.info(`Generating color scheme with industry: ${industry}, mood: ${mood}`);
      
      const colorScheme = await openaiService.generateColorScheme({
        industry,
        mood,
        baseColor
      });
      
      return res.status(200).json(colorScheme);
    } catch (error) {
      logger.error(`Error in generateColorScheme: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error generating color scheme',
        error: error.message 
      });
    }
  }

  /**
   * Generate font pairings based on style and industry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateFontPairings(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { style, industry } = req.body;
      
      logger.info(`Generating font pairings with style: ${style}, industry: ${industry}`);
      
      const fontPairings = await openaiService.generateFontPairings({
        style,
        industry
      });
      
      return res.status(200).json(fontPairings);
    } catch (error) {
      logger.error(`Error in generateFontPairings: ${error.message}`);
      return res.status(500).json({ 
        success: false,
        message: 'Error generating font pairings',
        error: error.message 
      });
    }
  }
}

module.exports = new AIController();