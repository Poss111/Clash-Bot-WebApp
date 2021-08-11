export const getWelcomePageData = (response, userInfo, type) => {
  let endpoint = 'api/tournaments';

  cy.route({
    method: 'GET',
    url: endpoint,
    response
  }).as('getWelcomePageData');
}
