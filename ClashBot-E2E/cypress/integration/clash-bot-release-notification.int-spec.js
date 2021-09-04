describe('Clash Bot Release Notification', () => {
    beforeEach(() => {
        localStorage.clear();
        cy.visit('http://localhost:4200');
    })

    it('Upon initial load of webpage, there should be a Release Notification dialog box showed', () => {
        cy.get('#clash-bot-release-notification-markdown-container').should('exist');
        cy.get('#clash-bot-release-notification-button-dismiss').click();
        cy.get('#clash-bot-release-notification-markdown-container').should('not.exist');
        cy.get('#WelcomeMessage-Title').should('have.text', 'Welcome to Clash-Bot!');
    })
})