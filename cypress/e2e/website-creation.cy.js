describe('Website Creation', () => {
  beforeEach(() => {
    // Set up auth token to simulate logged in state
    window.localStorage.setItem('auth_token', 'fake-token');
    
    // Intercept dashboard api requests
    cy.intercept('GET', '/api/websites', {
      statusCode: 200,
      body: {
        websites: []
      }
    }).as('getWebsites');
    
    // Intercept website creation request
    cy.intercept('POST', '/api/websites', {
      statusCode: 201,
      body: {
        message: 'Website created successfully',
        website: {
          id: 'website-123',
          name: 'Test Website',
          industry: 'Technology',
          status: 'draft',
          createdAt: new Date().toISOString()
        }
      }
    }).as('createWebsite');
    
    cy.visit('/dashboard');
    cy.wait('@getWebsites');
  });

  it('should create a new website', () => {
    // Click the create new website button
    cy.contains('Create New Website').click();
    
    // Fill out the form
    cy.get('input[name="name"]').type('Test Website');
    cy.get('select[name="industry"]').select('Technology');
    
    // Submit the form
    cy.contains('button', 'Create').click();
    
    // Wait for API request and check redirect
    cy.wait('@createWebsite');
    cy.url().should('include', '/editor');
  });

  it('should validate the form inputs', () => {
    // Click the create new website button
    cy.contains('Create New Website').click();
    
    // Try to submit without entering any data
    cy.contains('button', 'Create').click();
    
    // Check for validation messages
    cy.contains('Website name is required').should('be.visible');
    
    // Fill out just the name
    cy.get('input[name="name"]').type('Test Website');
    cy.contains('button', 'Create').click();
    
    // Should still show industry validation
    cy.contains('Please select an industry').should('be.visible');
  });
});
