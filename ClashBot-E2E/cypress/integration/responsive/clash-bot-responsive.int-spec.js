describe('Home Page', () => {

    beforeEach(() => {
        localStorage.clear();
        cy.eyesOpen({
            appName: 'Clash Bot',
            testName: Cypress.currentTest.title,
        });
    });

    it('Should be able to view the Home Page (Not Logged in)', () => {

        // Load the login page.
        cy.visit('http://localhost:4200');

        cy.viewport(Cypress.env('resolution'))

        // Verify the full login page loaded correctly.
        cy.eyesCheckWindow({
            tag: "Release Page",
            target: 'window',
            fully: true
        });
    });

    afterEach(() => {
        cy.eyesClose();
    })
});
