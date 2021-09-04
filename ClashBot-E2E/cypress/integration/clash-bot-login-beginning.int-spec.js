describe('Simple Clash-Bot Webapp Application workflow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
  })

  it('Check to see if welcome message is displayed', () => {
    cy.get('#WelcomeMessage-Title').should('have.text', 'Welcome to Clash-Bot!');
    cy.get('#WelcomeMessage-LoginMessage').should('have.text', ' Please login to discord using the button below before continuing. ');
    cy.get('#WelcomeMessage-DiscordLogin-Btn').should('exist');
    cy.get('#WelcomeMessage-Calendar').should('exist');
    cy.get('#clash-bot-calendar-header-button-prev').should('be.disabled');
    cy.get('#clash-bot-calendar-header-button-next').should('not.be.disabled');
    cy.get('#clash-bot-calendar-header-button-next').click();
    cy.get('#clash-bot-calendar-header-button-prev').should('not.be.disabled');
    cy.get('#clash-bot-calendar-header-button-next').should('not.be.disabled');
  })

  it('Validate Upcoming Tournaments card is displayed on Dashboard', () => {
    cy.get('#clash-bot-upcoming-tournaments-list>mat-list-item').should('have.length.at.least', 3);
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-2-name').should('have.text', 'Awesome Sauce');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-2-day').should('have.text', 'Day 2');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-2-time').should('exist');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-3-name').should('have.text', 'Awesome Sauce');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-3-day').should('have.text', 'Day 3');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-3-time').should('exist');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-4-name').should('have.text', 'Awesome Sauce');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-4-day').should('have.text', 'Day 4');
    cy.get('#clash-bot-upcoming-tournaments-awesome_sauce-4-time').should('exist');
  })
})
