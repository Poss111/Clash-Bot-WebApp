const MAT_CHIP_LOCATORS = '#clash-bot-user-profile-preferred-champions-list>div>div>div>mat-chip-list>div>mat-chip';
let initialUserData = {};

describe('Validate User Profile of Clash Bot', () => {
  before(() => {
    localStorage.setItem('version', 'v4.0.1');
    cy.visit('http://localhost:4200');
    cy.get('#WelcomeMessage-Calendar').should('exist');
    cy.loginThroughOAuth();
    cy.get('#clash-bot-discord-username').should('have.text', 'Roïdräge');
    cy.request('get', 'http://localhost:80/api/user?id=299370234228506627')
        .then((response) => {
          initialUserData = response.body;
          initialUserData.playerName = 'Roïdräge';
        });
  })

  after(() => {
    cy.request('post', 'http://localhost:80/api/user', initialUserData);
  })

  function searchForChampion(searchTeam, championName) {
    let championNameLC = championName.toLowerCase();
    cy.get('#clash-bot-user-profile-preferred-champion-input').type(searchTeam);
    cy.get(`#clash-bot-user-profile-preferred-champion-${championNameLC}-autocomplete`).click();
  }

  it('I should be able to successfully navigate to the User Profile, edit my information and save then validate it has been updated by navigating away and back.', () => {
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-user-profile-page').click();
    cy.get('#clash-bot-user-profile-username', { timeout: 15000 }).should('have.text', 'Roïdräge');
    cy.get('#clash-bot-user-profile-default-guild').should('have.text', 'LoL-ClashBotSupport');
    cy.get('#clash-bot-user-profile-default-guild').click();
    cy.get('#clash-bot-user-profile-autocomplete-lolclashbotsupport-guild').should('contain.text', 'LoL-ClashBotSupport');
    cy.get('#clash-bot-user-profile-autocomplete-lolclashbotsupport-guild').click()
    cy.get(MAT_CHIP_LOCATORS).should('have.length', '3');
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
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-teams-page').click();
    cy.get('#clash-bot-teams-lol-clashbotsupport', { timeout: 10000 }).should('have.attr', 'aria-selected');
  })

  it('I should not be able to enter more than 5 champions in my preferred list.', () => {
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-user-profile-page').click();
    cy.get('#clash-bot-user-profile-username', { timeout: 15000 }).should('have.text', 'Roïdräge');
    searchForChampion('Ahri', 'Ahri');
    searchForChampion('Rammus', 'Rammus');
    searchForChampion('Zoe', 'Zoe');
    searchForChampion('Zed', 'Zed');
    searchForChampion('Jinx', 'Jinx');
    searchForChampion('Jhin', 'Jhin');
    cy.get(MAT_CHIP_LOCATORS).should('have.length', '5');
  })


})
