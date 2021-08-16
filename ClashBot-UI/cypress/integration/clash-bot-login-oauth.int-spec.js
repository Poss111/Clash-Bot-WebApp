describe('Oauth2 Clash-Bot Webapp Application workflow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
    cy.loginThroughOAuth();
  })

  it('Check to see if welcome message is displayed', () => {
    cy.get('#WelcomeMessage-Title').should('have.text', 'Welcome to Clash-Bot!');
    cy.get('#WelcomeMessage-LoginMessage').should('not.exist');
    cy.get('#WelcomeMessage-DiscordLogin-Btn').should('not.exist');
    cy.get('#WelcomeMessage-Calendar').should('exist');
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-welcome-page').should('exist');
    cy.get('#clash-bot-menu-teams-page').should('exist');
    cy.get('#clash-bot-menu-teams-page').click();
    cy.get('#clash-bot-teams-header').should('have.text', 'Your available Servers to filter by');
    cy.get('#clash-bot-teams-lol-clashbotsupport').should('contain.text', 'LoL-ClashBotSupport');
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    cy.get('app-team-card').should('have.length', 3);
    cy.get('#clash-bot-teams-card-lol-clashbotsupport-team-pikachu #clash-bot-team-card-title').should('have.text', 'LoL-ClashBotSupport - Team Pikachu');
    cy.get('#clash-bot-teams-card-lol-clashbotsupport-team-pikachu #clash-bot-team-card-subtitle-tournament').should('have.text', 'awesome_sauce - Day 2');
    cy.get('#clash-bot-teams-card-lol-clashbotsupport-team-pikachu #clash-bot-team-card-players>div').should('have.length', 5);
  })
})
