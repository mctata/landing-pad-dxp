describe('Domain Management', () => {
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
          status: 'published',
          lastPublishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      }
    }).as('getWebsite');
    
    // Mock domains list
    cy.intercept('GET', '/api/websites/website-123/domains', {
      statusCode: 200,
      body: {
        domains: [
          {
            id: 'domain-1',
            name: 'example.com',
            status: 'active',
            verificationStatus: 'verified',
            isPrimary: true,
            createdAt: new Date().toISOString()
          }
        ]
      }
    }).as('getDomains');
    
    // Mock domain addition
    cy.intercept('POST', '/api/websites/website-123/domains', {
      statusCode: 201,
      body: {
        message: 'Domain added successfully',
        domain: {
          id: 'domain-2',
          name: 'newdomain.com',
          status: 'pending',
          verificationStatus: 'pending',
          isPrimary: false,
          createdAt: new Date().toISOString(),
          dnsRecords: [
            { type: 'CNAME', host: 'www.newdomain.com', value: 'website-123.landingpad.digital' },
            { type: 'A', host: 'newdomain.com', value: '76.76.21.21' }
          ]
        }
      }
    }).as('addDomain');
    
    // Mock domain verification
    cy.intercept('POST', '/api/websites/website-123/domains/domain-2/verify', {
      statusCode: 200,
      body: {
        message: 'Domain verification initiated',
        status: 'verified'
      }
    }).as('verifyDomain');
    
    cy.visit('/dashboard/website-123/domains');
    cy.wait('@getWebsite');
    cy.wait('@getDomains');
  });

  it('should display existing domains', () => {
    // Check that the domain is displayed
    cy.contains('example.com').should('be.visible');
    cy.contains('Primary').should('be.visible');
    cy.contains('Verified').should('be.visible');
  });

  it('should add a new domain', () => {
    // Click add domain button
    cy.contains('Add Domain').click();
    
    // Fill in domain name
    cy.get('input[name="domainName"]').type('newdomain.com');
    
    // Submit the form
    cy.contains('button', 'Add').click();
    
    // Wait for API request
    cy.wait('@addDomain');
    
    // Should show success message and DNS instructions
    cy.contains('Domain added successfully').should('be.visible');
    cy.contains('DNS Records').should('be.visible');
    cy.contains('CNAME').should('be.visible');
    cy.contains('A').should('be.visible');
  });

  it('should verify a domain', () => {
    // Mock domains with a pending domain
    cy.intercept('GET', '/api/websites/website-123/domains', {
      statusCode: 200,
      body: {
        domains: [
          {
            id: 'domain-1',
            name: 'example.com',
            status: 'active',
            verificationStatus: 'verified',
            isPrimary: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'domain-2',
            name: 'newdomain.com',
            status: 'pending',
            verificationStatus: 'pending',
            isPrimary: false,
            createdAt: new Date().toISOString()
          }
        ]
      }
    }).as('getDomainsWithPending');
    
    // Refresh page to get new domain list
    cy.visit('/dashboard/website-123/domains');
    cy.wait('@getWebsite');
    cy.wait('@getDomainsWithPending');
    
    // Find the pending domain and click verify
    cy.contains('tr', 'newdomain.com').within(() => {
      cy.contains('Verify').click();
    });
    
    // Wait for API request
    cy.wait('@verifyDomain');
    
    // Should show success message
    cy.contains('Domain verification initiated').should('be.visible');
  });
});
