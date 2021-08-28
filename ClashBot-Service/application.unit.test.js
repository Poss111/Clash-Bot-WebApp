const clashTeamsDbImpl = require('./dao/clash-teams-db-impl');
const clashTimeDbImpl = require('./dao/clash-time-db-impl');
const clashSubscriptionDbImpl = require('./dao/clash-subscription-db-impl');
const clashTentativeDbImpl = require('./dao/clash-tentative-db-impl');
const startUpApp = require('./application');
const request = require('supertest');
const {deepCopy} = require("./utility/tests/test-utility.test");

jest.mock('./dao/clash-teams-db-impl');
jest.mock('./dao/clash-time-db-impl');
jest.mock('./dao/clash-subscription-db-impl');
jest.mock('./dao/clash-tentative-db-impl');

describe('Clash Bot Service API Controller', () => {
    let application;
    let server;

    beforeAll(async () => {
        clashTimeDbImpl.initialize.mockResolvedValue(true);
        clashTeamsDbImpl.initialize.mockResolvedValue(true);
        clashSubscriptionDbImpl.initialize.mockResolvedValue(true);
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

    describe('Clash Team Unregister', () => {
        test('As a User, I should be able to call /api/team/register with DELETE to unregister with a specific team.', (done) => {
            let expectedUser = 'Player1';
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            let expectedTournamentName = "awesome_sauce";
            let expectedTournamentDay = "1";
            clashTeamsDbImpl.deregisterPlayer.mockResolvedValue(true);
            request(application)
                .delete('/api/team/register')
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
                    expect(clashTeamsDbImpl.deregisterPlayer).toBeCalledWith(expectedUser, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    }]);
                    expect(res.body).toEqual({message: 'Successfully removed from Team.'});
                    done();
                })
        })

        test('Error - As a User, I should be able to call /api/team/register to unregister with a specific team and if it fails then I will return a 500 error.', (done) => {
            let expectedUser = 'Player1';
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            let expectedTournamentName = "awesome_sauce";
            let expectedTournamentDay = "1";
            clashTeamsDbImpl.deregisterPlayer.mockRejectedValue(new Error('Failed to unregister User.'));
            request(application)
                .delete('/api/team/register')
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
                    expect(clashTeamsDbImpl.deregisterPlayer).toBeCalledWith(expectedUser, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    }]);
                    expect(res.body).toEqual({error: 'Failed to unregister User from Team due.'});
                    done();
                })
        })

        test('Bad Request - Not on Team - As a User if I do not belong to the team, I should be able to call /api/team/register with DELETE to unregister with a specific team and be returned 400 and a generic error message.', (done) => {
            let expectedUser = 'Player1';
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            let expectedTournamentName = "awesome_sauce";
            let expectedTournamentDay = "1";
            clashTeamsDbImpl.deregisterPlayer.mockResolvedValue(false);
            request(application)
                .delete('/api/team/register')
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
                    expect(clashTeamsDbImpl.deregisterPlayer).toBeCalledWith(expectedUser, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    }]);
                    expect(res.body).toEqual({error: 'User not found on requested Team.'});
                    done();
                })
        })

        test('Bad Request - missing user - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            request(application)
                .delete('/api/team/register')
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
                    expect(res.body).toEqual({error: 'Missing User to unregister with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing user id - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server'
            let expectedTeam = 'Team Abra';
            request(application)
                .delete('/api/team/register')
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
                    expect(res.body).toEqual({error: 'Missing User to unregister with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing team name - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server';
            request(application)
                .delete('/api/team/register')
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
                    expect(res.body).toEqual({error: 'Missing Team to unregister from.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing server name - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedTeam = 'Team Abra';
            request(application)
                .delete('/api/team/register')
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
                    expect(res.body).toEqual({error: 'Missing Server to unregister Team with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing tournament name - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server';
            let expectedTeam = 'Team Abra';
            request(application)
                .delete('/api/team/register')
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
                    expect(res.body).toEqual({error: 'Missing Tournament Details to unregister with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })

        test('Bad Request - missing tournament day - As a User, I should be able to call /api/team/register to register with a specific team and be required to pass all required values.', (done) => {
            let expectedServer = 'Integration Server';
            let expectedTeam = 'Team Abra';
            request(application)
                .delete('/api/team/register')
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
                    expect(res.body).toEqual({error: 'Missing Tournament Details to unregister with.'});
                    expect(clashTeamsDbImpl.registerWithSpecificTeam).not.toBeCalled();
                    done();
                })
        })
    })

    describe('Clash Create New Team', () => {
        test('As a User, I should be able to create a new Team through /api/team POST.', (done) => {
            let expectedServer = 'Test Server';
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    id: '12312',
                    username: 'Test User',
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay,
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
            let expectedNewTeam = {
                teamName: 'New Team',
                serverName: expectedServer,
                players: [expectedPayload.username],
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay,
                startTime: 'Aug 12th 2021 7:00 pm PDT'
            }
            clashTeamsDbImpl.registerPlayer.mockResolvedValue(expectedNewTeam);
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(convertTeamDbToTeamPayload(expectedNewTeam));
                    expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledWith(expectedPayload.username, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay,
                        startTime: expectedPayload.startTime
                    }])
                    done();
                })
        })

        test('Error - No available Teams - As a User, I should be able to receive a generic error message if create a new Team through /api/team POST fails to be passed any valid Tournaments.', (done) => {
            let expectedServer = 'Test Server';
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    id: '12312',
                    username: 'Test User',
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay,
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
            let expectedNewTeam = [{
                teamName: 'New Team',
                serverName: expectedServer,
                players: [expectedPayload.username],
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay,
                startTime: 'Aug 12th 2021 7:00 pm PDT',
                exist: true
            }]
            clashTeamsDbImpl.registerPlayer.mockResolvedValue(expectedNewTeam);
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Player is not eligible to create a new Team.'});
                    expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledWith(expectedPayload.username, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay,
                        startTime: expectedPayload.startTime
                    }]);
                    done();
                })
        })

        test('Error - Failed to create Team - As a User, I should be able to receive a generic error message if create a new Team through /api/team POST fails.', (done) => {
            let expectedServer = 'Test Server';
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    id: '12312',
                    username: 'Test User',
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay,
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
            let error = new Error('Failed to create new team.');
            clashTeamsDbImpl.registerPlayer.mockRejectedValue(error);
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Failed to create new Team.'});
                    expect(clashTeamsDbImpl.registerPlayer).toHaveBeenCalledWith(expectedPayload.username, expectedServer, [{
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay,
                        startTime: expectedPayload.startTime
                    }])
                    done();
                })
        })

        test('Bad Request - missing start time - Create New Team I should be returned a 400 Bad Request if the Start Time is missing.', (done) => {
            let expectedServer = 'Test Server';
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    id: '24323123',
                    username: 'Test User',
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                };
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Tournament start time to persist.'});
                    expect(clashTeamsDbImpl.registerPlayer).not.toHaveBeenCalled();
                    done();
                })
        })

        test('Bad Request - missing User id - Create New Team I should be returned a 400 Bad Request if the User Id is missing.', (done) => {
            let expectedServer = 'Test Server';
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    username: 'Test User',
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                };
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing User to persist.'});
                    expect(clashTeamsDbImpl.registerPlayer).not.toHaveBeenCalled();
                    done();
                })
        })

        test('Bad Request - missing Username - Create New Team I should be returned a 400 Bad Request if the Username is missing.', (done) => {
            let expectedServer = 'Test Server';
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    id: '24323123',
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                };
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing User to persist.'});
                    expect(clashTeamsDbImpl.registerPlayer).not.toHaveBeenCalled();
                    done();
                })
        })

        test('Bad Request - missing Server - Create New Team I should be returned a 400 Bad Request if the Server Name is missing.', (done) => {
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    id: '24323123',
                    username: 'Test User',
                    teamName: expectedTeam,
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                };
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Server to persist with.'});
                    expect(clashTeamsDbImpl.registerPlayer).not.toHaveBeenCalled();
                    done();
                })
        })

        test('Bad Request - missing Tournament Name - Create New Team I should be returned a 400 Bad Request if the Tournament Name is missing.', (done) => {
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentDay = '1';
            const expectedPayload =
                {
                    id: '24323123',
                    username: 'Test User',
                    teamName: expectedTeam,
                    serverName: 'Test Server',
                    tournamentDay: expectedTournamentDay
                };
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Tournament Details to persist with.'});
                    expect(clashTeamsDbImpl.registerPlayer).not.toHaveBeenCalled();
                    done();
                })
        })

        test('Bad Request - missing Tournament Day - Create New Team I should be returned a 400 Bad Request if the Tournament Day is missing.', (done) => {
            let expectedTeam = 'Team Awesomenaught';
            let expectedTournamentName = 'awesome_sauce';
            const expectedPayload =
                {
                    id: '24323123',
                    username: 'Test User',
                    teamName: expectedTeam,
                    serverName: 'Test Server',
                    tournamentName: expectedTournamentName
                };
            request(application)
                .post('/api/team')
                .send(expectedPayload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing Tournament Details to persist with.'});
                    expect(clashTeamsDbImpl.registerPlayer).not.toHaveBeenCalled();
                    done();
                })
        })
    })

    describe('GET Tentative - /api/tentative', () => {
        test('When a request with a serverName is made for a tentative list, then a list of tournaments and tentative users should be returned.', (done) => {
            const expectedServerName = 'Goon Squad';
            const mockTentativeList = ['Roidrage'];
            const mockTentativeIds = ['123456'];
            const mockReturnedClashTournaments = createMockListOfTournaments(4);
            createMockTentativeDbReturn(mockReturnedClashTournaments, expectedServerName, mockTentativeIds).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue({'123456': mockTentativeList[0]});
            clashTimeDbImpl.findTournament.mockResolvedValue(deepCopy(mockReturnedClashTournaments));
            request(application)
                .get(`/api/tentative?serverName=${expectedServerName}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                    expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(4);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith(['123456']);
                    expect(res.body).toEqual(createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments, mockTentativeList));
                    done();
                })
        })

        test('When a request with a serverName is made for a tentative list with multiple ids, then a list of tournaments and tentative users should be returned.', (done) => {
            const expectedServerName = 'Goon Squad';
            const mockTentativeList = ['Roidrage', 'TheIncentive'];
            const mockTentativeIds = ['123456', '2'];
            const mockReturnedClashTournaments = createMockListOfTournaments(4);
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(0,1), expectedServerName, mockTentativeIds.slice(1)).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(1,3), expectedServerName, mockTentativeIds).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(3,4), expectedServerName, mockTentativeIds.slice(0,1)).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));

            let expectedApiResponse = [];
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(0,1), mockTentativeList.slice(1)));
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(1,3), mockTentativeList));
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(3,4), mockTentativeList.slice(0,1)));
            clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue({'123456': mockTentativeList[0], '2': mockTentativeList[1]});
            clashTimeDbImpl.findTournament.mockResolvedValue(deepCopy(mockReturnedClashTournaments));
            request(application)
                .get(`/api/tentative?serverName=${expectedServerName}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                    expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(4);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith(mockTentativeIds.reverse());
                    expect(res.body).toEqual(expectedApiResponse);
                    done();
                })
        })

        test('When a request with a serverName is made for a tentative list and there are no tentative players, then a list of tournaments and tentative users should be returned with an empty tentative player list.', (done) => {
            const mockReturnedClashTournaments = createMockListOfTournaments(4);
            const expectedServerName = 'Goon Squad';
            createMockTentativeDbReturn(mockReturnedClashTournaments, expectedServerName, [])
                .forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            clashTimeDbImpl.findTournament.mockResolvedValue(deepCopy(mockReturnedClashTournaments));
            request(application)
                .get(`/api/tentative?serverName=${expectedServerName}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                    expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(4);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).not.toHaveBeenCalled();
                    expect(res.body).toEqual(createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments, []));
                    done();
                })
        })

        test('When a request with a serverName is made for a tentative list and if one of the tentative lists returned undefined, then a list of tournaments and tentative users should be returned and the undefined one should be populateed with an empty tentative list.', (done) => {
            const mockReturnedClashTournaments = createMockListOfTournaments(4);
            const expectedServerName = 'Goon Squad';
            const expectedTentativeList = ['Roidrage'];
            let expectedResponse = createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(0,3), expectedTentativeList);
            expectedResponse.push(
                {
                    serverName: expectedServerName,
                    tournamentDetails: {
                        tournamentName: mockReturnedClashTournaments[3].tournamentName,
                        tournamentDay: mockReturnedClashTournaments[3].tournamentDay
                    },
                    tentativePlayers: []
                }
            );
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(0,3), expectedServerName, ['123456']).forEach((record) => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(record));
            clashTentativeDbImpl.getTentative.mockResolvedValueOnce(undefined);
            clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue({'123456': expectedTentativeList[0]});
            clashTimeDbImpl.findTournament.mockResolvedValue(deepCopy(mockReturnedClashTournaments));
            request(application)
                .get(`/api/tentative?serverName=${expectedServerName}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                    expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(4);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith(['123456']);
                    expect(res.body).toEqual(expectedResponse);
                    done();
                })
        })

        test('ERROR - One tentative call fails - a request with a serverName is made for a tentative list and if one of the tentative lists returned error, then a list of tournaments and tentative users should be returned and the error one should be skipped.', (done) => {
            const mockReturnedClashTournaments = createMockListOfTournaments(4);
            const expectedServerName = 'Goon Squad';
            for (let i = 0; i < mockReturnedClashTournaments.length - 1; i++) {
                let tournament = mockReturnedClashTournaments[i];
                clashTentativeDbImpl.getTentative.mockResolvedValueOnce({
                    tentativePlayers: ['Roidrage'],
                    serverName: expectedServerName,
                    tournamentDetails: tournament
                })
            }
            clashTentativeDbImpl.getTentative.mockRejectedValueOnce(new Error('Failed to find record.'));
            clashTimeDbImpl.findTournament.mockResolvedValue(JSON.parse(JSON.stringify(mockReturnedClashTournaments)));
            request(application)
                .get(`/api/tentative?serverName=${expectedServerName}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                    expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(4);
                    expect(res.body).toEqual({error: 'Failed to pull all Tentative players for current Tournaments.'});
                    done();
                })
        })

        test('Bad Request - Missing Server Name - If the request does not have the server name, return bad request.', (done) => {
            request(application)
                .get(`/api/tentative`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(0);
                    expect(clashTentativeDbImpl.getTentative).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual({error: 'Missing required query parameter.'});
                    done();
                })
        })

    });

    describe('POST Tentative - /api/tentative', () => {
        test('When a User calls to be added or removed to the tentative list with the server name, tournament details and their id, they should successfully be added.', (done) => {
            const expectedResponse = {
                tentativePlayers: ['Roidrage'],
                serverName: 'Goon Squad',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            };
            const payload = {
                id: '2',
                serverName: 'Goon Squad',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            }
            const tentativeDbResponse = {
                tentativePlayers: ['2'],
                serverName: 'Goon Squad',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            }
            clashTentativeDbImpl.handleTentative.mockResolvedValue(tentativeDbResponse);
            clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue(['Roidrage']);
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(1);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledWith(payload.id, payload.serverName, payload.tournamentDetails);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith(['2']);
                    expect(res.body).toEqual(expectedResponse);
                    done();
                })
        })

        test('ERROR - Failed to persist tentative - There was an error updating the tentative record.', (done) => {
            const payload = {
                id: '2',
                serverName: 'Goon Squad',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            }
            clashTentativeDbImpl.handleTentative.mockRejectedValue(new Error('Failed to persist tentative record.'));
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual({error: 'Failed to update Tentative record.'});
                    done();
                })
        })

        test('ERROR - Failed to retrieve User Names - There was an error retrieving the made user names.', (done) => {
            const payload = {
                id: '2',
                serverName: 'Goon Squad',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            }
            const tentativeDbResponse = {
                tentativePlayers: ['2'],
                serverName: 'Goon Squad',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            }
            clashTentativeDbImpl.handleTentative.mockResolvedValue(tentativeDbResponse);
            clashSubscriptionDbImpl.retrievePlayerNames.mockRejectedValue(new Error('Failed to persist tentative record.'));
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(1);
                    expect(res.body).toEqual({error: 'Failed to retrieve mapped usernames.'});
                    done();
                })
        })

        test('Bad request - Missing Id - The user id was not passed.', (done) => {
            const payload = {
                serverName: 'Goon Squad',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            }
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(0);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual({error: 'Missing required request parameter.'});
                    done();
                })
        })

        test('Bad request - Missing Server Name - The user id was not passed.', (done) => {
            const payload = {
                id: '2',
                tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
            }
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(0);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual({error: 'Missing required request parameter.'});
                    done();
                })
        })

        test('Bad request - Missing Tournament Details - The user id was not passed.', (done) => {
            const payload = {
                id: '2',
                serverName: 'Goon Squad',
            }
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(0);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual({error: 'Missing required request parameter.'});
                    done();
                })
        })

        test('Bad request - Missing Tournament Name - The user id was not passed.', (done) => {
            const payload = {
                id: '2',
                serverName: 'Goon Squad',
                tournamentDetails: { tournamentDay: '2'}
            }
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(0);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual({error: 'Missing required request parameter.'});
                    done();
                })
        })

        test('Bad request - Missing Tournament Day - The user id was not passed.', (done) => {
            const payload = {
                id: '2',
                serverName: 'Goon Squad',
                tournamentDetails: { tournamentName: 'awesome_sauce'}
            }
            request(application)
                .post(`/api/tentative`)
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashTentativeDbImpl.handleTentative).toHaveBeenCalledTimes(0);
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual({error: 'Missing required request parameter.'});
                    done();
                })
        })
    })

    describe('GET User', () => {
        test('When I ask to retrieve the User information based on the User Id with a GET on /api/user, and it should respond with a User Details payload.', (done) => {
            const userId = '12321312';
            const mockDbResponse = {
                key: userId,
                serverName: 'Some Server',
                timeAdded: new Date().toISOString(),
                subscribed: 'true',
                preferredChampions: ['Sett']
            };
            const mockResponseValue = {
                id: userId,
                serverName: mockDbResponse.serverName,
                preferredChampions: ['Sett'],
                subscriptions: {'UpcomingClashTournamentDiscordDM': true}
            }
            clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(mockDbResponse);
            request(application)
                .get(`/api/user?id=${userId}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(mockResponseValue);
                    expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(userId);
                    done();
                })
        })

        test('When I ask to retrieve a User that is not available, it should respond with an empty payload.', (done) => {
            const userId = '12321312';
            const mockDbResponse = {};
            const mockResponseValue = {subscriptions: {'UpcomingClashTournamentDiscordDM': false}}
            clashSubscriptionDbImpl.retrieveUserDetails.mockResolvedValue(mockDbResponse);
            request(application)
                .get(`/api/user?id=${userId}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(mockResponseValue);
                    expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(userId);
                    done();
                })
        })

        test('Error - Failed to retrieve User - If the database fails to retrieve the User then it should respond with an generic error.', (done) => {
            const userId = '12321312';
            clashSubscriptionDbImpl.retrieveUserDetails.mockRejectedValue(new Error('Failed to retrieve.'));
            request(application)
                .get(`/api/user?id=${userId}`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err) => {
                    if (err) return done(err);
                    expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledTimes(1);
                    expect(clashSubscriptionDbImpl.retrieveUserDetails).toHaveBeenCalledWith(userId);
                    done();
                })
        })
    })

    describe('POST User - /api/user', () => {
        test('As a User, when I request to create my data, I can do it through post.', (done) => {
            let payload = {
                id: '1234556778',
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {'UpcomingClashTournamentDiscordDM': true}
            };
            const mockDbResponse = {
                key: payload.id,
                serverName: 'Some Server',
                timeAdded: new Date().toISOString(),
                subscribed: true,
                preferredChampions: ['Sett']
            };
            const mockResponseValue = {
                id: payload.id,
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {'UpcomingClashTournamentDiscordDM': true}
            };
            clashSubscriptionDbImpl.createUpdateUserDetails.mockResolvedValue(mockDbResponse);
            request(application)
                .post('/api/user')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(mockResponseValue);
                    expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledWith(payload.id, payload.serverName, payload.preferredChampions, payload.subscriptions.UpcomingClashTournamentDiscordDM)
                    done();
                })
        })

        test('As a User, if the subscriptions is empty then UpcomingClashTournamentDiscordDM should be defaulted to false, I can do it through post.', (done) => {
            let payload = {
                id: '1234556778',
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {}
            };
            const mockDbResponse = {
                key: payload.id,
                serverName: 'Some Server',
                timeAdded: new Date().toISOString(),
                preferredChampions: ['Sett']
            };
            const mockResponseValue = {
                id: payload.id,
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {'UpcomingClashTournamentDiscordDM': false}
            };
            clashSubscriptionDbImpl.createUpdateUserDetails.mockResolvedValue(mockDbResponse);
            request(application)
                .post('/api/user')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual(mockResponseValue);
                    expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledWith(payload.id, payload.serverName, payload.preferredChampions, payload.subscriptions.UpcomingClashTournamentDiscordDM)
                    done();
                })
        })

        test('Bad Request - missing id - As a User, when I request to create my data, I want to recieve an error related to the Id passed if it is missing.', (done) => {
            let payload = {
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {'UpcomingClashTournamentDiscordDM': 'true'}
            };
            request(application)
                .post('/api/user')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing required User Id'});
                    done();
                })
        })

        test('Bad Request - missing Server Name - As a User, when I request to create my data, I want to receive an error related to the Server Name passed if it is missing.', (done) => {
            let payload = {
                id: '12312312',
                preferredChampions: ['Sett'],
                subscriptions: {'UpcomingClashTournamentDiscordDM': 'true'}
            };
            request(application)
                .post('/api/user')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing required Server Name'});
                    done();
                })
        })

        test('Bad Request - missing preferredChampions - As a User, when I request to create my data, I want to receive an error related to the preferredChampions passed if it is missing.', (done) => {
            let payload = {
                id: '12312312',
                serverName: 'Good Squad',
                subscriptions: {'UpcomingClashTournamentDiscordDM': 'true'}
            };
            request(application)
                .post('/api/user')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing required Preferred Champions'});
                    done();
                })
        })

        test('Bad Request - missing subscriptions - As a User, when I request to create my data, I want to receive an error related to the subscriptions passed if it is missing.', (done) => {
            let payload = {
                id: '12312312',
                serverName: 'Good Squad',
                preferredChampions: []
            };
            request(application)
                .post('/api/user')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing required Subscriptions'});
                    done();
                })
        })

        test('Bad request - Missing User Id - If the request does not have the expected query parameter, return bad request.', (done) => {
            request(application)
                .get(`/api/user`)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing required query parameter.'});
                    expect(clashSubscriptionDbImpl.retrieveUserDetails).not.toHaveBeenCalled();
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

function createMockListOfTournaments(numberOfTournaments) {
    let tournaments = [];
    let mockTournamentName = 'awesome_sauce';
    numberOfTournaments === undefined ? numberOfTournaments = 1 : numberOfTournaments;
    for (let i = 1; i <= numberOfTournaments; i++) {
        tournaments.push(
            {
                startTime: new Date().toISOString(),
                tournamentDay: `${i}`,
                key: `${mockTournamentName}#${i}`,
                tournamentName: mockTournamentName,
                registrationTime: new Date().toISOString()
            })
    }
    return tournaments;
}

function createMockApiTentativeResponses(serverName, tournaments, tentativeList) {
    let mockTentativeResponses = [];
    tournaments.forEach(tournament => {
        mockTentativeResponses.push({
            serverName: serverName,
            tournamentDetails: {
                tournamentName: tournament.tournamentName,
                tournamentDay: tournament.tournamentDay
            },
            tentativePlayers: tentativeList
        })
    })
    return mockTentativeResponses;
}

function createMockTentativeDbReturn(tournaments, serverName, tentativeIds) {
    let mockTentativeDbResponses = [];
    tournaments.forEach(tournament => {
        mockTentativeDbResponses.push({
            tentativePlayers: tentativeIds,
            serverName: serverName,
            tournamentDetails: {tournamentName: tournament.tournamentName, tournamentDay: tournament.tournamentDay}
        });
    })
    return mockTentativeDbResponses;
}

function convertTeamDbToTeamPayload(expectedNewTeam) {
    return {
        teamName: expectedNewTeam.teamName,
        tournamentDetails: {
            tournamentName: expectedNewTeam.tournamentName,
            tournamentDay: expectedNewTeam.tournamentDay
        },
        serverName: expectedNewTeam.serverName,
        startTime: expectedNewTeam.startTime,
        playersDetails: Array.isArray(expectedNewTeam.players) ? expectedNewTeam.players.map(data => {
            return {name: data}
        }) : {}
    };
}

