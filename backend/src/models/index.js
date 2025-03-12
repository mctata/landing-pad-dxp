const User = require('./User');
const Project = require('./Project');
const Template = require('./Template');
const Website = require('./Website');
const Deployment = require('./Deployment');
const Domain = require('./Domain');
const Content = require('./Content');

// Define relationships
User.hasMany(Project, {
  foreignKey: 'userId',
  as: 'projects',
  onDelete: 'CASCADE',
});

Project.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Website relationships
User.hasMany(Website, {
  foreignKey: 'userId',
  as: 'websites',
  onDelete: 'CASCADE',
});

Website.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Deployment relationships
Website.hasMany(Deployment, {
  foreignKey: 'websiteId',
  as: 'deployments',
  onDelete: 'CASCADE',
});

Deployment.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website',
});

User.hasMany(Deployment, {
  foreignKey: 'userId',
  as: 'deployments',
});

Deployment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Domain relationships
Website.hasMany(Domain, {
  foreignKey: 'websiteId',
  as: 'domains',
  onDelete: 'CASCADE',
});

Domain.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website',
});

User.hasMany(Domain, {
  foreignKey: 'userId',
  as: 'domains',
});

Domain.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Content relationships
User.hasMany(Content, {
  foreignKey: 'userId',
  as: 'contents',
});

Content.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Website.hasMany(Content, {
  foreignKey: 'websiteId',
  as: 'contents',
});

Content.belongsTo(Website, {
  foreignKey: 'websiteId',
  as: 'website',
});

module.exports = {
  User,
  Project,
  Template,
  Website,
  Deployment,
  Domain,
  Content,
};
