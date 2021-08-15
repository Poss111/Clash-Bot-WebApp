const clashTeamsDbImpl = require('./dao/clash-teams-db-impl');
const clashTimeDbImpl = require('./dao/clash-time-db-impl');
const startUpApp = require('./application');
const request = require('supertest');

jest.mock('./dao/clash-teams-db-impl');
jest.mock('./dao/clash-time-db-impl');

describe('Clash Bot Service API Controller', () => {
    let application;
    let server;

    beforeAll(async () => {
        clashTimeDbImpl.initialize.mockResolvedValue(true);
        clashTeamsDbImpl.initialize.mockResolvedValue(true);
        application = await startUpApp();
        server = await application.listen();
    })

    afterAll(() => {
        server.close();
    })

    describe('Clash Teams API', () => {

        test('As a User, I should be able to call /api/dne with no filter and be able to return all available teams.', (done) => {
            const mockReturnedTeams = [
                {
                    startTime: "Jan 21 2021",
                    serverName: "Goon Squad",
                    teamName: "Team Abra",
                    tournamentName: "Awesome Sauce",
                    updatedAt: "2021-07-25T01:44:24.048Z",
                    tournamentDay: '1',
                    key: "Team Abra#Goon Squad#Awesome Sauce#1"
                },
                {
                    startTime: "Jan 21 2021",
                    serverName: "Goon Squad",
                    players: [
                        "Silv3rshard"
                    ],
                    teamName: "Team Absol",
                    tournamentName: "Awesome Sauce",
                    updatedAt: "2021-07-19T14:06:29.155Z",
                    tournamentDay: '1',
                    key: "Team Absol#Goon Squad#Awesome Sauce#1"
                }
            ];
            let expectedPayload = [];
            mockReturnedTeams.forEach(team => {
                if (team && team.players) {
                    expectedPayload.push({
                        teamName: team.teamName,
                        tournamentDetails: {
                            tournamentName: team.tournamentName,
                            tournamentDay: team.tournamentDay
                        },
                        serverName: team.serverName,
                        startTime: team.startTime,
                        playersDetails: Array.isArray(team.players) ? team.players.map(data => {
                            return {name: data}
                        }) : {}
                    });
                }
            });
            clashTeamsDbImpl.getTeams.mockResolvedValue(mockReturnedTeams);
            request(application)
                .get('/api/teams')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(expectedPayload);
                    done();
                })
        })

        test('As a User, I should be able to call /api/dne with no filter and if an error occurs, then I should see a generic response.', (done) => {
            clashTeamsDbImpl.getTeams.mockRejectedValue(new Error('Querying failed.'));
            request(application)
                .get('/api/teams')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Failed to retrieve Teams.'});
                    done();
                })
        })
    })

    describe('Clash Tournaments', () => {
        test('As a User, I should be able to call /api/tournaments and retrieve a list of available Tournaments', (done) => {
            const mockReturnedClashTournaments = [
                {
                    startTime: ":currentDate",
                    tournamentDay: ":tournamentDayOne",
                    key: ":tournamentName#:tournamentDayOne",
                    tournamentName: ":tournamentName",
                    registrationTime: ":currentDate"
                },
                {
                    startTime: ":datePlusOneDay",
                    tournamentDay: ":tournamentDayTwo",
                    key: ":tournamentName#:tournamentDayTwo",
                    tournamentName: ":tournamentName",
                    registrationTime: ":datePlusOneDay"
                },
                {
                    startTime: ":datePlusTwoDays",
                    tournamentDay: ":tournamentDayThree",
                    key: ":tournamentName#:tournamentDayThree",
                    tournamentName: ":tournamentName",
                    registrationTime: ":datePlusTwoDays"
                },
                {
                    startTime: ":datePlusThreeDays",
                    tournamentDay: ":tournamentDayFour",
                    key: ":tournamentName#:tournamentDayFour",
                    tournamentName: ":tournamentName",
                    registrationTime: ":datePlusThreeDays"
                }
            ];
            let expectedPayload = [];
            mockReturnedClashTournaments.forEach(tournament => {
                expectedPayload.push({
                    tournamentName: tournament.tournamentName,
                    tournamentDay: tournament.tournamentDay,
                    startTime: tournament.startTime,
                    registrationTime: tournament.registrationTime
                });
            });
            clashTimeDbImpl.findTournament.mockResolvedValue(mockReturnedClashTournaments);
            request(application)
                .get('/api/tournaments')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(expectedPayload);
                    done();
                })
        })

        test('As a User, I should be able to call /api/tournaments and when an error occurs then a generic message should be returned.', (done) => {
            clashTimeDbImpl.findTournament.mockRejectedValue(new Error("Failed to query."));
            request(application)
                .get('/api/tournaments')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Failed to retrieve Clash Tournament times.'});
                    done();
                })
        })
    })

    describe('Health Check', () => {
        test('As a User, when I call /api/health I should be returned a simple json payload stating it is healthy.', (done) => {
            request(application)
                .get('/api/health')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({status: 'Healthy'});
                    done();
                })
        })
    })

    describe('Not Found', () => {
        test('As a User, when I call a unmapped url I should have a generic message returned stating that the path was not found.', (done) => {
            request(application)
                .get('/api/dne')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({ error: 'Path not found.' });
                    done();
                })
        })
    })
})