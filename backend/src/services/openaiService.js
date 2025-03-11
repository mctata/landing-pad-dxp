const { Configuration, OpenAIApi } = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    // Initialize OpenAI with API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.error('OpenAI API key is not set. AI features will not function properly.');
    }
    
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    
    this.openai = new OpenAIApi(configuration);
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'; // Default to GPT-3.5, but allow configuration
  }

  /**
   * Generate content for website elements based on provided parameters
   * @param {Object} params - Content generation parameters
   * @param {string} params.elementType - Type of element to generate content for
   * @param {string} params.prompt - User's prompt for content generation
   * @param {string} params.tone - Desired tone (professional, casual, etc.)
   * @param {string} params.length - Desired length (short, medium, long)
   * @returns {Promise<Object>} - Generated content appropriate for the element type
   */
  async generateContent(params) {
    const { elementType, prompt, tone = 'professional', length = 'medium' } = params;
    
    // Set the system prompt based on element type
    let systemPrompt = `You are an expert website content generator. 
Create ${length} content for a ${elementType} with a ${tone} tone based on the user's prompt.
Format your response as JSON with appropriate fields for the element type.`;

    // Add specific fields expected in the response based on element type
    switch (elementType) {
      case 'hero':
        systemPrompt += `
Return JSON with these fields:
{
  "headline": "main headline (attention grabbing, 5-9 words)",
  "subheadline": "supporting text (1-2 sentences)",
  "ctaText": "call to action button text (3-5 words)"
}`;
        break;
      case 'features':
        systemPrompt += `
Return JSON with these fields:
{
  "heading": "section heading",
  "subheading": "section explanation",
  "features": [
    { "title": "feature name", "description": "feature explanation" },
    { "title": "feature name", "description": "feature explanation" },
    { "title": "feature name", "description": "feature explanation" }
  ]
}`;
        break;
      case 'testimonial':
        systemPrompt += `
Return JSON with these fields:
{
  "quote": "testimonial quote (1-3 sentences)",
  "author": "person's name",
  "position": "job title and company"
}`;
        break;
      case 'about':
        systemPrompt += `
Return JSON with these fields:
{
  "heading": "about section heading",
  "content": "full about section text",
  "mission": "mission statement (optional)",
  "vision": "vision statement (optional)"
}`;
        break;
      case 'cta':
        systemPrompt += `
Return JSON with these fields:
{
  "heading": "call to action heading",
  "description": "supporting text",
  "buttonText": "button text"
}`;
        break;
      case 'pricing':
        systemPrompt += `
Return JSON with these fields:
{
  "heading": "pricing section heading",
  "subheading": "pricing section description",
  "plans": [
    {
      "name": "plan name",
      "price": "price (with period)",
      "description": "short plan description",
      "features": ["feature 1", "feature 2", "feature 3", "feature 4"]
    },
    {
      "name": "plan name",
      "price": "price (with period)",
      "description": "short plan description",
      "features": ["feature 1", "feature 2", "feature 3", "feature 4"]
    }
  ],
  "disclaimer": "optional disclaimer text"
}`;
        break;
      case 'text':
      default:
        systemPrompt += `
Return JSON with these fields:
{
  "heading": "section heading",
  "subheading": "section subheading (optional)",
  "body": "main text content"
}`;
        break;
    }

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error generating content with OpenAI:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Generate suggestions for content, layout, or style
   * @param {Object} params - Suggestion generation parameters
   * @param {string} params.websiteId - Website ID for context
   * @param {string} params.pageId - Page ID for context
   * @param {string} params.type - Type of suggestion to generate
   * @param {string} params.prompt - User's prompt for suggestion generation
   * @returns {Promise<Array>} - Array of suggestions
   */
  async generateSuggestions(params) {
    const { websiteId, pageId, type, prompt } = params;
    
    let systemPrompt = `You are an expert website design assistant.
Generate several suggestions for ${type} based on the user's prompt.
Format your response as a JSON array of suggestion objects.`;

    // Add specific structure based on suggestion type
    switch (type) {
      case 'text':
        systemPrompt += `
Return a JSON array of 3 suggestions with this structure:
[
  {
    "id": "1",
    "type": "text",
    "title": "brief descriptive title for this suggestion",
    "content": {
      "heading": "suggested heading",
      "subheading": "suggested subheading"
    }
  },
  {
    "id": "2",
    "type": "text",
    "title": "brief descriptive title for this suggestion",
    "content": {
      "heading": "suggested heading",
      "subheading": "suggested subheading"
    }
  },
  {
    "id": "3",
    "type": "text",
    "title": "brief descriptive title for this suggestion",
    "content": {
      "heading": "suggested heading",
      "subheading": "suggested subheading"
    }
  }
]`;
        break;
      case 'layout':
        systemPrompt += `
Return a JSON array of 3 suggestions with this structure:
[
  {
    "id": "1",
    "type": "layout",
    "title": "brief descriptive title for this layout",
    "content": {
      "structure": "described flow of sections",
      "elements": ["element 1", "element 2", "element 3", "element 4", "element 5"]
    }
  },
  {
    "id": "2",
    "type": "layout",
    "title": "brief descriptive title for this layout",
    "content": {
      "structure": "described flow of sections",
      "elements": ["element 1", "element 2", "element 3", "element 4", "element 5"]
    }
  },
  {
    "id": "3",
    "type": "layout",
    "title": "brief descriptive title for this layout",
    "content": {
      "structure": "described flow of sections",
      "elements": ["element 1", "element 2", "element 3", "element 4", "element 5"]
    }
  }
]`;
        break;
      case 'style':
        systemPrompt += `
Return a JSON array of 3 suggestions with this structure:
[
  {
    "id": "1",
    "type": "style",
    "title": "brief descriptive title for this style",
    "content": {
      "colors": {
        "primary": "#hexcolor",
        "secondary": "#hexcolor",
        "accent": "#hexcolor",
        "background": "#hexcolor",
        "text": "#hexcolor"
      },
      "typography": {
        "heading": "font name",
        "body": "font name"
      }
    }
  },
  {
    "id": "2",
    "type": "style",
    "title": "brief descriptive title for this style",
    "content": {
      "colors": {
        "primary": "#hexcolor",
        "secondary": "#hexcolor",
        "accent": "#hexcolor",
        "background": "#hexcolor",
        "text": "#hexcolor"
      },
      "typography": {
        "heading": "font name",
        "body": "font name"
      }
    }
  },
  {
    "id": "3",
    "type": "style",
    "title": "brief descriptive title for this style",
    "content": {
      "colors": {
        "primary": "#hexcolor",
        "secondary": "#hexcolor",
        "accent": "#hexcolor",
        "background": "#hexcolor",
        "text": "#hexcolor"
      },
      "typography": {
        "heading": "font name",
        "body": "font name"
      }
    }
  }
]`;
        break;
      default:
        systemPrompt += `
Return a JSON array of 3 suggestions with this structure:
[
  {
    "id": "1",
    "type": "${type}",
    "title": "brief descriptive title for this suggestion",
    "content": {
      // Include relevant fields for this suggestion type
    }
  }
]`;
        break;
    }

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error generating suggestions with OpenAI:', error);
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }
  }

  /**
   * Modify existing content with AI (rewrite, expand, shorten, etc.)
   * @param {Object} params - Content modification parameters
   * @param {string} params.content - Original content to modify
   * @param {string} params.action - Action to perform (rewrite, expand, shorten, changeStyle, proofread)
   * @param {Object} params.parameters - Additional parameters for the action
   * @returns {Promise<Object>} - Modified content
   */
  async modifyContent(params) {
    const { content, action, parameters = {} } = params;
    
    // Create a system prompt based on the requested action
    let systemPrompt;
    switch (action) {
      case 'rewrite':
        systemPrompt = `You are an expert content rewriter. 
Rewrite the provided content while preserving its meaning and intent, but using different wording.
The tone should be ${parameters.tone || 'professional'}.
Return your response as a JSON object with a single field 'content' containing the rewritten text.`;
        break;
      case 'expand':
        systemPrompt = `You are an expert content expander. 
Expand the provided content with additional relevant details and supporting points.
Aim to make the content about ${parameters.factor || '50%'} longer.
Return your response as a JSON object with a single field 'content' containing the expanded text.`;
        break;
      case 'shorten':
        systemPrompt = `You are an expert content editor. 
Condense the provided content while preserving its key messages and important points.
Aim to make the content about ${parameters.factor || '50%'} shorter.
Return your response as a JSON object with a single field 'content' containing the shortened text.`;
        break;
      case 'changeStyle':
        systemPrompt = `You are an expert content stylist. 
Rewrite the provided content in a ${parameters.style || 'professional'} style.
Preserve the meaning and key points while changing the tone and style of writing.
Return your response as a JSON object with a single field 'content' containing the restyled text.`;
        break;
      case 'proofread':
        systemPrompt = `You are an expert proofreader and editor. 
Correct any grammar, spelling, or punctuation errors in the provided content.
Improve clarity and readability without changing the meaning.
Return your response as a JSON object with a single field 'content' containing the proofread text.`;
        break;
      default:
        systemPrompt = `You are an expert content editor. 
Modify the provided content according to the user's instructions.
Return your response as a JSON object with a single field 'content' containing the modified text.`;
        break;
    }

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error modifying content with OpenAI:', error);
      throw new Error(`Failed to modify content: ${error.message}`);
    }
  }

  /**
   * Generate layout structure for a page based on website data and prompt
   * @param {Object} params - Layout generation parameters
   * @param {string} params.websiteId - Website ID for context
   * @param {string} params.pageId - Page ID for context
   * @param {string} params.prompt - User's prompt for layout
   * @param {string} params.pageType - Type of page (landing, about, services, blog)
   * @returns {Promise<Object>} - Generated layout structure and elements
   */
  async generateLayout(params) {
    const { websiteId, pageId, prompt, pageType = 'landing' } = params;
    
    const systemPrompt = `You are an expert website layout designer.
Generate a structured layout for a ${pageType} page based on the user's prompt.
Your response should be a JSON object with two key properties:
1. 'structure' - containing overall layout information
2. 'elements' - an array of elements in the layout

For 'structure', include:
- type: the page type ("${pageType}")
- sections: array of section types in order
- layout: the overall layout approach (e.g., "single-column", "multi-column")
- spacing: spacing description (e.g., "compact", "comfortable")

For 'elements', include objects with:
- id: unique element identifier
- type: element type (e.g., "header", "hero", "features")
- position: relative position ("top", "after-header", etc.)
- settings: an object with element-specific settings

Format your response as a JSON object with this structure:
{
  "structure": {
    "type": "${pageType}",
    "sections": ["header", "hero", "features", "..."],
    "layout": "layout-type",
    "spacing": "spacing-description"
  },
  "elements": [
    {
      "id": "element-1",
      "type": "element-type",
      "position": "position",
      "settings": {
        // Element-specific settings
      }
    },
    // Additional elements...
  ]
}`;

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error generating layout with OpenAI:', error);
      throw new Error(`Failed to generate layout: ${error.message}`);
    }
  }

  /**
   * Generate style recommendations including colors and typography
   * @param {Object} params - Style generation parameters
   * @param {string} params.websiteId - Website ID for context
   * @param {string} params.prompt - User's prompt for style
   * @param {Object} params.existingColors - Existing color scheme (optional)
   * @param {Object} params.existingFonts - Existing typography (optional)
   * @returns {Promise<Object>} - Generated style recommendations
   */
  async generateStyle(params) {
    const { websiteId, prompt, existingColors, existingFonts } = params;
    
    // Construct a context string for existing styles if provided
    let existingStyleContext = '';
    if (existingColors) {
      existingStyleContext += `\nExisting colors: ${JSON.stringify(existingColors)}`;
    }
    if (existingFonts) {
      existingStyleContext += `\nExisting typography: ${JSON.stringify(existingFonts)}`;
    }
    
    const systemPrompt = `You are an expert website visual designer.
Generate comprehensive style recommendations based on the user's prompt.${existingStyleContext}
Your recommendations should follow modern web design principles and be aesthetically cohesive.

Format your response as a JSON object with these key properties:

1. 'colors' - a color scheme object with:
   - primary: main brand color
   - secondary: secondary brand color
   - accent: accent color for highlights and CTAs
   - background: background color
   - text: main text color
   - headings: headings text color
   - lightBackground: lighter background for alternate sections
   - borders: color for borders and separators

2. 'typography' - typography recommendations with:
   - headingFont: font for headings (use Google Fonts available options)
   - bodyFont: font for body text (use Google Fonts available options)
   - baseSize: base font size in pixels
   - scaleRatio: type scale ratio for headings
   - lineHeight: base line height

3. 'spacing' - spacing recommendations with:
   - base: base spacing unit in pixels
   - scale: spacing scale ratio

Return your response as a JSON object with this structure:
{
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode",
    "headings": "#hexcode",
    "lightBackground": "#hexcode",
    "borders": "#hexcode"
  },
  "typography": {
    "headingFont": "font name",
    "bodyFont": "font name",
    "baseSize": number,
    "scaleRatio": number,
    "lineHeight": number
  },
  "spacing": {
    "base": number,
    "scale": number
  }
}`;

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error generating style with OpenAI:', error);
      throw new Error(`Failed to generate style recommendations: ${error.message}`);
    }
  }

  /**
   * Generate color scheme based on industry, mood or base color
   * @param {Object} params - Color scheme parameters
   * @param {string} params.industry - Industry category
   * @param {string} params.mood - Mood/feeling
   * @param {string} params.baseColor - Base color to build upon
   * @returns {Promise<Object>} - Generated color scheme
   */
  async generateColorScheme(params) {
    const { industry, mood, baseColor } = params;
    
    let contextPrompt = 'Generate a cohesive color scheme';
    if (industry) contextPrompt += ` for the ${industry} industry`;
    if (mood) contextPrompt += ` with a ${mood} mood/feeling`;
    if (baseColor) contextPrompt += ` based on the color ${baseColor}`;
    
    const systemPrompt = `You are an expert color designer for websites.
${contextPrompt}.
Create a professional and harmonious color scheme that works well for web interfaces.

Return your response as a JSON object with these color values:
{
  "primary": "#hexcolor",
  "secondary": "#hexcolor",
  "accent": "#hexcolor",
  "background": "#hexcolor",
  "text": "#hexcolor",
  "headings": "#hexcolor",
  "lightBackground": "#hexcolor",
  "borders": "#hexcolor"
}

Ensure all colors have sufficient contrast for accessibility.`;

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate a color scheme' }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error generating color scheme with OpenAI:', error);
      throw new Error(`Failed to generate color scheme: ${error.message}`);
    }
  }

  /**
   * Generate font pairings based on style and industry
   * @param {Object} params - Font parameters
   * @param {string} params.style - Design style
   * @param {string} params.industry - Industry category
   * @returns {Promise<Array>} - Array of font pairing objects
   */
  async generateFontPairings(params) {
    const { style, industry } = params;
    
    let contextPrompt = 'Generate font pairings';
    if (style) contextPrompt += ` with a ${style} style`;
    if (industry) contextPrompt += ` suitable for the ${industry} industry`;
    
    const systemPrompt = `You are an expert typography designer for websites.
${contextPrompt}.
Create 3 professional font pairings using Google Fonts.
Each pairing should have a heading font and a complementary body font.

Return your response as a JSON array with this structure:
[
  {
    "heading": "heading font name",
    "body": "body font name"
  },
  {
    "heading": "heading font name",
    "body": "body font name"
  },
  {
    "heading": "heading font name",
    "body": "body font name"
  }
]

Use only fonts available in Google Fonts. Ensure the pairings are harmonious and appropriate for web use.`;

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate font pairings' }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      logger.error('Error generating font pairings with OpenAI:', error);
      throw new Error(`Failed to generate font pairings: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();