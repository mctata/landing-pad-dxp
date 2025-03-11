const { Project, Template } = require('../models');
const deploymentService = require('../services/deploymentService');
const domainService = require('../services/domainService');

// Create a new project
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, templateId } = req.body;
    
    // Get the template
    const template = await Template.findByPk(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Create new project with template data
    const project = await Project.create({
      name,
      description,
      template: template.name,
      content: template.content,
      styles: template.styles,
      settings: template.settings,
      userId: req.user.id,
    });
    
    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

// Get all projects for the current user
exports.getUserProjects = async (req, res, next) => {
  try {
    const projects = await Project.findAll({ 
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });
    
    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOne({ 
      where: { 
        id,
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    next(error);
  }
};

// Update a project
exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, content, styles, settings } = req.body;
    
    const project = await Project.findOne({ 
      where: { 
        id,
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (content) project.content = content;
    if (styles) project.styles = styles;
    if (settings) project.settings = settings;
    
    await project.save();
    
    res.json({
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a project
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOne({ 
      where: { 
        id,
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await project.destroy();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Publish a project
exports.publishProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customDomain } = req.body;
    
    const project = await Project.findOne({ 
      where: { 
        id,
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is allowed to use custom domain
    if (customDomain && req.user.subscription === 'free') {
      return res.status(403).json({ 
        message: 'Custom domains are only available for paid plans' 
      });
    }
    
    // Update project
    project.published = true;
    project.publishedUrl = customDomain || `landing-pad.digital/${req.user.id}/${project.id}`;
    if (customDomain) {
      project.customDomain = customDomain;
    }
    
    await project.save();
    
    // Initialize the publishing process
    // This is where we bridge to the publishing service
    try {
      // Import the needed services
      const deploymentService = require('../services/deploymentService');
      const { v4: uuidv4 } = require('uuid');
      
      // Generate a deployment ID and version
      const deploymentId = uuidv4();
      const version = generateVersion();
      
      // Create a deployment record
      const deployment = await deploymentService.createDeployment({
        id: deploymentId,
        websiteId: id, // Use project ID as website ID
        userId: req.user.id,
        status: 'queued',
        version,
        commitMessage: 'User initiated deployment',
      });
      
      // Queue the deployment process (in background)
      setTimeout(() => {
        processDeployment(deploymentId, id, req.user.id)
          .catch(err => {
            console.error(`Deployment processing error: ${err.message}`, { deploymentId, websiteId: id });
          });
      }, 100);
      
      // Return success with deployment details
      return res.json({
        message: 'Project published successfully',
        project,
        deployment: {
          id: deployment.id,
          version: deployment.version,
          status: deployment.status,
          createdAt: deployment.createdAt
        }
      });
    } catch (deployError) {
      console.error('Error initiating deployment:', deployError);
      
      // Still return success for the project publishing itself
      res.json({
        message: 'Project published successfully, but deployment could not be initiated',
        project,
        deploymentError: deployError.message
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get deployments for a project
exports.getProjectDeployments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    // Check if project exists and belongs to the user
    const project = await Project.findOne({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get deployments
    const deployments = await deploymentService.getDeployments(id, {
      limit: parseInt(limit, 10),
      page: parseInt(page, 10)
    });
    
    res.json({
      deployments: deployments.items,
      pagination: deployments.pagination
    });
  } catch (error) {
    next(error);
  }
};

// Get a single deployment for a project
exports.getProjectDeployment = async (req, res, next) => {
  try {
    const { id, deploymentId } = req.params;
    
    // Check if project exists and belongs to the user
    const project = await Project.findOne({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get deployment
    const deployment = await deploymentService.getDeploymentById(deploymentId);
    if (!deployment || deployment.websiteId !== id) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    res.json({ deployment });
  } catch (error) {
    next(error);
  }
};

// Get domains for a project
exports.getProjectDomains = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if project exists and belongs to the user
    const project = await Project.findOne({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get domains
    const domains = await domainService.getDomainsByWebsiteId(id);
    
    res.json({ domains });
  } catch (error) {
    next(error);
  }
};

// Add a domain to a project
exports.addProjectDomain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Check if project exists and belongs to the user
    const project = await Project.findOne({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Validate domain name
    if (!name || !/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(name)) {
      return res.status(400).json({ message: 'Invalid domain name' });
    }
    
    // Check if user subscription allows custom domains
    if (req.user.subscription === 'free') {
      return res.status(403).json({ 
        message: 'Custom domains are only available for paid plans' 
      });
    }
    
    // Check if domain already exists
    const existingDomain = await domainService.getDomainByName(name);
    if (existingDomain) {
      return res.status(400).json({ message: 'This domain is already in use' });
    }
    
    // Create domain
    const domain = await domainService.createDomain({
      name,
      websiteId: id,
      userId: req.user.id,
      status: 'pending',
      verificationStatus: 'pending',
      isPrimary: false,
      dnsRecords: [
        {
          type: 'CNAME',
          host: name.startsWith('www.') ? name : `www.${name}`,
          value: `${id}.landingpad.digital`,
          ttl: 3600
        },
        {
          type: 'A',
          host: name.startsWith('www.') ? name.substring(4) : name,
          value: '76.76.21.21', // Example IP
          ttl: 3600
        }
      ]
    });
    
    res.status(201).json({ 
      message: 'Domain added successfully',
      domain 
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate a version string
function generateVersion() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('.');
}

// Process the deployment (this runs asynchronously)
async function processDeployment(deploymentId, projectId, userId) {
  console.log(`Processing deployment ${deploymentId} for project ${projectId}`);
  
  try {
    // Import needed services
    const deploymentService = require('../services/deploymentService');
    const Project = require('../models/Project');
    
    // Update deployment status to in_progress
    await deploymentService.updateDeployment(deploymentId, {
      status: 'in_progress',
    });
    
    const startTime = Date.now();
    
    // Get project data
    const project = await Project.findOne({ 
      where: { 
        id: projectId,
        userId 
      } 
    });
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // In a real implementation, here we would:
    // 1. Export the project data
    // 2. Generate static files or prepare the deployment package
    // 3. Upload to the hosting provider
    
    // Simulate deployment processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update deployment status to success
    const buildTime = Date.now() - startTime;
    await deploymentService.updateDeployment(deploymentId, {
      status: 'success',
      completedAt: new Date().toISOString(),
      buildTime,
    });
    
    console.log(`Deployment ${deploymentId} completed successfully in ${buildTime}ms`);
  } catch (error) {
    console.error(`Deployment ${deploymentId} failed: ${error.message}`);
    
    // Import deploymentService if not already done
    const deploymentService = require('../services/deploymentService');
    
    // Update deployment status to failed
    await deploymentService.updateDeployment(deploymentId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errorMessage: error.message,
    });
  }
}
