describe('Authentication', () => {
  beforeEach(() => {
    cy.fixture('user').as('user');
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        accessToken: 'fake-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }
    }).as('loginRequest');
    
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'User registered successfully. Please verify your email.',
        accessToken: 'fake-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }
    }).as('registerRequest');
  });

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
  });
});
