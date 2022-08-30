const MAT_CHIP_LOCATORS = '#clash-bot-user-profile-preferred-champions-list>div>div>div>mat-chip-list>div>mat-chip';
let initialUserData = {};

const menuId = '#clash-bot-menu';
const profileIconId = '#clash-bot-discord-username';
const settingsMenuId = '#clash-bot-menu-user-profile-page';
const userProfileUsernameId = '#clash-bot-user-profile-username';
const userProfileUndoButtonId = '#clash-bot-user-profile-undo';
const discordNotificationToggle = '#clash-bot-user-profile-discord-dm-notification-toggle';
const userProfileDefaultGuildId = '#clash-bot-user-profile-default-guild';

describe('Validate User Profile of Clash Bot', () => {
  before(() => {
    localStorage.setItem('version', 'v4.0.1');
    cy.visit('http://localhost:4200');
    cy.checkAndDismissReleaseNotification();
    cy.get('#WelcomeMessage-Calendar').should('exist');
    cy.loginThroughOAuth();
    cy.get(profileIconId).should('be.enabled');
  })

  beforeEach(() => {
    localStorage.setItem('leagueApiVersion', '12.8.1');
    cy.request('patch', 'http://localhost:8080/api/v2/user', {
      id: '299370234228506627',
      // TODO - Update with LoL-ClashBotSupport id
      serverId: '',
      name: 'Roïdräge'
    });
    cy.request('post', 'http://localhost:8080/api/v2/user/299370234228506627/champions', {
      champions: ['Volibear','Ornn','Mordekaiser']
    });
    cy.request('delete', 'http://localhost:8080/api/v2/user/299370234228506627/subscriptions');
  })

  function searchForChampion(searchTeam, championName) {
    let championNameLC = championName.toLowerCase();
    cy.get('#clash-bot-user-profile-preferred-champion-input').type(searchTeam);
    cy.get(`#clash-bot-user-profile-preferred-champion-${championNameLC}-autocomplete`).click();
  }

  it('I should be able to successfully navigate to the User Profile, edit my information and save then validate it has been updated by navigating away and back.', () => {
    cy.get(profileIconId).click();
    cy.get(settingsMenuId).click();
    cy.get(userProfileUsernameId, { timeout: 15000 }).should('have.text', 'Roïdräge');
    cy.get(userProfileDefaultGuildId).should('have.text', 'LoL-ClashBotSupport');
    cy.get(userProfileDefaultGuildId).click();
    cy.get('#clash-bot-user-profile-autocomplete-lolclashbotsupport-guild').should('contain.text', 'LoL-ClashBotSupport');
    cy.get('#clash-bot-user-profile-autocomplete-lolclashbotsupport-guild').click()
    cy.get(MAT_CHIP_LOCATORS).should('have.length', '3');
    searchForChampion('Se', 'Sett');
    cy.get('#clash-bot-user-profile-preferred-champion-sett').should('exist');
    cy.get(discordNotificationToggle + '>label>div>input').should('not.be.checked');
    cy.get(discordNotificationToggle).click();
    cy.get(discordNotificationToggle + '>label>div>input').should('be.checked');
    cy.get(userProfileUndoButtonId).click();
    cy.get('#clash-bot-user-profile-preferred-champion-sett').should('not.exist');
    cy.get(discordNotificationToggle + '>label>div>input').should('not.be.checked');
    searchForChampion('Se', 'Sett');
    cy.get(discordNotificationToggle).click();
    cy.get('#clash-bot-user-profile-submit').click();
    cy.get('#clash-bot-user-profile-call-in-progress-bar', {timeout: 7000}).should('not.exist');
    cy.get(menuId).click();
    cy.get('#clash-bot-menu-welcome-page').click();
    cy.get(profileIconId).click();
    cy.get(settingsMenuId).click();
    cy.get('#clash-bot-user-profile-preferred-champion-sett').should('exist');
    cy.get(discordNotificationToggle + '>label>div>input').should('be.checked');
    cy.get(menuId).click();
    cy.get('#clash-bot-menu-teams-page').click();
    cy.get('#selected-server').should('contain.text', 'LoL-ClashBotSupport');
  })

  it('I should not be able to enter more than 5 champions in my preferred list.', () => {
    cy.get(profileIconId).click();
    cy.get(settingsMenuId).click();
    cy.get(userProfileUsernameId, { timeout: 15000 }).should('have.text', 'Roïdräge');
    searchForChampion('Ahri', 'Ahri');
    searchForChampion('Rammus', 'Rammus');
    searchForChampion('Zoe', 'Zoe');
    searchForChampion('Zed', 'Zed');
    searchForChampion('Jinx', 'Jinx');
    searchForChampion('Jhin', 'Jhin');
    cy.get(MAT_CHIP_LOCATORS).should('have.length', '5');
  })

})
