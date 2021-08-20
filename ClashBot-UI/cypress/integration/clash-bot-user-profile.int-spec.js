describe('Validate User Profile of Clash Bot', () => {
  before(() => {
    cy.visit('http://localhost:4200');
    cy.get('#WelcomeMessage-Calendar').should('exist');
    cy.loginThroughOAuth();
    cy.get('#clash-bot-discord-username').should('have.text', 'Roïdräge');
  })

  function searchForChampion(searchTeam, championName) {
    let championNameLC = championName.toLowerCase();
    cy.get('#clash-bot-user-profile-preferred-champion-input').type(searchTeam);
    cy.get(`#clash-bot-user-profile-preferred-champion-${championNameLC}-autocomplete`).click();
  }

  it('I should be able to successfully navigate to the User Profile, edit my information and save then validate it has been updated by navigating away and back.', () => {
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-user-profile-page').click();
    cy.get('#clash-bot-user-profile-username').should('have.text', 'Roïdräge');
    cy.get('#clash-bot-user-profile-default-guild').should('have.text', 'LoL-ClashBotSupport');
    cy.get('#clash-bot-user-profile-default-guild').click();
    cy.get('#clash-bot-user-profile-autocomplete-lolclashbotsupport-guild').should('contain.text', 'LoL-ClashBotSupport');
    cy.get('#clash-bot-user-profile-autocomplete-lolclashbotsupport-guild').click()
    cy.get('#clash-bot-user-profile-preferred-champions-list').should('have.length', '0');
    searchForChampion('Se', 'Sett');
    cy.get('#clash-bot-user-profile-preferred-champion-sett').should('exist');
    cy.get('#clash-bot-user-profile-discord-dm-notification-toggle>label>div>input').should('not.be.checked');
    cy.get('#clash-bot-user-profile-discord-dm-notification-toggle').click();
    cy.get('#clash-bot-user-profile-discord-dm-notification-toggle>label>div>input').should('be.checked');
    cy.get('#clash-bot-user-profile-undo').click();
    cy.get('#clash-bot-user-profile-preferred-champion-sett').should('not.exist');
    cy.get('#clash-bot-user-profile-discord-dm-notification-toggle>label>div>input').should('not.be.checked');
    searchForChampion('Se', 'Sett');
    cy.get('#clash-bot-user-profile-discord-dm-notification-toggle').click();
    cy.get('#clash-bot-user-profile-submit').click();
    cy.get('#clash-bot-user-profile-call-in-progress-bar', {timeout: 7000}).should('not.exist');
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-welcome-page').click();
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-user-profile-page').click();
    cy.get('#clash-bot-user-profile-preferred-champion-sett').should('exist');
    cy.get('#clash-bot-user-profile-discord-dm-notification-toggle>label>div>input').should('be.checked');
  })
})
