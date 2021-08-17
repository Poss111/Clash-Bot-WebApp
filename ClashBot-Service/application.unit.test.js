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

    beforeEach(() => {
        jest.resetAllMocks();
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

    describe('Clash Team Registration', () => {
        test('As a User, I should be able to call /api/team/register to register with a specific team.', (done) => {
            let expectedUser = 'Player1';
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            let expectedTournamentName = "awesome_sauce";
            let expectedTournamentDay = "1";
            const mockReturnedTeam =
                {
                    tournamentDetails: {
                        tournamentDay: expectedTournamentDay,
                        tournamentName: expectedTournamentName,
                    },
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    playersDetails: [
                        {name: expectedUser},
                        {name: 'Player2'}
                    ]
                };
            const sampleRegisterReturn = {
                teamName: expectedTeam,
                serverName: expectedServer,
                players: [expectedUser, 'Player2'],
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay
            };
            clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(sampleRegisterReturn);
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12345',
                        username: expectedUser,
                        teamName: expectedTeam,
                        serverName: expectedServer,
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(mockReturnedTeam);
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).toBeCalledWith(expectedUser, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    }], 'Abra');
                    done();
                })
        })

        test('Error - As a User, I should be able to call /api/team/register to register with a specific team and if it fails then I will return a 500 error.', (done) => {
            let expectedUser = 'Player1';
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            let expectedTournamentName = "awesome_sauce";
            let expectedTournamentDay = "1";
            clashTeamsDbImpl.registerWithSpecificTeam.mockRejectedValue(new Error('Failed to persist User.'));
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12345',
                        username: expectedUser,
                        teamName: expectedTeam,
                        serverName: expectedServer,
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Failed to persist User to Team.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).toBeCalledWith(expectedUser, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    }], 'Abra');
                    done();
                })
        })

        test('Bad Request - cannot find Team - As a User, I should be able to call /api/team/register to register with a specific team and if the team request cannot be found then I will return a 500 error.', (done) => {
            let expectedUser = 'Player1';
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            let expectedTournamentName = "awesome_sauce";
            let expectedTournamentDay = "1";
            clashTeamsDbImpl.registerWithSpecificTeam.mockResolvedValue(undefined);
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12345',
                        username: expectedUser,
                        teamName: expectedTeam,
                        serverName: expectedServer,
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Unable to find the Team requested to be persisted.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).toBeCalledWith(expectedUser, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    }], 'Abra');
                    done();
                })
        })

        test('Bad Request - missing user - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12345',
                        teamName: expectedTeam,
                        serverName: expectedServer,
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing User to persist.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing user id - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        username: 'Test User',
                        teamName: expectedTeam,
                        serverName: expectedServer,
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing User to persist.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing team name - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server';
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12312',
                        username: 'Test User',
                        serverName: expectedServer,
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Team to persist with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing server name - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedTeam = 'Team Abra';
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12312',
                        username: 'Test User',
                        teamName: expectedTeam,
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Server to persist with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing tournament name - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server';
            let expectedTeam = 'Team Abra';
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12312',
                        username: 'Test User',
                        serverName: expectedServer,
                        teamName: expectedTeam,
                        tournamentDay: '1'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Tournament Details to persist with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing tournament day - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server';
            let expectedTeam = 'Team Abra';
            request(application)
                .post('/api/team/register')
                .send(
                    {
                        id: '12312',
                        username: 'Test User',
                        serverName: expectedServer,
                        teamName: expectedTeam,
                        tournamentName: 'awesome_sauce'
                    }
                )
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Tournament Details to persist with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
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
                    expect(res.body).toEqual({error: 'Path not found.'});
                    done();
                })
        })
    })
})
