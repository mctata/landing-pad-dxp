const OpenAI = require('openai');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Service class for OpenAI API interactions
 */
class OpenAIService {
  /**
   * Generate content based on prompt and parameters
   * @param {Object} params - Content generation parameters
   * @returns {Promise<Object>} Generated content
   */
  async generateContent(params) {
    try {
      const { websiteId, pageId, elementType, prompt, tone = 'professional', length = 'medium' } = params;
      
      // Build the prompt based on element type
      const systemPrompt = this._buildSystemPrompt(elementType, tone, length);
      
      // Log the request (removing sensitive data)
      logger.info('Generating content with OpenAI', {
        elementType,
        tone,
        length,
        websiteId,
        pageId
      });
      
      // Make API call to OpenAI
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: this._getMaxTokens(length),
        response_format: { type: 'json_object' }
      });
      
      // Parse and return the content
      const content = JSON.parse(response.choices[0].message.content);
      return content;
    } catch (error) {
      // Handle OpenAI API errors
      logger.error('OpenAI content generation error', {
        message: error.message,
        type: error.type,
        code: error.status
      });
      
      if (error.status === 429) {
        throw new APIError('AI service rate limit exceeded. Please try again later.', 429);
      } else if (error.status === 400) {
        throw new APIError('Invalid request to AI service. Please check your inputs.', 400);
      } else {
        throw new APIError('Error generating content with AI service.', 500);
      }
    }
  }
  
  /**
   * Generate suggestions based on website context and user prompt
   * @param {Object} params - Suggestion generation parameters
   * @returns {Promise<Array>} Generated suggestions
   */
  async generateSuggestions(params) {
    try {
      const { websiteId, pageId, type, prompt } = params;
      
      // Build the prompt based on suggestion type
      const systemPrompt = this._buildSuggestionPrompt(type);
      
      // Log the request
      logger.info('Generating suggestions with OpenAI', {
        websiteId, 
        pageId,
        type
      });
      
      // Make API call to OpenAI
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate suggestions for a ${type} with the following context: ${prompt}. Website ID: ${websiteId}, Page ID: ${pageId}`
          }
        ],
        temperature: 0.9,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });
      
      // Parse and return the suggestions
      const suggestions = JSON.parse(response.choices[0].message.content).suggestions;
      return suggestions;
    } catch (error) {
      // Handle OpenAI API errors
      logger.error('OpenAI suggestion generation error', {
        message: error.message,
        type: error.type,
        code: error.status
      });
      
      if (error.status === 429) {
        throw new APIError('AI service rate limit exceeded. Please try again later.', 429);
      } else {
        throw new APIError('Error generating suggestions with AI service.', 500);
      }
    }
  }
  
  /**
   * Modify existing content using AI
   * @param {Object} params - Content modification parameters
   * @returns {Promise<Object>} Modified content
   */
  async modifyContent(params) {
    try {
      const { content, action, parameters = {} } = params;
      
      // Build the prompt based on modification action
      const systemPrompt = this._buildModificationPrompt(action, parameters);
      
      // Log the request
      logger.info('Modifying content with OpenAI', { action });
      
      // Make API call to OpenAI
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
      
      // Parse and return the modified content
      const modifiedContent = JSON.parse(response.choices[0].message.content);
      return modifiedContent;
    } catch (error) {
      // Handle OpenAI API errors
      logger.error('OpenAI content modification error', {
        message: error.message,
        type: error.type,
        code: error.status
      });
      
      if (error.status === 429) {
        throw new APIError('AI service rate limit exceeded. Please try again later.', 429);
      } else {
        throw new APIError('Error modifying content with AI service.', 500);
      }
    }
  }
  
  /**
   * Helper method to build system prompts for content generation
   * @private
   */
  _buildSystemPrompt(elementType, tone, length) {
    let prompt;
    
    switch (elementType) {
      case 'text':
        prompt = `You are an expert copywriter who specializes in website content. 
        Create compelling ${tone} website text content with a ${length} length. 
        Your response should be in JSON format with fields for 'heading', 'subheading', and 'body'.`;
        break;
        
      case 'hero':
        prompt = `You are an expert in creating impactful hero sections for websites.
        Create a ${tone} hero section with a ${length} length.
        Your response should be in JSON format with fields for 'headline', 'subheadline', and 'ctaText'.`;
        break;
        
      case 'features':
        prompt = `You are an expert in showcasing product features on websites.
        Create ${tone} feature descriptions with a ${length} length.
        Your response should be in JSON format with an array of 'features', each with 'title', 'description', and 'iconSuggestion' fields.`;
        break;
        
      case 'testimonial':
        prompt = `You are an expert in creating authentic customer testimonials.
        Create a ${tone} testimonial with a ${length} length.
        Your response should be in JSON format with fields for 'quote', 'author', 'position', and 'company'.`;
        break;
        
      case 'pricing':
        prompt = `You are an expert in creating effective pricing sections.
        Create ${tone} pricing content with a ${length} length.
        Your response should be in JSON format with an array of 'plans', each with 'name', 'price', 'description', and 'features' array.`;
        break;
        
      default:
        prompt = `You are an expert copywriter who specializes in website content.
        Create compelling ${tone} content for a ${elementType} section with a ${length} length.
        Your response should be in JSON format with appropriate fields for this type of content.`;
    }
    
    return prompt;
  }
  
  /**
   * Helper method to build system prompts for suggestion generation
   * @private
   */
  _buildSuggestionPrompt(type) {
    switch (type) {
      case 'text':
        return `You are an expert copywriter who creates website text content.
        Generate 3 different text suggestions based on the user's prompt.
        Return a JSON object with a 'suggestions' array. Each suggestion should have 'id', 'type', 'title', and 'content' fields.
        For text suggestions, the content should include 'heading' and 'subheading' fields.`;
        
      case 'layout':
        return `You are an expert website designer who creates effective layouts.
        Generate 3 different layout suggestions based on the user's prompt.
        Return a JSON object with a 'suggestions' array. Each suggestion should have 'id', 'type', 'title', and 'content' fields.
        For layout suggestions, the content should include 'structure' and 'elements' array fields.`;
        
      case 'style':
        return `You are an expert web designer who creates beautiful website styles.
        Generate 3 different style suggestions based on the user's prompt.
        Return a JSON object with a 'suggestions' array. Each suggestion should have 'id', 'type', 'title', and 'content' fields.
        For style suggestions, the content should include 'colors' object (with primary, secondary, accent, background) and 'typography' object (with heading and body fonts).`;
        
      default:
        return `You are an expert website creator. Generate 3 different suggestions based on the user's prompt.
        Return a JSON object with a 'suggestions' array. Each suggestion should have 'id', 'type', 'title', and 'content' fields appropriate for the type.`;
    }
  }
  
  /**
   * Helper method to build system prompts for content modification
   * @private
   */
  _buildModificationPrompt(action, parameters) {
    switch (action) {
      case 'rewrite':
        return `You are an expert copywriter. Rewrite the following content while maintaining its meaning.
        Return a JSON object with a 'content' field containing the rewritten text.`;
        
      case 'expand':
        return `You are an expert copywriter. Expand the following content with additional details and information.
        Return a JSON object with a 'content' field containing the expanded text.`;
        
      case 'shorten':
        return `You are an expert copywriter. Shorten the following content while preserving its key message.
        Return a JSON object with a 'content' field containing the shortened text.`;
        
      case 'changeStyle':
        const style = parameters.style || 'professional';
        return `You are an expert copywriter. Rewrite the following content in a ${style} tone.
        Return a JSON object with a 'content' field containing the rewritten text.`;
        
      case 'proofread':
        return `You are an expert editor. Proofread the following content for grammar, spelling, and clarity.
        Return a JSON object with a 'content' field containing the proofread text.`;
        
      default:
        return `You are an expert copywriter. Modify the following content based on the user's needs.
        Return a JSON object with a 'content' field containing the modified text.`;
    }
  }
  
  /**
   * Helper method to determine max tokens based on length
   * @private
   */
  _getMaxTokens(length) {
    switch (length) {
      case 'short':
        return 500;
      case 'medium':
        return 1000;
      case 'long':
        return 2000;
      default:
        return 1000;
    }
  }
}

module.exports = new OpenAIService();
