const { Template } = require('../models');

// Get all available templates
exports.getAllTemplates = async (req, res, next) => {
  try {
    const templates = await Template.findAll({
      attributes: ['id', 'name', 'description', 'category', 'thumbnail', 'isDefault'],
      order: [['name', 'ASC']]
    });
    
    res.json({ templates });
  } catch (error) {
    next(error);
  }
};

// Get template by ID
exports.getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({ template });
  } catch (error) {
    next(error);
  }
};

// Get templates by category
exports.getTemplatesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    const templates = await Template.findAll({
      where: { category },
      attributes: ['id', 'name', 'description', 'category', 'thumbnail', 'isDefault'],
      order: [['name', 'ASC']]
    });
    
    res.json({ templates });
  } catch (error) {
    next(error);
  }
};

// Create a new template (Admin only)
exports.createTemplate = async (req, res, next) => {
  try {
    const { name, description, category, thumbnail, content, styles, settings, isDefault } = req.body;
    
    const template = await Template.create({
      name,
      description,
      category,
      thumbnail,
      content,
      styles,
      settings,
      isDefault: isDefault || false
    });
    
    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    next(error);
  }
};

// Update a template (Admin only)
exports.updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, thumbnail, content, styles, settings, isDefault } = req.body;
    
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Update fields
    if (name) template.name = name;
    if (description) template.description = description;
    if (category) template.category = category;
    if (thumbnail) template.thumbnail = thumbnail;
    if (content) template.content = content;
    if (styles) template.styles = styles;
    if (settings) template.settings = settings;
    if (isDefault !== undefined) template.isDefault = isDefault;
    
    await template.save();
    
    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    next(error);
  }
};

// Delete a template (Admin only)
exports.deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    await template.destroy();
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
};
