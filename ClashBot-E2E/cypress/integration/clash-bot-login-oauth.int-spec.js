describe('Oauth2 Clash-Bot Webapp Application workflow', () => {
  before(() => {
    cy.visit('http://localhost:4200');
    cy.get('#WelcomeMessage-Calendar').should('exist');
    cy.loginThroughOAuth();
    cy.get('#clash-bot-discord-username').should('have.text', 'Roïdräge');
  })

  it('Check to see if welcome message is displayed', () => {
    cy.get('#WelcomeMessage-Title').should('have.text', 'Welcome to Clash-Bot!');
    cy.get('#WelcomeMessage-LoginMessage').should('not.exist');
    cy.get('#WelcomeMessage-DiscordLogin-Btn').should('not.exist');
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-welcome-page').should('exist');
    cy.get('#clash-bot-menu-teams-page').should('exist');
    cy.get('#clash-bot-menu-teams-page').click();
    cy.get('#clash-bot-teams-header').should('have.text', 'Your available Servers to filter by');
    cy.get('#clash-bot-teams-lol-clashbotsupport').should('contain.text', 'LoL-ClashBotSupport');
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    cy.get('app-team-card').should('have.length', 5);
    cy.get('#clash-bot-team-card-lol-clashbotsupport-team-pikachu-title').should('have.text', 'LoL-ClashBotSupport - Team Pikachu');
    cy.get('#clash-bot-team-card-lol-clashbotsupport-team-pikachu-subtitle-tournament').should('have.text', 'Awesome Sauce - Day 2');
    cy.get('#clash-bot-team-card-lol-clashbotsupport-team-pikachu-players>div').should('have.length', 5);
  })

  it('Check to see if User is able to create a new Team on a Server that does not have any Clash Teams', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-goon-squad').click();
    cy.get('#clash-bot-team-card-no-data').should('exist');
    cy.get('app-team-card').should('have.length', 1);
    let createNewTeamCard = cy.get('#clash-bot-teams-card-create-new-team-card');
    createNewTeamCard.should('exist');
    createNewTeamCard.get('#clash-bot-teams-card-create-new-button').click();
    createNewTeamCard = cy.get('#clash-bot-teams-card-create-new-team-card');
    let createNewTeamDropDown = createNewTeamCard.get('#clash-bot-teams-card-create-new-dropdown');
    createNewTeamDropDown.click();
    cy.get('#clash-bot-teams-card-create-new-dropdown-awesome_sauce-2').click();
    cy.get('#clash-bot-team-card-no-data').should('not.exist');
    cy.get('#clash-bot-teams-card-goon-squad-team-abra').should('exist');
  })

  let navigateToTeamsPage = () => {
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-teams-page').click();
  }

  it('User should be able to register for an existing Team', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    let id = getTeamCard('LoL ClashBotSupport', 'Team Charizard');
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('have.length', 1);
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('not.contain.text', 'Roïdräge');
    cy.get(`#clash-bot-team-card-${id}-register-button`).click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('have.length', 2);
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('contain', 'Roïdräge');
  })

  it('User should be able to unregister from an existing Team', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    let id = getTeamCard('LoL ClashBotSupport', 'Team Ho-oh');
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('have.length', 2);
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('contain.text', 'Roïdräge');
    cy.get(`#clash-bot-team-card-${id}-unregister-button`).click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('have.length', 1);
    cy.get(`#clash-bot-team-card-${id}-players>div`).should('not.contain.text', 'Roïdräge');
  })

  it('If a User belongs to another Team for the same tournament, they should be able to unregister from then existing Team and registered to the expected Team', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    let startTeamId = getTeamCard('LoL ClashBotSupport', 'Team Blastoise');
    let endTeamId = getTeamCard('LoL ClashBotSupport', 'Team Blaziken');
    cy.get(`#clash-bot-team-card-${startTeamId}-players>div`).should('have.length', 1);
    cy.get(`#clash-bot-team-card-${startTeamId}-players>div`).should('contain.text', 'Roïdräge');
    cy.get(`#clash-bot-team-card-${endTeamId}-register-button`).click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    cy.get(`#clash-bot-team-card-${endTeamId}-players>div`).should('have.length', 2);
    cy.get(`#clash-bot-team-card-${endTeamId}-players>div`).should('contain.text', 'Roïdräge');
    cy.get(`#clash-bot-teams-card-${startTeamId}`).should('not.exist');
  })

  it('If a user requests to be on tentative, they should be able to see their name show in the tentative column.', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    cy.get('#clash-bot-teams-dashboard-show-tentative').click();
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-tentative-players').should('not.text', 'Roïdräge');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-add').should('exist');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-remove').should('not.exist');
    let startingCardStateId = getTeamCard('LoL ClashBotSupport', 'Team Blaziken');
    cy.get(`#clash-bot-team-card-${startingCardStateId}-players>div`).should('have.length', 2);
    cy.get(`#clash-bot-team-card-${startingCardStateId}-players>div`).should('contain.text', 'Roïdräge');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-add').click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-remove').should('exist');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-add').should('not.exist');
    let endingCardStateId = getTeamCard('LoL ClashBotSupport', 'Team Blaziken');
    cy.get(`#clash-bot-team-card-${endingCardStateId}-players>div`).should('have.length', 1);
    cy.get(`#clash-bot-team-card-${endingCardStateId}-players>div`).should('not.contain.text', 'Roïdräge');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-tentative-players').should('contain.text', 'Roïdräge');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-remove').click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-tentative-players').should('not.contain.text', 'Roïdräge');
  })

  let getTeamCard = (serverName, teamName) => {
    let updatedServerName = serverName.toLowerCase().replace(new RegExp(/ /g), '-');
    let updatedTeamName = teamName.toLowerCase().replace(new RegExp(/ /g), '-');
    return `${updatedServerName}-${updatedTeamName}`;
  }
})
