describe('Oauth2 Clash-Bot Webapp Application workflow', () => {
  before(() => {
    localStorage.setItem('version', 'v4.0.1');
    cy.visit('http://localhost:4200');
    cy.get('#WelcomeMessage-Calendar').should('exist');
    cy.checkAndDismissReleaseNotification();
    cy.loginThroughOAuth();
    cy.get('#clash-bot-discord-username').should('be.enabled');
  })

  let verifyCard = (id, numberOfPlayers, playerToBeContained, playerToNotBeContained) => {
    cy.get(`#clash-bot-team-card-${id}-players #clash-bot-team-card-registered-player`)
        .should('have.length', numberOfPlayers);
    if (playerToBeContained) {
      cy.get(`#clash-bot-team-card-${id}-players #clash-bot-team-card-registered-player mat-panel-title`)
          .should('contain.text', playerToBeContained);
    } else {
      cy.get(`#clash-bot-team-card-${id}-players #clash-bot-team-card-registered-player mat-panel-title`)
          .should('not.contain.text', playerToNotBeContained);
    }
  }

  // Needs a Team named 'Pikachu'
  it('Check to see if welcome message is displayed and can navigate to Team Dashboard', () => {
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
    cy.get('app-team-card>#clash-bot-team-card').should('have.length.greaterThan', 4);
    cy.get('#clash-bot-teams-card-create-new-team-card').should('exist');
    cy.get('#clash-bot-team-card-lol-clashbotsupport-pikachu-title').should('have.text', 'Pikachu');
    cy.get('#clash-bot-team-card-lol-clashbotsupport-pikachu-subtitle-tournament').should('have.text', 'Awesome Sauce - Day 2');
    cy.get('#clash-bot-team-card-lol-clashbotsupport-pikachu-players mat-accordion').should('have.length.greaterThan', 4);
  })

  // Swapping between a role on a same Team
  it('Should be able to swap roles on the same Team (\'Blastoise\')', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    let id = getTeamCard('LoL ClashBotSupport', 'Blastoise');
    cy.get(`#clash-bot-teams-card-${id} #clash-bot-team-card-join-jg-register-button`).click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    verifyCard(id, 1, "Roïdräge");
    cy.get(`#clash-bot-teams-card-${id} #clash-bot-team-card-join-top-register-button`).click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    verifyCard(id, 1, "Roïdräge");
  })

  // Using 'awesome_sauce' with day '2' on server 'Goon Squad'
  it('Check to see if User is able to create a new Team on a Server that does not have any Clash Teams', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-goon-squad').click();
    cy.get('#clash-bot-team-card-no-data').should('exist');
    cy.get('app-team-card>#clash-bot-team-card').should('have.length', 1);
    let createNewTeamCard = cy.get('#clash-bot-teams-card-create-new-team-card');
    createNewTeamCard.should('exist');
    createNewTeamCard.get('#clash-bot-teams-card-create-new-button').click();
    createNewTeamCard = cy.get('#clash-bot-teams-card-create-new-team-card');
    let createNewTournamentDropDown = createNewTeamCard.get('#clash-bot-teams-card-create-new-tournament-dropdown');
    createNewTournamentDropDown.click();
    cy.get('#clash-bot-teams-card-create-new-dropdown-awesome_sauce-2').click();
    let createNewTeamRoleDropDown = createNewTeamCard.get('#clash-bot-teams-card-create-new-role-dropdown');
    createNewTeamRoleDropDown.click();
    cy.get('#clash-bot-teams-card-create-new-dropdown-top').click();
    cy.get('#clash-bot-team-card-no-data').should('not.exist');
    cy.get('app-team-card>#clash-bot-team-card').should('have.length', 1);
  })

  let navigateToTeamsPage = () => {
    cy.get('#clash-bot-menu').click();
    cy.get('#clash-bot-menu-teams-page').click();
  }

  // Needs a team with name 'Charizard' that User is not registered to
  it('User should be able to register for an existing Team', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    let id = getTeamCard('LoL ClashBotSupport', 'Charizard');
    verifyCard(id, 1, undefined, "Roïdräge");
    cy.get(`#clash-bot-teams-card-${id} #clash-bot-team-card-join-top-register-button`).click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    verifyCard(id, 2, "Roïdräge");
  })

  // Needs to unregister from a Team named 'Ho-oh' that User is registered to
  it('User should be able to unregister from an existing Team', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    let id = getTeamCard('LoL ClashBotSupport', 'Ho-oh');
    verifyCard(id, 2, "Roïdräge");
    cy.get('#clash-bot-team-card-mid-unregister-button').click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    verifyCard(id, 1, undefined, "Roïdräge");
    })

  // Uses 'awesome_sauce' day '3', teams 'Blastoise' and 'Blaziken'
  it('If a User belongs to another Team for the same tournament, they should be able to unregister from the existing Team and registered to the expected Team', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    let startTeamId = getTeamCard('LoL ClashBotSupport', 'Blastoise');
    let endTeamId = getTeamCard('LoL ClashBotSupport', 'Blaziken');
    verifyCard(startTeamId, 1, "Roïdräge");
    verifyCard(endTeamId, 1, undefined, "Roïdräge");
    cy.get(`#clash-bot-teams-card-${endTeamId} #clash-bot-team-card-join-top-register-button`).click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    verifyCard(endTeamId, 2, "Roïdräge");
    cy.get(`#clash-bot-teams-card-${startTeamId}`).should('not.exist');
  })

  // User needs to exist on Team 'Blaziken' for 'awesome_sauce' day 3 to start
  it('If a user requests to be on tentative, they should be able to see their name show in the tentative column.', () => {
    navigateToTeamsPage();
    cy.get('#clash-bot-teams-lol-clashbotsupport').click();
    cy.get('#clash-bot-teams-dashboard-show-tentative').click();
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-tentative-players').should('not.text', 'Roïdräge');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-add').should('exist');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-remove').should('not.exist');
    let startingCardStateId = getTeamCard('LoL ClashBotSupport', 'Blaziken');
    verifyCard(startingCardStateId, 2, "Roïdräge");
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-add').click();
    cy.get(`#clash-bot-dialog-box-yes-button`).click();
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-remove').should('exist');
    cy.get('#clash-bot-teams-dashboard-awesome_sauce-3-add').should('not.exist');
    let endingCardStateId = getTeamCard('LoL ClashBotSupport', 'Blaziken');
    verifyCard(endingCardStateId, 1, undefined, "Roïdräge");
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
