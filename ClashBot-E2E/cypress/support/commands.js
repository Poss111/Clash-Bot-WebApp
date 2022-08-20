Cypress.Commands.add('loginThroughOAuth', () => {
    if (!window.sessionStorage.getItem('access_token')) {
        const client_id = Cypress.env('auth0_client_id')
        const client_secret = Cypress.env('auth0_client_secret')
        const scope = Cypress.env('auth0_scope')
        const grant_type = Cypress.env('auth0_grant_type')

        cy.request({
            method: 'POST',
            url: 'https://discord.com/api/oauth2/token',
            auth: {
                user: client_id,
                pass: client_secret
            },
            body: {
                'grant_type': grant_type,
                'scope': scope
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(({body}) => {
            window.sessionStorage.setItem('access_token', body.access_token);
            cy.visit('/')
        })
    } else {
        cy.log('Already logged in.');
    }
})

Cypress.Commands.add('checkAndDismissReleaseNotification', () => {
    if(!localStorage.getItem('version')) {
        cy.get('#clash-bot-release-notification-button-dismiss').scrollIntoView().click();
        cy.get('#clash-bot-release-notification-markdown-container').should('not.exist');
    }
});
