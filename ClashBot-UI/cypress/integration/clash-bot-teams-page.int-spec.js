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

  test('I should be able to login to Discord and see my details on the top right of the page.', () => {

  })
})
