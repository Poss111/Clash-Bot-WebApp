describe('Home Page', () => {

    beforeEach(() => {
        localStorage.clear();
        cy.eyesOpen({
            appName: 'Clash Bot',
            testName: Cypress.currentTest.title,
            branchName: Cypress.env('branch_name'),
            layoutBreakpoints: [375, 667, 1280, 1536]
        });
    });

    it('Should be able to view the Home Page (Not Logged in)', () => {

        // Load the login page.
        cy.visit('http://localhost:4200');

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
