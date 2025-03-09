const User = require('./User');
const Project = require('./Project');
const Template = require('./Template');

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

module.exports = {
  User,
  Project,
  Template,
};
