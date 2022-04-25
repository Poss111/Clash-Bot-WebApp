const clashEventServiceImpl = require('../clash-event-service-impl');
const clashUserEventsDbImpl = require('../../dao/clash-user-events-db-impl');

jest.mock('../../dao/clash-user-events-db-impl');

beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
})

describe('User Added to Team Event', () => {

    test('A user event for being added to a Team with the team name should be passed to be created.', () => {
        clashEventServiceImpl.userAddedToTeam(username, teamname);
    })

})

describe('User Removed from Team Event', () => {
    test('A user event for being added to a Team with the team name should be passed to be created.', () => {
        clashEventServiceImpl.userRemovedFromTeam(username, teamname);
    })
})

describe('User updated their settings', () => {
    test('A user event for being added to a Team with the team name should be passed to be created.', () => {
        clashEventServiceImpl.userUpdatedSettings(username);
    })
})

describe('User placed on Tentative', () => {
    test('A user event for being added to a Team with the team name should be passed to be created.', () => {
        clashEventServiceImpl.userPlacedOnTentative(username);
    })
})