import * as mocks from '../mocks/welcomePageMocks';

describe('Simple Clash-Bot Webapp Application workflow', () => {
  beforeEach(() => {
    cy.server();
    cy.fixture('example.json').then(rc => {
      mocks.getWelcomePageData(rc.getSamplePayload, {}, '');
    })
    cy.visit('http://localhost:4200');
    cy.wait('@getWelcomePageData');
  })

  it('Check to see if welcome message is displayed', () => {
    cy.get('#WelcomeMessage-Title').should('have.text', 'Welcome to Clash-Bot!');
    // cy.get('#WelcomeMessage-Message').should('have.text', ' This site is here to help you and your friends quickly group up through discord to compete in a League of Legends Clash Tournament. We have a Discord Bot if you\'d like to use it with your Server, you can add it to your Server at ');
    cy.get('#WelcomeMessage-LoginMessage').should('have.text', ' Please login to discord using the button below before continuing. ');
    cy.get('#WelcomeMessage-DiscordLogin-Btn').should('exist');
    cy.get('#WelcomeMessage-Calendar').should('exist');
  })
})
