const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'suspended'),
    defaultValue: 'pending',
  },
  subscriptionTier: {
    type: DataTypes.ENUM('free', 'basic', 'advanced', 'pro'),
    defaultValue: 'free',
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

// Virtual for full name
User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Hash password before saving
User.beforeCreate(async (user) => {
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Error creating user');
  }
});

// Also hash password when updating
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Error updating user');
    }
  }
});

// Method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error('Error comparing passwords:', error);
    return false;
  }
};

// Method to return user without sensitive data
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Remove sensitive fields
  delete values.password;
  delete values.verificationToken;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;
  delete values.refreshToken;
  
  // Add virtual fields
  values.fullName = this.getFullName();
  
  return values;
};

// Method to generate a verification token
User.prototype.generateVerificationToken = function() {
  // Generate a random token (typically a UUID or a random string)
  const token = require('crypto').randomBytes(32).toString('hex');
  this.verificationToken = token;
  return token;
};

// Method to verify a user's email
User.prototype.verifyEmail = async function() {
  this.emailVerified = true;
  this.verificationToken = null;
  this.status = 'active';
  await this.save();
};

// Method to generate a password reset token
User.prototype.generatePasswordResetToken = async function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  // Set expiration to 1 hour from now
  const expires = new Date(Date.now() + 3600000);
  
  this.resetPasswordToken = token;
  this.resetPasswordExpires = expires;
  await this.save();
  
  return token;
};

module.exports = User;
