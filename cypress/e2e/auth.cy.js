describe('Authentication', () => {
  beforeEach(() => {
    cy.fixture('user').as('user');
    
    // Basic auth mocks
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        accessToken: 'fake-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          emailVerified: true
        }
      }
    }).as('loginRequest');
    
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'User registered successfully. Please verify your email.',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          emailVerified: false
        }
      }
    }).as('registerRequest');
    
    // Mock for refresh token endpoint
    cy.intercept('POST', '/api/auth/refresh-token', {
      statusCode: 200,
      body: {
        accessToken: 'new-fake-token'
      }
    }).as('refreshToken');
    
    // Mock for email verification
    cy.intercept('GET', '/api/auth/verify-email/*', {
      statusCode: 200,
      body: {
        message: 'Email verified successfully',
        success: true
      }
    }).as('verifyEmail');
    
    // Mock for resend verification email
    cy.intercept('POST', '/api/auth/resend-verification', {
      statusCode: 200,
      body: {
        message: 'Verification email resent successfully'
      }
    }).as('resendVerification');
    
    // Social login mocks
    cy.intercept('GET', '/api/auth/google/callback*', {
      statusCode: 200,
      body: {
        message: 'Google login successful',
        accessToken: 'google-fake-token',
        user: {
          id: '456',
          email: 'google@example.com',
          firstName: 'Google',
          lastName: 'User',
          googleId: '12345',
          emailVerified: true
        }
      }
    }).as('googleLogin');
    
    cy.intercept('GET', '/api/auth/facebook/callback*', {
      statusCode: 200,
      body: {
        message: 'Facebook login successful',
        accessToken: 'facebook-fake-token',
        user: {
          id: '789',
          email: 'facebook@example.com',
          firstName: 'Facebook',
          lastName: 'User',
          facebookId: '67890',
          emailVerified: true
        }
      }
    }).as('facebookLogin');
    
    cy.intercept('GET', '/api/auth/linkedin/callback*', {
      statusCode: 200,
      body: {
        message: 'LinkedIn login successful',
        accessToken: 'linkedin-fake-token',
        user: {
          id: '101',
          email: 'linkedin@example.com',
          firstName: 'LinkedIn',
          lastName: 'User',
          linkedinId: '13579',
          emailVerified: true
        }
      }
    }).as('linkedinLogin');
  });

  describe('Standard Authentication', () => {
    it('should allow login with correct credentials', function() {
      cy.visit('/login');
      
      cy.get('input[type="email"]').type(this.user.email);
      cy.get('input[type="password"]').type(this.user.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
    });

    it('should show error with incorrect credentials', function() {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          message: 'Invalid email or password'
        }
      }).as('failedLoginRequest');
      
      cy.visit('/login');
      
      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@failedLoginRequest');
      cy.contains('Invalid email or password').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('should allow new user registration', function() {
      cy.visit('/signup');
      
      cy.get('input[name="firstName"]').type(this.user.firstName);
      cy.get('input[name="lastName"]').type(this.user.lastName);
      cy.get('input[type="email"]').type(this.user.email);
      cy.get('input[type="password"]').type(this.user.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait('@registerRequest');
      cy.contains('User registered successfully').should('be.visible');
      cy.contains('Please verify your email').should('be.visible');
    });
    
    it('should handle password validation during registration', function() {
      cy.visit('/signup');
      
      cy.get('input[name="firstName"]').type(this.user.firstName);
      cy.get('input[name="lastName"]').type(this.user.lastName);
      cy.get('input[type="email"]').type(this.user.email);
      cy.get('input[type="password"]').type('weak');
      cy.get('button[type="submit"]').click();
      
      // Should see validation error without API call
      cy.contains('Password must be at least 8 characters').should('be.visible');
      cy.contains('Password must include at least one number').should('be.visible');
    });
    
    it('should prevent login for unverified email', function() {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          message: 'Email not verified. Please check your inbox to verify your email.'
        }
      }).as('unverifiedLogin');
      
      cy.visit('/login');
      
      cy.get('input[type="email"]').type('unverified@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@unverifiedLogin');
      cy.contains('Email not verified').should('be.visible');
      cy.contains('Resend verification email').should('be.visible');
    });
  });

  describe('Email Verification', () => {
    it('should verify email successfully with valid token', function() {
      // Simulate accessing verification link from email
      cy.visit('/auth/verify-email?token=valid-token-12345');
      
      cy.wait('@verifyEmail');
      cy.contains('Email verified successfully').should('be.visible');
      cy.contains('Continue to login').should('be.visible');
      cy.get('a').contains('Continue to login').click();
      cy.url().should('include', '/login');
    });
    
    it('should handle invalid verification token', function() {
      cy.intercept('GET', '/api/auth/verify-email/*', {
        statusCode: 400,
        body: {
          message: 'Invalid or expired verification token',
          success: false
        }
      }).as('invalidVerifyToken');
      
      cy.visit('/auth/verify-email?token=invalid-token');
      
      cy.wait('@invalidVerifyToken');
      cy.contains('Invalid or expired verification token').should('be.visible');
      cy.contains('Request a new verification email').should('be.visible');
    });
    
    it('should allow resending verification email', function() {
      cy.visit('/login');
      
      // Attempt login with unverified email
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          message: 'Email not verified. Please check your inbox to verify your email.'
        }
      }).as('unverifiedLogin');
      
      cy.get('input[type="email"]').type('unverified@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@unverifiedLogin');
      
      // Click resend verification button
      cy.contains('Resend verification email').click();
      
      // Should make API call and show success message
      cy.wait('@resendVerification');
      cy.contains('Verification email sent').should('be.visible');
    });
  });

  describe('Social Login', () => {
    it('should redirect to Google OAuth', function() {
      cy.visit('/login');
      cy.get('button').contains('Continue with Google').click();
      
      // Verify the redirection request was made
      cy.location('pathname').should('include', '/api/auth/google');
    });
    
    it('should handle Google OAuth callback', function() {
      // Simulate coming back from Google OAuth
      cy.visit('/api/auth/google/callback?code=12345');
      
      cy.wait('@googleLogin');
      cy.url().should('include', '/dashboard');
    });
    
    it('should redirect to Facebook OAuth', function() {
      cy.visit('/login');
      cy.get('button').contains('Continue with Facebook').click();
      
      // Verify the redirection request was made
      cy.location('pathname').should('include', '/api/auth/facebook');
    });
    
    it('should handle Facebook OAuth callback', function() {
      // Simulate coming back from Facebook OAuth
      cy.visit('/api/auth/facebook/callback?code=67890');
      
      cy.wait('@facebookLogin');
      cy.url().should('include', '/dashboard');
    });
    
    it('should redirect to LinkedIn OAuth', function() {
      cy.visit('/login');
      cy.get('button').contains('Continue with LinkedIn').click();
      
      // Verify the redirection request was made
      cy.location('pathname').should('include', '/api/auth/linkedin');
    });
    
    it('should handle LinkedIn OAuth callback', function() {
      // Simulate coming back from LinkedIn OAuth
      cy.visit('/api/auth/linkedin/callback?code=13579');
      
      cy.wait('@linkedinLogin');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Token Management', () => {
    it('should handle token refresh on expired token', function() {
      // Setup local storage with expired token
      cy.window().then((win) => {
        win.localStorage.setItem('accessToken', 'expired-token');
      });
      
      // Visit protected page that will trigger token refresh
      cy.visit('/dashboard');
      
      // Should trigger refresh token API call
      cy.wait('@refreshToken');
      
      // Should update token in local storage
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.eq('new-fake-token');
      });
      
      // Should successfully load dashboard
      cy.url().should('include', '/dashboard');
    });
    
    it('should handle failed token refresh', function() {
      // Override refresh token response to simulate failure
      cy.intercept('POST', '/api/auth/refresh-token', {
        statusCode: 401,
        body: {
          message: 'Invalid refresh token'
        }
      }).as('failedRefreshToken');
      
      // Setup local storage with expired token
      cy.window().then((win) => {
        win.localStorage.setItem('accessToken', 'expired-token');
      });
      
      // Visit protected page that will trigger token refresh
      cy.visit('/dashboard');
      
      // Should trigger refresh token API call
      cy.wait('@failedRefreshToken');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });
});
