describe('Simple Clash-Bot Webapp Application workflow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
  })

  it('Check to see if welcome message is displayed', () => {
    cy.get('#WelcomeMessage-Title').should('have.text', 'Welcome to Clash-Bot!');
    cy.get('#WelcomeMessage-LoginMessage').should('have.text', ' Please login to discord using the button below before continuing. ');
    cy.get('#WelcomeMessage-DiscordLogin-Btn').should('exist');
    cy.get('#WelcomeMessage-Calendar').should('exist');
  })
})
