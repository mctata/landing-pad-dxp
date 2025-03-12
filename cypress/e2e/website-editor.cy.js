describe('Website Editor', () => {
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
          createdAt: new Date().toISOString(),
          pages: [
            {
              id: 'page-1',
              name: 'Home',
              path: '/',
              isHomePage: true
            }
          ]
        }
      }
    }).as('getWebsite');
    
    // Mock page data
    cy.intercept('GET', '/api/websites/website-123/pages/page-1', {
      statusCode: 200,
      body: {
        page: {
          id: 'page-1',
          name: 'Home',
          path: '/',
          isHomePage: true,
          elements: []
        }
      }
    }).as('getPage');
    
    // Mock page update
    cy.intercept('PUT', '/api/websites/website-123/pages/page-1', {
      statusCode: 200,
      body: {
        message: 'Page updated successfully'
      }
    }).as('updatePage');
    
    cy.visit('/editor/website-123');
    cy.wait('@getWebsite');
    cy.wait('@getPage');
  });

  it('should show the editor interface', () => {
    // Check main editor components
    cy.contains('Test Website').should('be.visible');
    cy.contains('Home').should('be.visible');
    cy.contains('Add Element').should('be.visible');
    cy.contains('Publish').should('be.visible');
  });

  it('should add a text element to the page', () => {
    // Open add element panel
    cy.contains('Add Element').click();
    
    // Select text element
    cy.contains('Text').click();
    
    // Check that element was added
    cy.get('.editor-canvas').within(() => {
      cy.get('.text-element').should('be.visible');
    });
    
    // Save the page
    cy.contains('Save').click();
    cy.wait('@updatePage');
    
    // Should show success message
    cy.contains('Page saved successfully').should('be.visible');
  });

  it('should edit a page element', () => {
    // Mock API to return a page with elements
    cy.intercept('GET', '/api/websites/website-123/pages/page-1', {
      statusCode: 200,
      body: {
        page: {
          id: 'page-1',
          name: 'Home',
          path: '/',
          isHomePage: true,
          elements: [
            {
              id: 'elem-1',
              type: 'heading',
              content: {
                text: 'Welcome to our website'
              },
              position: { x: 0, y: 0 }
            }
          ]
        }
      }
    }).as('getPageWithElements');
    
    // Refresh to get new data
    cy.visit('/editor/website-123');
    cy.wait('@getWebsite');
    cy.wait('@getPageWithElements');
    
    // Click on the element to edit
    cy.get('.editor-canvas').within(() => {
      cy.get('.heading-element').click();
    });
    
    // Edit the element content
    cy.get('.element-editor').within(() => {
      cy.get('input').clear().type('Updated Heading');
      cy.contains('Apply').click();
    });
    
    // Save the changes
    cy.contains('Save').click();
    cy.wait('@updatePage');
    
    // Should show the updated content
    cy.get('.editor-canvas').within(() => {
      cy.contains('Updated Heading').should('be.visible');
    });
  });
});
