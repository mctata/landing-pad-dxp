describe('Homepage', () => {
  // Visit the homepage before each test
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the homepage correctly', () => {
    // Check main elements are present
    cy.get('h1').should('be.visible');
    cy.get('nav').should('be.visible');
    cy.contains('Sign Up').should('be.visible');
    cy.contains('Log In').should('be.visible');
  });

  it('should navigate to login page', () => {
    cy.contains('Log In').click();
    cy.url().should('include', '/login');
  });

  it('should navigate to signup page', () => {
    cy.contains('Sign Up').click();
    cy.url().should('include', '/signup');
  });
});
