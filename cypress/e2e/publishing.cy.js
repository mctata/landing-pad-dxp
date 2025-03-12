describe('Website Publishing', () => {
  beforeEach(() => {
    // Set up auth token to simulate logged in state
    window.localStorage.setItem('auth_token', 'fake-token');
    
    // Mock the website data
    cy.intercept('GET', '/api/websites/website-123', {
      statusCode: 200,
      body: {
        website: {
          id: 'website-123',
          name: 'Test Website',
          industry: 'Technology',
          status: 'draft',
          createdAt: new Date().toISOString()
        }
      }
    }).as('getWebsite');
    
    // Mock deployment API
    cy.intercept('POST', '/api/websites/website-123/publish', {
      statusCode: 200,
      body: {
        message: 'Website publishing initiated',
        deployment: {
          id: 'deployment-123',
          status: 'queued',
          version: new Date().toISOString().replace(/[\-\:\.]/g, '').slice(0, 14),
          createdAt: new Date().toISOString()
        }
      }
    }).as('publishWebsite');
    
    // Mock deployments list
    cy.intercept('GET', '/api/websites/website-123/deployments*', {
      statusCode: 200,
      body: {
        deployments: [
          {
            id: 'deployment-1',
            status: 'success',
            version: '20250301120000',
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ],
        pagination: {
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1
        }
      }
    }).as('getDeployments');
    
    cy.visit('/dashboard/website-123/publish');
    cy.wait('@getWebsite');
    cy.wait('@getDeployments');
  });

  it('should display deployment history', () => {
    // Check for deployment history section
    cy.contains('Deployment History').should('be.visible');
    
    // Check for existing deployment
    cy.contains('tr', 'deployment-1').within(() => {
      cy.contains('Success').should('be.visible');
    });
  });

  it('should initiate a new deployment', () => {
    // Click the publish button
    cy.contains('Publish Website').click();
    
    // Confirm the action in the modal
    cy.contains('button', 'Confirm').click();
    
    // Wait for API request
    cy.wait('@publishWebsite');
    
    // Should show success message
    cy.contains('Website publishing initiated').should('be.visible');
    
    // Deployment should be added to the history
    cy.contains('Queued').should('be.visible');
  });

  it('should show deployment details', () => {
    // Mock deployment details
    cy.intercept('GET', '/api/websites/website-123/deployments/deployment-1', {
      statusCode: 200,
      body: {
        deployment: {
          id: 'deployment-1',
          status: 'success',
          version: '20250301120000',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86390000).toISOString(),
          logs: [
            { timestamp: new Date(Date.now() - 86400000).toISOString(), message: 'Deployment started' },
            { timestamp: new Date(Date.now() - 86395000).toISOString(), message: 'Building website' },
            { timestamp: new Date(Date.now() - 86390000).toISOString(), message: 'Deployment completed successfully' }
          ]
        }
      }
    }).as('getDeploymentDetails');
    
    // Click on deployment to view details
    cy.contains('tr', 'deployment-1').click();
    
    // Wait for API request
    cy.wait('@getDeploymentDetails');
    
    // Check details are displayed
    cy.contains('Deployment Details').should('be.visible');
    cy.contains('Status: Success').should('be.visible');
    cy.contains('Deployment Logs').should('be.visible');
    cy.contains('Deployment started').should('be.visible');
    cy.contains('Deployment completed successfully').should('be.visible');
  });
});
