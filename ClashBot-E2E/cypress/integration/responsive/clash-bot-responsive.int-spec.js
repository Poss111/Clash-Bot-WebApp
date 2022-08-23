describe('Home Page', () => {

    before(() => {
        cy.viewport(Cypress.env('resolution'));
    })

    beforeEach(() => {
        localStorage.clear();
        console.log(`Branch Name : '${Cypress.env('branch_name')}'`);
        cy.eyesOpen({
            appName: 'Clash Bot',
            testName: Cypress.currentTest.title,
            branchName: Cypress.env('branch_name'),
            layoutBreakpoints: [Cypress.config("viewportWidth")]
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
