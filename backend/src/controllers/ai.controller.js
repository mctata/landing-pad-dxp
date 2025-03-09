const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate website content based on user input
exports.generateContent = async (req, res, next) => {
  try {
    const { prompt, contentType } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    let systemPrompt;
    
    // Configure system prompt based on content type
    switch (contentType) {
      case 'headline':
        systemPrompt = 'You are a skilled copywriter specializing in creating compelling and concise website headlines. Create a headline based on the user\'s business or website description. Keep it under 10 words and make it attention-grabbing.';
        break;
      case 'description':
        systemPrompt = 'You are a professional copywriter who creates engaging website descriptions. Based on the user\'s description of their business or website, create a compelling 2-3 sentence description that highlights the key value proposition.';
        break;
      case 'about':
        systemPrompt = 'You are a professional content writer who creates compelling "About Us" sections for websites. Based on the user\'s description, create a thoughtful 2-4 paragraph "About" section that establishes credibility and connects with the audience.';
        break;
      case 'features':
        systemPrompt = 'You are a professional copywriter who specializes in highlighting product or service features. Based on the user\'s description, create 3-5 concise feature descriptions with compelling headlines and brief explanations.';
        break;
      case 'testimonial':
        systemPrompt = 'You are a professional content writer who creates realistic customer testimonials. Based on the user\'s description of their business or service, create 1-3 authentic-sounding testimonials from fictional satisfied customers.';
        break;
      default:
        systemPrompt = 'You are a professional website content writer. Create appropriate content based on the user\'s requirements.';
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
      max_tokens: 500
    });
    
    // Return the generated content
    res.json({
      content: response.choices[0].message.content.trim()
    });
  } catch (error) {
    console.error('AI content generation error:', error);
    next(error);
  }
};

// Generate color scheme suggestions
exports.generateColorScheme = async (req, res, next) => {
  try {
    const { industry, mood, baseColor } = req.body;
    
    // Build a prompt for the AI
    let prompt = 'Generate a website color scheme';
    
    if (industry) prompt += ` for a ${industry} website`;
    if (mood) prompt += ` with a ${mood} mood`;
    if (baseColor) prompt += ` using ${baseColor} as a base color`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional web designer specializing in color theory. Generate color schemes for websites. Respond with JSON containing exactly 5 colors: primary, secondary, accent, background, and text. Each color should be a hex code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    // Parse the response to extract colors
    const content = response.choices[0].message.content.trim();
    
    // Try to extract JSON from the response
    let colorScheme;
    try {
      // Find JSON in the response if it's not just pure JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        colorScheme = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found');
      }
    } catch (error) {
      // If parsing fails, return a default color scheme
      colorScheme = {
        primary: '#4361ee',
        secondary: '#3f37c9',
        accent: '#f72585',
        background: '#ffffff',
        text: '#212529'
      };
    }
    
    res.json({ colors: colorScheme });
  } catch (error) {
    console.error('AI color scheme generation error:', error);
    next(error);
  }
};

// Generate font pairing suggestions
exports.generateFontPairings = async (req, res, next) => {
  try {
    const { style, industry } = req.body;
    
    // Build a prompt for the AI
    let prompt = 'Suggest font pairings for a website';
    if (style) prompt += ` with a ${style} style`;
    if (industry) prompt += ` in the ${industry} industry`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a typography expert. Recommend font pairings for websites. Respond with JSON containing exactly 3 pairings, each with a heading font and a body font. Only use fonts that are widely available on Google Fonts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    // Parse the response
    const content = response.choices[0].message.content.trim();
    
    // Try to extract JSON from the response
    let fontPairings;
    try {
      // Find JSON in the response if it's not just pure JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fontPairings = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found');
      }
    } catch (error) {
      // If parsing fails, return default font pairings
      fontPairings = {
        pairings: [
          { heading: 'Montserrat', body: 'Open Sans' },
          { heading: 'Playfair Display', body: 'Source Sans Pro' },
          { heading: 'Roboto', body: 'Lato' }
        ]
      };
    }
    
    res.json(fontPairings);
  } catch (error) {
    console.error('AI font pairing generation error:', error);
    next(error);
  }
};
