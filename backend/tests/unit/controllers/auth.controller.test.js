const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock modules before requiring the controller
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn()
}));

jest.mock('../../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Import controller after mocking dependencies
const authController = require('../../../src/controllers/auth.controller');
const { User } = require('../../../src/models');
const logger = require('../../../src/utils/logger');

describe('Auth Controller', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request, response, and next
    req = {
      body: {},
      cookies: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };

    next = jest.fn();

    // Create a mock user with methods
    mockUser = {
      id: 'user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'user',
      status: 'pending',
      emailVerified: false,
      refreshToken: null,
      comparePassword: jest.fn(),
      generateVerificationToken: jest.fn(),
      generatePasswordResetToken: jest.fn(),
      verifyEmail: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      toJSON: jest.fn().mockReturnValue({
        id: 'user-123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'user'
      })
    };

    // Set JWT tokens
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.FRONTEND_URL = 'https://example.com';

    // Mock JWT sign
    jwt.sign.mockImplementation((payload, secret, options) => {
      if (secret === process.env.JWT_ACCESS_SECRET) {
        return 'mock-access-token';
      } else {
        return 'mock-refresh-token';
      }
    });
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.FRONTEND_URL;
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Setup request body
      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      // User does not exist yet
      User.findOne.mockResolvedValue(null);

      // Mock user creation and verification token generation
      User.create.mockResolvedValue(mockUser);
      mockUser.generateVerificationToken.mockReturnValue('verification-token-123');

      // Call the controller method
      await authController.register(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(User.create).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        subscriptionTier: 'free',
        status: 'pending'
      });
      expect(mockUser.generateVerificationToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', expect.any(Object));
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully. Please verify your email.',
        accessToken: 'mock-access-token',
        user: expect.any(Object),
        verificationUrl: 'https://example.com/verify-email?token=verification-token-123'
      });
    });

    it('should return 400 if user already exists', async () => {
      // Setup request body
      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'password123'
      };

      // User already exists
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      // Call the controller method
      await authController.register(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(User.create).not.toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists with this email' });
    });

    it('should pass unexpected errors to the error handler', async () => {
      // Setup request body
      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock a database error
      const error = new Error('Database error');
      User.findOne.mockRejectedValue(error);

      // Call the controller method
      await authController.register(req, res, next);

      // Assertions
      expect(logger.error).toHaveBeenCalledWith('Register error:', error);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should successfully log in a user with valid credentials', async () => {
      // Setup request body
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock an active user
      const activeUser = {
        ...mockUser,
        status: 'active',
        emailVerified: true
      };
      User.findOne.mockResolvedValue(activeUser);
      activeUser.comparePassword.mockResolvedValue(true);

      // Call the controller method
      await authController.login(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(activeUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(activeUser.save).toHaveBeenCalled();
      
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', expect.any(Object));
      
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        accessToken: 'mock-access-token',
        user: expect.any(Object)
      });
    });

    it('should return 401 if user does not exist', async () => {
      // Setup request body
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // User does not exist
      User.findOne.mockResolvedValue(null);

      // Call the controller method
      await authController.login(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return 401 if password is incorrect', async () => {
      // Setup request body
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Mock user with failed password comparison
      User.findOne.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      // Call the controller method
      await authController.login(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return 403 if email is not verified', async () => {
      // Setup request body
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock a pending user (not verified)
      mockUser.status = 'pending';
      User.findOne.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);

      // Call the controller method
      await authController.login(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Email not verified. Please verify your email before logging in.',
        verificationRequired: true
      });
    });

    it('should return 403 if account is suspended', async () => {
      // Setup request body
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock a suspended user
      const suspendedUser = {
        ...mockUser,
        status: 'suspended'
      };
      User.findOne.mockResolvedValue(suspendedUser);
      suspendedUser.comparePassword = mockUser.comparePassword;
      suspendedUser.comparePassword.mockResolvedValue(true);

      // Call the controller method
      await authController.login(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Account is suspended. Please contact support.'
      });
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      // Setup cookie
      req.cookies.refreshToken = 'valid-refresh-token';

      // Mock JWT verify
      jwt.verify = jest.fn().mockReturnValue({ id: 'user-123' });

      // Mock user with matching refresh token
      const userWithToken = {
        ...mockUser,
        refreshToken: 'valid-refresh-token'
      };
      User.findOne.mockResolvedValue(userWithToken);

      // Call the controller method
      await authController.refreshToken(req, res, next);

      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret');
      expect(User.findOne).toHaveBeenCalledWith({ 
        where: { 
          id: 'user-123',
          refreshToken: 'valid-refresh-token'
        } 
      });
      
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(userWithToken.save).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', expect.any(Object));
      
      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'mock-access-token'
      });
    });

    it('should return 401 if refresh token is not provided', async () => {
      // No refresh token in cookies
      req.cookies = {};

      // Call the controller method
      await authController.refreshToken(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token not found' });
    });

    it('should return 401 if refresh token is invalid', async () => {
      // Setup cookie
      req.cookies.refreshToken = 'invalid-token';

      // Mock JWT verify to throw error
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Call the controller method
      await authController.refreshToken(req, res, next);

      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-refresh-secret');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
    });

    it('should return 401 if user not found with token', async () => {
      // Setup cookie
      req.cookies.refreshToken = 'valid-refresh-token';

      // Mock JWT verify
      jwt.verify = jest.fn().mockReturnValue({ id: 'user-123' });

      // User not found
      User.findOne.mockResolvedValue(null);

      // Call the controller method
      await authController.refreshToken(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ 
        where: { 
          id: 'user-123',
          refreshToken: 'valid-refresh-token'
        } 
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
    });
  });

  describe('logout', () => {
    it('should successfully log out a user', async () => {
      // Setup user in request
      req.user = mockUser;

      // Call the controller method
      await authController.logout(req, res, next);

      // Assertions
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
    });

    it('should still return success even if no user is authenticated', async () => {
      // No user in request
      req.user = null;

      // Call the controller method
      await authController.logout(req, res, next);

      // Assertions
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current authenticated user', async () => {
      // Setup user in request
      req.user = mockUser;
      
      // Call the controller method
      await authController.getCurrentUser(req, res);

      // Assertions
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify a user email', async () => {
      // Setup params
      req.params = {
        token: 'verification-token-123'
      };

      // Mock user with matching verification token
      User.findOne.mockResolvedValue(mockUser);

      // Call the controller method
      await authController.verifyEmail(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { verificationToken: 'verification-token-123' } });
      expect(mockUser.verifyEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Email verified successfully. You can now log in.' });
    });

    it('should return 400 if token is not provided', async () => {
      // No token in params
      req.params = {};

      // Call the controller method
      await authController.verifyEmail(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Verification token is required' });
    });

    it('should return 400 if token is invalid', async () => {
      // Setup params
      req.params = {
        token: 'invalid-token'
      };

      // No user found with this token
      User.findOne.mockResolvedValue(null);

      // Call the controller method
      await authController.verifyEmail(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { verificationToken: 'invalid-token' } });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired verification token' });
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email to unverified user', async () => {
      // Setup request body
      req.body = {
        email: 'test@example.com'
      };

      // Mock unverified user
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false
      };
      User.findOne.mockResolvedValue(unverifiedUser);
      unverifiedUser.generateVerificationToken.mockReturnValue('new-verification-token');

      // Call the controller method
      await authController.resendVerification(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(unverifiedUser.generateVerificationToken).toHaveBeenCalled();
      expect(unverifiedUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Verification email sent. Please check your inbox.',
        verificationUrl: 'https://example.com/verify-email?token=new-verification-token'
      });
    });

    it('should return 400 if email is already verified', async () => {
      // Setup request body
      req.body = {
        email: 'verified@example.com'
      };

      // Mock verified user
      const verifiedUser = {
        ...mockUser,
        emailVerified: true
      };
      User.findOne.mockResolvedValue(verifiedUser);

      // Call the controller method
      await authController.resendVerification(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'verified@example.com' } });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email is already verified' });
    });

    it('should not reveal if user does not exist', async () => {
      // Setup request body
      req.body = {
        email: 'nonexistent@example.com'
      };

      // User not found
      User.findOne.mockResolvedValue(null);

      // Call the controller method
      await authController.resendVerification(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'If your email exists in our system, a verification link will be sent.'
      });
    });
  });

  describe('changePassword', () => {
    it('should successfully change user password with correct current password', async () => {
      // Setup request
      req.body = {
        currentPassword: 'current-password',
        newPassword: 'new-password'
      };
      req.user = mockUser;
      mockUser.comparePassword.mockResolvedValue(true);

      // Call the controller method
      await authController.changePassword(req, res, next);

      // Assertions
      expect(mockUser.comparePassword).toHaveBeenCalledWith('current-password');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
    });

    it('should return 400 if current password is incorrect', async () => {
      // Setup request
      req.body = {
        currentPassword: 'wrong-current-password',
        newPassword: 'new-password'
      };
      req.user = mockUser;
      mockUser.comparePassword.mockResolvedValue(false);

      // Call the controller method
      await authController.changePassword(req, res, next);

      // Assertions
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrong-current-password');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Current password is incorrect' });
    });
  });

  describe('forgotPassword', () => {
    it('should generate a reset token for an existing user', async () => {
      // Setup request
      req.body = {
        email: 'test@example.com'
      };

      // Mock user found
      User.findOne.mockResolvedValue(mockUser);
      mockUser.generatePasswordResetToken.mockResolvedValue('reset-token-123');

      // Call the controller method
      await authController.forgotPassword(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.generatePasswordResetToken).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset link sent. Please check your email.',
        resetUrl: 'https://example.com/reset-password?token=reset-token-123'
      });
    });

    it('should not reveal if user does not exist', async () => {
      // Setup request
      req.body = {
        email: 'nonexistent@example.com'
      };

      // User not found
      User.findOne.mockResolvedValue(null);

      // Call the controller method
      await authController.forgotPassword(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(res.json).toHaveBeenCalledWith({
        message: 'If your email exists in our system, a password reset link will be sent.'
      });
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      // Setup request
      req.body = {
        token: 'valid-reset-token',
        newPassword: 'new-password'
      };

      // Mock user with valid reset token
      const userWithResetToken = {
        ...mockUser,
        resetPasswordToken: 'valid-reset-token',
        resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour in the future
      };
      User.findOne.mockResolvedValue(userWithResetToken);

      // Call the controller method
      await authController.resetPassword(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ 
        where: { 
          resetPasswordToken: 'valid-reset-token',
          resetPasswordExpires: { $gt: expect.any(Date) }
        } 
      });
      expect(userWithResetToken.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Password has been reset successfully. You can now log in with your new password.'
      });
    });

    it('should return 400 if token or password is missing', async () => {
      // Setup request with missing password
      req.body = {
        token: 'valid-reset-token'
      };

      // Call the controller method
      await authController.resetPassword(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token and new password are required' });

      // Setup request with missing token
      req.body = {
        newPassword: 'new-password'
      };

      // Call the controller method again
      await authController.resetPassword(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token and new password are required' });
    });

    it('should return 400 if token is invalid or expired', async () => {
      // Setup request
      req.body = {
        token: 'invalid-reset-token',
        newPassword: 'new-password'
      };

      // No user found with this token
      User.findOne.mockResolvedValue(null);

      // Call the controller method
      await authController.resetPassword(req, res, next);

      // Assertions
      expect(User.findOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired password reset token' });
    });
  });
});