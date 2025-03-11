const { Project, Template } = require('../models');

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
    
    res.json({
      message: 'Project published successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};
