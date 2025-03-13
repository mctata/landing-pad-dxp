const logger = require('../utils/logger');
const { Deployment, Website } = require('../models');
const { Op } = require('sequelize');
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const crypto = require('crypto');

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  buildDir: process.env.BUILD_DIR || path.join(os.tmpdir(), 'landingpad-builds'),
  deploymentEndpoint: process.env.DEPLOYMENT_API_ENDPOINT || 'https://api.vercel.com/v1/deployments',
  apiToken: process.env.VERCEL_API_TOKEN || process.env.API_KEY,
  defaultHost: process.env.DEFAULT_HOST || 'landingpad.digital',
};

// Ensure build directory exists
try {
  if (!fs.existsSync(DEPLOYMENT_CONFIG.buildDir)) {
    execSync(`mkdir -p ${DEPLOYMENT_CONFIG.buildDir}`);
  }
} catch (error) {
  logger.error('Failed to create build directory:', error);
}

/**
 * Service for managing website deployments
 */
const deploymentService = {
  /**
   * Create a new deployment
   * @param {Object} data - Deployment data
   * @returns {Promise<Object>} - Created deployment
   */
  async createDeployment(data) {
    try {
      const deployment = await Deployment.create({
        websiteId: data.websiteId,
        userId: data.userId,
        status: data.status || 'queued',
        version: data.version,
        commitMessage: data.commitMessage || 'User initiated deployment'
      });
      
      logger.info(`Deployment created: ${deployment.id} for website ${deployment.websiteId}`);
      
      return deployment;
    } catch (error) {
      logger.error('Error creating deployment:', error);
      throw error;
    }
  },
  
  /**
   * Get deployments for a website
   * @param {string} websiteId - Website ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} - Deployments with pagination
   */
  async getDeployments(websiteId, options = {}) {
    try {
      const { limit = 10, page = 1 } = options;
      const offset = (page - 1) * limit;
      
      // Execute query with pagination
      const { count, rows } = await Deployment.findAndCountAll({
        where: {
          websiteId: websiteId
        },
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']]
      });
      
      // Calculate pagination info
      const totalItems = count;
      const totalPages = Math.ceil(totalItems / limit);
      
      return {
        items: rows,
        pagination: {
          totalItems,
          itemsPerPage: limit,
          currentPage: page,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching deployments:', error);
      throw error;
    }
  },
  
  /**
   * Get a deployment by ID
   * @param {string} deploymentId - Deployment ID
   * @returns {Promise<Object|null>} - Deployment or null if not found
   */
  async getDeploymentById(deploymentId) {
    try {
      return await Deployment.findByPk(deploymentId);
    } catch (error) {
      logger.error('Error fetching deployment by ID:', error);
      throw error;
    }
  },
  
  /**
   * Update a deployment
   * @param {string} deploymentId - Deployment ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object|null>} - Updated deployment or null if not found
   */
  async updateDeployment(deploymentId, updates) {
    try {
      const deployment = await Deployment.findByPk(deploymentId);
      
      if (!deployment) {
        return null;
      }
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        deployment[key] = updates[key];
      });
      
      await deployment.save();
      logger.info(`Deployment updated: ${deploymentId}, status: ${deployment.status}`);
      
      return deployment;
    } catch (error) {
      logger.error('Error updating deployment:', error);
      throw error;
    }
  },
  
  /**
   * Get the latest successful deployment for a website
   * @param {string} websiteId - Website ID
   * @returns {Promise<Object|null>} - Deployment or null if not found
   */
  async getLatestSuccessfulDeployment(websiteId) {
    try {
      const deployment = await Deployment.findOne({
        where: {
          websiteId: websiteId,
          status: 'success'
        },
        order: [['createdAt', 'DESC']]
      });
      
      return deployment;
    } catch (error) {
      logger.error('Error fetching latest successful deployment:', error);
      throw error;
    }
  },
  
  /**
   * Check if a website has any active deployments
   * @param {string} websiteId - Website ID
   * @returns {Promise<boolean>} - True if active deployments exist
   */
  async hasActiveDeployments(websiteId) {
    try {
      const count = await Deployment.count({
        where: {
          websiteId: websiteId,
          status: {
            [Op.in]: ['queued', 'in_progress']
          }
        }
      });
      
      return count > 0;
    } catch (error) {
      logger.error('Error checking for active deployments:', error);
      throw error;
    }
  },

  /**
   * Process a queued deployment
   * @param {string} deploymentId - Deployment ID
   * @returns {Promise<Object>} - Updated deployment
   */
  async processDeployment(deploymentId) {
    let deployment;
    let website;
    const buildStartTime = Date.now();
    const buildId = uuidv4();
    const buildDir = path.join(DEPLOYMENT_CONFIG.buildDir, buildId);
    let buildLogs = [];
    
    try {
      // Log start
      const logEntry = `Starting deployment process [${buildId}]`;
      buildLogs.push(logEntry);
      logger.info(logEntry);
      
      // Get deployment info
      deployment = await Deployment.findByPk(deploymentId);
      if (!deployment) {
        throw new Error(`Deployment not found: ${deploymentId}`);
      }
      
      // Update status to in progress
      deployment = await this.updateDeployment(deploymentId, {
        status: 'in_progress',
        buildLogs: buildLogs.join('\n')
      });
      
      // Get website data
      website = await Website.findByPk(deployment.websiteId);
      if (!website) {
        throw new Error(`Website not found: ${deployment.websiteId}`);
      }
      
      // Create build directory
      buildLogs.push(`Creating build directory: ${buildDir}`);
      await fsPromises.mkdir(buildDir, { recursive: true });
      
      // Generate website files
      buildLogs.push('Generating website files...');
      await this.generateWebsiteFiles(website, buildDir, buildLogs);
      
      // Deploy the website
      buildLogs.push('Deploying website to hosting provider...');
      const deploymentUrl = await this.deployToProvider(website, buildDir, buildLogs);
      
      // Calculate build time
      const buildTime = Date.now() - buildStartTime;
      
      // Update deployment with success
      deployment = await this.updateDeployment(deploymentId, {
        status: 'success',
        completedAt: new Date(),
        buildTime,
        buildLogs: buildLogs.join('\n'),
        deploymentUrl
      });
      
      // Update website with last deployment info
      await website.update({
        lastDeployedAt: new Date(),
        lastSuccessfulDeploymentId: deployment.id,
        publicUrl: deploymentUrl
      });
      
      logger.info(`Deployment successful: ${deploymentId}, url: ${deploymentUrl}`);
      return deployment;
      
    } catch (error) {
      // Log error
      const errorMsg = `Deployment failed: ${error.message}`;
      buildLogs.push(errorMsg);
      logger.error(errorMsg, error);
      
      // Update deployment with failure
      if (deployment) {
        const buildTime = Date.now() - buildStartTime;
        deployment = await this.updateDeployment(deploymentId, {
          status: 'failed',
          completedAt: new Date(),
          buildTime,
          errorMessage: error.message,
          buildLogs: buildLogs.join('\n')
        });
      }
      
      throw error;
    } finally {
      // Clean up build directory
      try {
        await fsPromises.rm(buildDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.warn(`Failed to clean up build directory: ${buildDir}`, cleanupError);
      }
    }
  },
  
  /**
   * Generate website files from data
   * @param {Object} website - Website data
   * @param {string} buildDir - Build directory
   * @param {Array} buildLogs - Array to append logs
   * @returns {Promise<void>}
   */
  async generateWebsiteFiles(website, buildDir, buildLogs) {
    try {
      // Parse website content
      const content = typeof website.content === 'string' 
        ? JSON.parse(website.content) 
        : website.content;
      
      // Create index.html
      buildLogs.push('Generating index.html...');
      
      // Parse settings
      const settings = typeof website.settings === 'string'
        ? JSON.parse(website.settings)
        : website.settings;
      
      // Create CSS file
      buildLogs.push('Generating styles.css...');
      await this.generateCssFile(settings, buildDir);
      
      // Create HTML files for each page
      buildLogs.push('Generating HTML files for pages...');
      const pages = content.pages || [];
      
      for (const page of pages) {
        await this.generatePageHtml(page, settings, buildDir, page.isHome);
      }
      
      // Create assets directory and copy default assets
      buildLogs.push('Setting up assets...');
      const assetsDir = path.join(buildDir, 'assets');
      await fsPromises.mkdir(assetsDir, { recursive: true });
      
      // Create robots.txt
      buildLogs.push('Creating robots.txt...');
      await fsPromises.writeFile(
        path.join(buildDir, 'robots.txt'),
        'User-agent: *\nAllow: /'
      );
      
      buildLogs.push('Website files generated successfully');
    } catch (error) {
      buildLogs.push(`Error generating website files: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Generate CSS file from website settings
   * @param {Object} settings - Website settings
   * @param {string} buildDir - Build directory
   * @returns {Promise<void>}
   */
  async generateCssFile(settings, buildDir) {
    // Extract colors and fonts
    const colors = settings.colors || {
      primary: '#4361ee',
      secondary: '#3f37c9',
      accent: '#f72585',
      background: '#ffffff',
      text: '#212529',
    };
    
    const fonts = settings.fonts || {
      heading: 'Montserrat',
      body: 'Open Sans',
    };
    
    // Generate CSS
    const css = `
      /* Generated styles for ${new Date().toISOString()} */
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-background: ${colors.background};
        --color-text: ${colors.text};
        
        --font-heading: "${fonts.heading}", sans-serif;
        --font-body: "${fonts.body}", sans-serif;
      }
      
      body {
        font-family: var(--font-body);
        color: var(--color-text);
        background-color: var(--color-background);
        margin: 0;
        padding: 0;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }
      
      .button-primary {
        background-color: var(--color-primary);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .button-secondary {
        background-color: var(--color-secondary);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .section {
        padding: 40px 20px;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
      }
    `;
    
    // Write CSS file
    await fsPromises.writeFile(path.join(buildDir, 'styles.css'), css);
  },
  
  /**
   * Generate HTML for a page
   * @param {Object} page - Page data
   * @param {Object} settings - Website settings
   * @param {string} buildDir - Build directory
   * @param {boolean} isHome - Is this the home page
   * @returns {Promise<void>}
   */
  async generatePageHtml(page, settings, buildDir, isHome) {
    // Start with basic HTML structure
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name}</title>
  <link rel="stylesheet" href="styles.css">
  <link href="https://fonts.googleapis.com/css2?family=${settings.fonts.heading.replace(' ', '+')}&family=${settings.fonts.body.replace(' ', '+')}&display=swap" rel="stylesheet">
</head>
<body>`;
    
    // Generate body based on page elements
    for (const element of (page.elements || [])) {
      html += this.generateElementHtml(element, settings);
    }
    
    // Close HTML
    html += `</body>
</html>`;
    
    // Determine filename (index.html for home page)
    const filename = isHome ? 'index.html' : `${page.slug}.html`;
    await fsPromises.writeFile(path.join(buildDir, filename), html);
  },
  
  /**
   * Generate HTML for a page element
   * @param {Object} element - Element data
   * @param {Object} settings - Website settings
   * @returns {string} HTML string
   */
  generateElementHtml(element, settings) {
    const { type, content } = element;
    
    switch (type) {
      case 'hero':
        return `
<section class="section hero-section" style="background-color: ${settings.colors.primary}; color: white; text-align: ${content.alignment || 'center'}; padding: 80px 20px;">
  <div class="container">
    <h1>${content.headline}</h1>
    <p>${content.subheadline}</p>
    <a href="${content.ctaLink}" class="button-primary" style="display: inline-block; margin-top: 20px;">${content.ctaText}</a>
  </div>
</section>`;
      
      case 'text':
        return `
<section class="section text-section">
  <div class="container" style="text-align: ${content.alignment || 'left'};">
    <h2>${content.headline}</h2>
    ${content.content}
  </div>
</section>`;
      
      case 'features':
        let featuresHtml = `
<section class="section features-section">
  <div class="container" style="text-align: center;">
    <h2>${content.headline}</h2>
    <p>${content.subheadline}</p>
    <div style="display: grid; grid-template-columns: repeat(${content.columns || 3}, 1fr); gap: 30px; margin-top: 40px;">`;
        
        for (const feature of (content.features || [])) {
          featuresHtml += `
      <div class="feature-box" style="padding: 20px;">
        <div class="feature-icon" style="font-size: 40px; margin-bottom: 15px;">
          <!-- Icon placeholder for ${feature.icon} -->
          ⭐
        </div>
        <h3>${feature.title}</h3>
        <p>${feature.description}</p>
      </div>`;
        }
        
        featuresHtml += `
    </div>
  </div>
</section>`;
        return featuresHtml;
      
      case 'custom':
        return content.html || '';
      
      default:
        return `
<section class="section">
  <div class="container">
    <p>Content placeholder for ${type} element</p>
  </div>
</section>`;
    }
  },
  
  /**
   * Deploy files to hosting provider
   * @param {Object} website - Website data
   * @param {string} buildDir - Build directory path
   * @param {Array} buildLogs - Array to append logs
   * @returns {Promise<string>} Deployment URL
   */
  async deployToProvider(website, buildDir, buildLogs) {
    try {
      buildLogs.push('Preparing deployment to Vercel...');
      
      // Run pre-deployment validation tests
      const validationResult = await this.validateDeployment(website, buildDir, buildLogs);
      if (!validationResult.valid) {
        throw new Error(`Pre-deployment validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Prepare files for Vercel deployment
      const files = await this.prepareFilesForVercel(buildDir, buildLogs);
      buildLogs.push(`Prepared ${files.length} files for deployment`);
      
      // Create deployment ID for tracking
      const deploymentId = uuidv4();
      
      // Prepare deployment payload
      const deploymentPayload = {
        name: website.name || `website-${website.id}`,
        files,
        projectId: process.env.VERCEL_PROJECT_ID || 'default-project',
        target: 'production',
        meta: {
          deploymentId: deploymentId,
          websiteId: website.id,
          source: 'landing-pad-dxp',
          createdAt: new Date().toISOString()
        }
      };
      
      // Add domain configuration if the website has a primary domain
      if (website.domains && website.domains.length > 0) {
        const primaryDomain = website.domains.find(domain => 
          domain.isPrimary && domain.status === 'active' && domain.verificationStatus === 'verified'
        );
        
        if (primaryDomain) {
          buildLogs.push(`Using primary domain: ${primaryDomain.name}`);
          deploymentPayload.alias = [primaryDomain.name];
        }
      }
      
      buildLogs.push('Sending deployment request to Vercel API...');
      
      try {
        // Check if we have valid credentials for Vercel
        const hasValidCredentials = 
          DEPLOYMENT_CONFIG.apiToken && 
          DEPLOYMENT_CONFIG.apiToken !== 'API_KEY' && 
          DEPLOYMENT_CONFIG.apiToken.length > 10;
        
        if (!hasValidCredentials && process.env.NODE_ENV === 'production') {
          throw new Error('Missing or invalid Vercel API token in production environment');
        }
        
        // Only send to real Vercel API if we have valid credentials
        if (hasValidCredentials) {
          // Send to Vercel API with retry mechanism
          let response;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount <= maxRetries) {
            try {
              response = await axios.post(
                DEPLOYMENT_CONFIG.deploymentEndpoint,
                deploymentPayload,
                {
                  headers: {
                    Authorization: `Bearer ${DEPLOYMENT_CONFIG.apiToken}`,
                    'Content-Type': 'application/json',
                  },
                  timeout: 30000 // 30 second timeout
                }
              );
              break; // Success, exit the retry loop
            } catch (err) {
              // Check if error is retryable (e.g., rate limit, server error)
              if (
                (err.response && err.response.status >= 500) || 
                (err.response && err.response.status === 429) || 
                err.code === 'ECONNRESET' || 
                err.code === 'ETIMEDOUT'
              ) {
                retryCount++;
                if (retryCount <= maxRetries) {
                  // Exponential backoff: 2s, 4s, 8s
                  const delay = Math.pow(2, retryCount) * 1000;
                  buildLogs.push(`API call failed, retrying in ${delay/1000}s (attempt ${retryCount}/${maxRetries})...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                  throw err; // Max retries exceeded
                }
              } else {
                throw err; // Non-retryable error
              }
            }
          }
          
          // Get deployment URL from response
          const deploymentUrl = response.data.url;
          if (!deploymentUrl) {
            throw new Error('No deployment URL returned from Vercel');
          }
          
          buildLogs.push(`Deployment initiated successfully on Vercel`);
          buildLogs.push(`Deployment URL: ${deploymentUrl}`);
          
          // Convert URL to HTTPS if it's not already
          const finalUrl = deploymentUrl.startsWith('https://') 
            ? deploymentUrl 
            : `https://${deploymentUrl}`;
          
          // Run post-deployment checks to validate the deployment
          try {
            buildLogs.push('Running post-deployment validation checks...');
            const deploymentChecks = await this.validateDeployedWebsite(finalUrl, buildLogs);
            
            if (!deploymentChecks.valid) {
              buildLogs.push(`Warning: Post-deployment checks failed: ${deploymentChecks.errors.join(', ')}`);
              // We don't fail the deployment for post-deployment checks, just log it
            } else {
              buildLogs.push('Post-deployment validation successful');
            }
          } catch (validationError) {
            buildLogs.push(`Warning: Post-deployment validation error: ${validationError.message}`);
            // Continue despite validation errors in post-deployment
          }
          
          return finalUrl;
        } else {
          // Fall back to simulation for development or missing credentials
          buildLogs.push('Using simulated deployment (no valid Vercel credentials)');
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Generate simulated URL
          const slug = website.slug || website.id.substring(0, 8);
          const simDeploymentId = uuidv4().substring(0, 8);
          const deploymentUrl = `https://${slug}-${simDeploymentId}.${DEPLOYMENT_CONFIG.defaultHost}`;
          
          buildLogs.push(`Simulated deployment URL: ${deploymentUrl}`);
          return deploymentUrl;
        }
      } catch (apiError) {
        buildLogs.push(`Deployment API error: ${apiError.message}`);
        
        // If API fails in development, fall back to simulation
        if (process.env.NODE_ENV !== 'production') {
          buildLogs.push('Falling back to simulated deployment for development');
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Generate simulated URL
          const slug = website.slug || website.id.substring(0, 8);
          const simDeploymentId = uuidv4().substring(0, 8);
          const deploymentUrl = `https://${slug}-${simDeploymentId}.${DEPLOYMENT_CONFIG.defaultHost}`;
          
          buildLogs.push(`Simulated deployment URL: ${deploymentUrl}`);
          return deploymentUrl;
        }
        
        throw apiError;
      }
    } catch (error) {
      buildLogs.push(`Deployment to provider failed: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Validate deployment before sending to provider
   * @param {Object} website - Website data
   * @param {string} buildDir - Build directory
   * @param {Array} buildLogs - Build logs array
   * @returns {Promise<Object>} - Validation result with valid boolean and errors array
   */
  async validateDeployment(website, buildDir, buildLogs) {
    const errors = [];
    buildLogs.push('Running pre-deployment validation...');
    
    try {
      // 1. Check for index.html existence
      try {
        const indexPath = path.join(buildDir, 'index.html');
        await fsPromises.access(indexPath);
        buildLogs.push('✓ index.html exists');
      } catch (indexError) {
        const error = 'Missing index.html file';
        errors.push(error);
        buildLogs.push(`✗ ${error}`);
      }
      
      // 2. Check CSS file
      try {
        const cssPath = path.join(buildDir, 'styles.css');
        await fsPromises.access(cssPath);
        buildLogs.push('✓ styles.css exists');
      } catch (cssError) {
        const error = 'Missing styles.css file';
        errors.push(error);
        buildLogs.push(`✗ ${error}`);
      }
      
      // 3. Check for broken links in HTML files
      try {
        const htmlFiles = await fsPromises.readdir(buildDir);
        const htmlPaths = htmlFiles
          .filter(file => file.endsWith('.html'))
          .map(file => path.join(buildDir, file));
        
        for (const htmlPath of htmlPaths) {
          const content = await fsPromises.readFile(htmlPath, 'utf8');
          
          // Check for broken local resource links
          const resourceRegex = /(src|href)=['"]((?!http)[^'"]+)['"]/g;
          let match;
          
          while ((match = resourceRegex.exec(content)) !== null) {
            const resource = match[2];
            // Skip anchors and javascript: links
            if (resource.startsWith('#') || resource.startsWith('javascript:') || resource.startsWith('mailto:')) {
              continue;
            }
            
            try {
              const resourcePath = path.join(buildDir, resource);
              await fsPromises.access(resourcePath);
            } catch (resourceError) {
              const error = `Broken link in ${path.basename(htmlPath)}: ${resource}`;
              errors.push(error);
              buildLogs.push(`✗ ${error}`);
            }
          }
        }
        
        if (htmlPaths.length > 0) {
          buildLogs.push(`✓ Checked links in ${htmlPaths.length} HTML files`);
        } else {
          const error = 'No HTML files found in build directory';
          errors.push(error);
          buildLogs.push(`✗ ${error}`);
        }
      } catch (htmlError) {
        const error = `Error checking HTML files: ${htmlError.message}`;
        errors.push(error);
        buildLogs.push(`✗ ${error}`);
      }
      
      // 4. Check HTML validity (basic checks)
      try {
        const indexPath = path.join(buildDir, 'index.html');
        const indexContent = await fsPromises.readFile(indexPath, 'utf8');
        
        // Check for doctype, html, head and body tags
        const hasDoctype = indexContent.toLowerCase().includes('<!doctype html');
        const hasHtmlTag = /<html[^>]*>/i.test(indexContent);
        const hasHeadTag = /<head[^>]*>/i.test(indexContent);
        const hasBodyTag = /<body[^>]*>/i.test(indexContent);
        
        if (!hasDoctype) {
          const error = 'index.html missing DOCTYPE declaration';
          errors.push(error);
          buildLogs.push(`✗ ${error}`);
        }
        
        if (!hasHtmlTag || !hasHeadTag || !hasBodyTag) {
          const error = 'index.html missing required HTML structure (html, head, or body tags)';
          errors.push(error);
          buildLogs.push(`✗ ${error}`);
        } else {
          buildLogs.push('✓ HTML structure valid');
        }
      } catch (validityError) {
        const error = `Error checking HTML validity: ${validityError.message}`;
        errors.push(error);
        buildLogs.push(`✗ ${error}`);
      }
      
      // Return validation result
      const valid = errors.length === 0;
      
      if (valid) {
        buildLogs.push('✓ Pre-deployment validation passed');
      } else {
        buildLogs.push(`✗ Pre-deployment validation failed with ${errors.length} errors`);
      }
      
      return {
        valid,
        errors
      };
    } catch (error) {
      buildLogs.push(`Error during pre-deployment validation: ${error.message}`);
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  },
  
  /**
   * Validate a deployed website
   * @param {string} url - Deployment URL
   * @param {Array} buildLogs - Build logs array
   * @returns {Promise<Object>} - Validation result with valid boolean and errors array
   */
  async validateDeployedWebsite(url, buildLogs) {
    const errors = [];
    buildLogs.push(`Validating deployed website at ${url}...`);
    
    try {
      // Allow time for the deployment to become available
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 1. Check if the site is accessible
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          validateStatus: null
        });
        
        if (response.status !== 200) {
          const error = `Website returned non-200 status code: ${response.status}`;
          errors.push(error);
          buildLogs.push(`✗ ${error}`);
        } else {
          buildLogs.push('✓ Website is accessible (200 OK)');
        }
        
        // 2. Check content type
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('text/html')) {
          const error = `Unexpected content type: ${contentType || 'none'}`;
          errors.push(error);
          buildLogs.push(`✗ ${error}`);
        } else {
          buildLogs.push('✓ Content type is valid');
        }
        
        // 3. Check for basic content
        const hasHtmlStructure = 
          response.data.includes('<!DOCTYPE html') ||
          response.data.includes('<!doctype html');
          
        if (!hasHtmlStructure) {
          const error = 'Response does not contain valid HTML structure';
          errors.push(error);
          buildLogs.push(`✗ ${error}`);
        } else {
          buildLogs.push('✓ Response contains valid HTML');
        }
      } catch (accessError) {
        const error = `Could not access deployed website: ${accessError.message}`;
        errors.push(error);
        buildLogs.push(`✗ ${error}`);
      }
      
      // Return validation result
      const valid = errors.length === 0;
      
      if (valid) {
        buildLogs.push('✓ Deployment validation passed');
      } else {
        buildLogs.push(`✗ Deployment validation failed with ${errors.length} errors`);
      }
      
      return {
        valid,
        errors
      };
    } catch (error) {
      buildLogs.push(`Error during deployment validation: ${error.message}`);
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  },
  
  /**
   * Prepare files for Vercel deployment
   * @param {string} buildDir - Build directory path
   * @param {Array} buildLogs - Array to append logs
   * @returns {Promise<Array>} Array of file objects for Vercel
   */
  async prepareFilesForVercel(buildDir, buildLogs) {
    try {
      buildLogs.push('Reading files from build directory...');
      
      // Check if build directory exists
      try {
        await fsPromises.access(buildDir);
      } catch (accessError) {
        buildLogs.push(`Error: Build directory does not exist: ${buildDir}`);
        throw new Error(`Build directory does not exist: ${buildDir}`);
      }
      
      // Get all files recursively
      const getFilesRecursively = async (dir) => {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        
        // Process all entries
        const files = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              // If directory, get files recursively
              return getFilesRecursively(fullPath);
            } else {
              // If file, read content and prepare for Vercel
              const content = await fsPromises.readFile(fullPath);
              
              // Get relative path from build directory
              const relativePath = path.relative(buildDir, fullPath);
              
              return {
                file: relativePath, // File path relative to project root
                sha: crypto.createHash('sha1').update(content).digest('hex'),
                size: content.length,
                content: content.toString('base64')
              };
            }
          })
        );
        
        // Flatten the array (as directories will return arrays of files)
        return files.flat();
      };
      
      // Get all files
      const files = await getFilesRecursively(buildDir);
      buildLogs.push(`Found ${files.length} files to deploy`);
      
      return files;
    } catch (error) {
      buildLogs.push(`Error preparing files for Vercel: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Rollback to a previous deployment
   * @param {string} websiteId - Website ID
   * @param {string} deploymentId - Deployment ID to rollback to
   * @returns {Promise<Object>} - Deployment information
   */
  async rollbackToDeployment(websiteId, deploymentId) {
    try {
      // Verify the deployment exists and belongs to this website
      const deployment = await Deployment.findOne({
        where: {
          id: deploymentId,
          websiteId: websiteId,
          status: 'success'
        }
      });
      
      if (!deployment) {
        throw new Error(`Valid deployment not found for rollback: ${deploymentId}`);
      }
      
      // Create a new deployment that copies the old one
      const rollbackDeployment = await this.createDeployment({
        websiteId,
        userId: deployment.userId,
        status: 'queued',
        version: `rollback-to-${deployment.version || deployment.id}`,
        commitMessage: `Rollback to deployment ${deployment.id}`
      });
      
      // Process this deployment
      return await this.processDeployment(rollbackDeployment.id);
    } catch (error) {
      logger.error(`Error during rollback: ${error.message}`, error);
      throw error;
    }
  },
  
  /**
   * Process all queued deployments
   * @returns {Promise<Object>} - Processing statistics
   */
  async processQueuedDeployments() {
    try {
      // Find all queued deployments
      const queuedDeployments = await Deployment.findAll({
        where: {
          status: 'queued'
        },
        order: [['createdAt', 'ASC']] // Process oldest first
      });
      
      logger.info(`Found ${queuedDeployments.length} queued deployments to process`);
      
      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      
      // Process each deployment
      for (const deployment of queuedDeployments) {
        try {
          await this.processDeployment(deployment.id);
          succeeded++;
        } catch (error) {
          logger.error(`Failed to process deployment ${deployment.id}: ${error.message}`);
          failed++;
        }
        processed++;
      }
      
      return {
        processed,
        succeeded,
        failed,
        total: queuedDeployments.length
      };
    } catch (error) {
      logger.error('Error processing queued deployments:', error);
      throw error;
    }
  }
};

module.exports = deploymentService;