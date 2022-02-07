const clashTeamsDbImpl = require('./dao/clash-teams-db-impl');
const clashTimeDbImpl = require('./dao/clash-time-db-impl');
const clashSubscriptionDbImpl = require('./dao/clash-subscription-db-impl');
const clashTentativeDbImpl = require('./dao/clash-tentative-db-impl');
const clashTeamsServiceImpl = require('./service/clash-teams-service-impl');
const clashTentativeServiceImpl = require('./service/clash-tentative-service-impl');
const clashUserServiceImpl = require('./service/clash-user-service-impl');
const { sendTeamUpdateThroughWs } = require('./websocket-service-impl');

const {startUpApp, convertTeamDbToTeamPayload, convertTeamDbToTeamPayloadV2} = require('./application');
const request = require('supertest');
const {deepCopy} = require("./utility/tests/test-utility.utility.test");

jest.mock('./dao/clash-teams-db-impl');
jest.mock('./dao/clash-time-db-impl');
jest.mock('./dao/clash-subscription-db-impl');
jest.mock('./dao/clash-tentative-db-impl');
jest.mock('./service/clash-teams-service-impl');
jest.mock('./service/clash-tentative-service-impl');
jest.mock('./service/clash-user-service-impl');
jest.mock('./websocket-service-impl');

describe('Clash Bot Service API Controller', () => {
    let application;
    let server;
    let expressWs;

    beforeAll(async () => {
        clashTimeDbImpl.initialize.mockResolvedValue(true);
        clashTeamsDbImpl.initialize.mockResolvedValue(true);
        clashSubscriptionDbImpl.initialize.mockResolvedValue(true);
        application = await startUpApp();
        expressWs = require('express-ws')(application);
        server = await application.listen();
    })

    afterAll(() => {
        server.close();
    })

    beforeEach(() => {
        jest.resetAllMocks();
    })

    describe('GET Teams', () => {
        describe('GET Teams', () => {
            test('As a User, I should be able to call /api/teams with no filter and be able to return all available teams.', (done) => {
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
                const expectedUsername = 'SilverShard';
                const expectedServername = 'Goon Squad';
                const mockReturnedTeams = [
                    {
                        teamName: "Team Abra",
                        serverName: expectedServername,
                        playersDetails: [
                            {name: expectedUsername},
                            {name: '1234321'}
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    },
                    {
                        teamName: "Team Absol",
                        serverName: expectedServername,
                        playersDetails: [
                            {name: expectedUsername}
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    }
                ];

                clashTimeDbImpl.findTournament.mockResolvedValue(mockReturnedClashTournaments);
                clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments.mockResolvedValue(mockReturnedTeams);
                request(application)
                    .get('/api/teams')
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments).toHaveBeenCalledWith(undefined, mockReturnedClashTournaments);
                        expect(res.body).toEqual(mockReturnedTeams);
                        done();
                    })
            })
            test('As a User, I should be able to call /api/teams with a server name filter and be able to return all available teams for the server.', (done) => {
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
                const expectedUsername = 'SilverShard';
                const expectedServername = 'Goon Squad';
                const mockReturnedTeams = [
                    {
                        teamName: "Team Abra",
                        serverName: expectedServername,
                        playersDetails: [
                            {name: expectedUsername},
                            {name: '1234321'}
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    },
                    {
                        teamName: "Team Absol",
                        serverName: expectedServername,
                        playersDetails: [
                            {name: expectedUsername}
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    }
                ];

                clashTimeDbImpl.findTournament.mockResolvedValue(mockReturnedClashTournaments);
                clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments.mockResolvedValue(mockReturnedTeams);
                request(application)
                    .get(`/api/teams/${expectedServername}`)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments).toHaveBeenCalledWith(expectedServername, mockReturnedClashTournaments);
                        expect(res.body).toEqual(mockReturnedTeams);
                        done();
                    })
            })

            test('As a User, I should be able to call /api/teams with no filter and if an error occurs retrieving the active tournaments, then I should see a generic response.', (done) => {
                clashTimeDbImpl.findTournament.mockRejectedValue(new Error('Querying failed.'));
                request(application)
                    .get('/api/teams')
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(res.body).toEqual({error: 'Failed to retrieve active Tournaments.'});
                        done();
                    })
            })

            test('As a User, I should be able to call /api/teams with no filter and if an error occurs retrieving the active teams, then I should see a generic response.', (done) => {
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
                const expectedServername = 'Goon Squad';

                clashTimeDbImpl.findTournament.mockResolvedValue(mockReturnedClashTournaments);
                clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments.mockRejectedValue(new Error('Failed to query for Teams'));
                request(application)
                    .get(`/api/teams/${expectedServername}`)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournaments).toHaveBeenCalledWith(expectedServername, mockReturnedClashTournaments);
                        expect(res.body).toEqual({error: 'Failed to retrieve Teams.'});
                        done();
                    })
            })
        })

        describe('GET Teams - v2', () => {
            test('As a User, I should be able to call /api/v2/teams with no filter and be ' +
                'able to return all available teams. - v2', (done) => {
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
                const expectedUsername = 'SilverShard';
                const expectedServername = 'Goon Squad';
                const mockReturnedTeams = [
                    {
                        teamName: "Team Abra",
                        serverName: expectedServername,
                        playersDetails: [
                            {
                                name: expectedUsername,
                                role: 'Top'
                            },
                            {
                                name: '1234321',
                                role: 'Bot'
                            }
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    },
                    {
                        teamName: "Team Absol",
                        serverName: expectedServername,
                        playersDetails: [
                            {
                                name: expectedUsername,
                                role: 'Mid'
                            }
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    }
                ];

                clashTimeDbImpl.findTournament.mockResolvedValue(mockReturnedClashTournaments);
                clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2
                    .mockResolvedValue(mockReturnedTeams);
                request(application)
                    .get('/api/v2/teams')
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2)
                            .toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2)
                            .toHaveBeenCalledWith(undefined, mockReturnedClashTournaments);
                        expect(res.body).toEqual(mockReturnedTeams);
                        done();
                    })
            })

            test('As a User, I should be able to call /api/v2/teams with a server name ' +
                'filter and be able to return all available teams for the server. - v2', (done) => {
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
                const expectedUsername = 'SilverShard';
                const expectedServername = 'Goon Squad';
                const mockReturnedTeams = [
                    {
                        teamName: "Team Abra",
                        serverName: expectedServername,
                        playersDetails: [
                            {
                                name: expectedUsername,
                                role: 'Top'
                            },
                            {
                                name: '1234321',
                                role: 'Mid'
                            }
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    },
                    {
                        teamName: "Team Absol",
                        serverName: expectedServername,
                        playersDetails: [
                            {
                                name: expectedUsername,
                                role: 'Bot'
                            }
                        ],
                        tournamentDetails: {
                            tournamentName: "Awesome Sauce",
                            tournamentDay: '1',
                        },
                        startTime: "Jan 21 2021",
                    }
                ];

                clashTimeDbImpl.findTournament.mockResolvedValue(mockReturnedClashTournaments);
                clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2.mockResolvedValue(mockReturnedTeams);
                request(application)
                    .get(`/api/v2/teams/${expectedServername}`)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2)
                            .toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2)
                            .toHaveBeenCalledWith(expectedServername, mockReturnedClashTournaments);
                        expect(res.body).toEqual(mockReturnedTeams);
                        done();
                    })
            })

            test('As a User, I should be able to call /api/v2/teams with no filter and ' +
                'if an error occurs retrieving the active tournaments, ' +
                'then I should see a generic response. - v2', (done) => {
                clashTimeDbImpl.findTournament.mockRejectedValue(new Error('Querying failed.'));
                request(application)
                    .get('/api/v2/teams')
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(res.body).toEqual({error: 'Failed to retrieve active Tournaments.'});
                        done();
                    })
            })

            test('As a User, I should be able to call /api/v2/teams with no filter and ' +
                'if an error occurs retrieving the active teams, then I should see a generic response. - v2', (done) => {
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
                const expectedServername = 'Goon Squad';

                clashTimeDbImpl.findTournament.mockResolvedValue(mockReturnedClashTournaments);
                clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2.mockRejectedValue(
                    new Error('Failed to query for Teams'));
                request(application)
                    .get(`/api/v2/teams/${expectedServername}`)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledTimes(1);
                        expect(clashTimeDbImpl.findTournament).toHaveBeenCalledWith();
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2)
                            .toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.retrieveTeamsByServerAndTournamentsV2)
                            .toHaveBeenCalledWith(expectedServername, mockReturnedClashTournaments);
                        expect(res.body).toEqual({error: 'Failed to retrieve Teams.'});
                        done();
                    })
            })
        })
    })

    describe('GET Clash Tournaments', () => {
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

    describe('POST Clash Team Registration', () => {
        describe('POST Clash Team Registration', () => {
            test('As a User, I should be able to call /api/team/register to register with a specific team.', (done) => {
                let expectedUserId = '123456';
                let expectedUsername = 'Roidrage';
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
                            {name: expectedUsername},
                            {name: '1234321'}
                        ]
                    };
                clashTeamsServiceImpl.registerWithTeam.mockResolvedValue(mockReturnedTeam);
                request(application)
                    .post('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.registerWithTeam).toBeCalledWith(expectedUserId, 'Abra', expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual(mockReturnedTeam);
                        done();
                    })
            })

            test('As a User, I should be able to call /api/team/register to register with a specific team without passing the Team portion of the teamname.', (done) => {
                let expectedUserId = '123456';
                let expectedUsername = 'Roidrage';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Abra';
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
                            {name: expectedUsername},
                            {name: '1234321'}
                        ]
                    };
                clashTeamsServiceImpl.registerWithTeam.mockResolvedValue(mockReturnedTeam);
                request(application)
                    .post('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.registerWithTeam).toBeCalledWith(expectedUserId, 'Abra', expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual(mockReturnedTeam);
                        done();
                    })
            })

            test('Error - As a User, I should be able to call /api/team/register to register with a specific team and if it fails then I will return a 500 error.', (done) => {
                let expectedUserId = '12345';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.registerWithTeam.mockRejectedValue(new Error('Failed to persist User.'));
                request(application)
                    .post('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.registerWithTeam).toBeCalledWith(expectedUserId, 'Abra', expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({error: 'Failed to persist User to Team.'});
                        done();
                    })
            })

            test('Bad Request - cannot find Team - As a User, I should be able to call /api/team/register to register with a specific team and if the team request cannot be found then I will return a 500 error.', (done) => {
                let expectedUserId = '12345';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.registerWithTeam.mockResolvedValue({error: 'Unable to find the Team requested to be persisted.'});
                request(application)
                    .post('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.registerWithTeam).toBeCalledWith(expectedUserId, 'Abra', expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({error: 'Unable to find the Team requested to be persisted.'});
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

        describe('POST Clash Team Registration - v2', () => {
            test('As a User, I should be able to call /api/v2/team/register ' +
                'to register with a specific team. - v2', (done) => {

                let expectedUserId = '123456';
                let expectedRole = 'Top';
                let expectedUsername = 'Roidrage';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                const mockReturnedTeam =
                    {
                        registeredTeam: {
                            tournamentDetails: {
                                tournamentDay: expectedTournamentDay,
                                tournamentName: expectedTournamentName,
                            },
                            serverName: expectedServer,
                            teamName: expectedTeam,
                            playersDetails: [
                                {
                                    name: expectedUsername,
                                    role: expectedRole
                                },
                                {
                                    name: '1234321',
                                    role: 'Mid'
                                }
                            ]
                        },
                        unregisteredTeams: []
                    };
                clashTeamsServiceImpl.registerWithTeamV2.mockResolvedValue(mockReturnedTeam);
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            id: expectedUserId,
                            role: expectedRole,
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
                        expect(clashTeamsServiceImpl.registerWithTeamV2)
                            .toBeCalledWith(expectedUserId, expectedRole,
                                'Abra', expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledTimes(1);
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledWith([mockReturnedTeam.registeredTeam], expect.anything());
                        expect(res.body).toEqual(mockReturnedTeam);
                        done();
                    })
            })

            test('As a User, I should be able to call /api/v2/team/register ' +
                'to register with a specific team and send any unregistered or registered teams' +
                'through the websocket. - v2', (done) => {

                let expectedUserId = '123456';
                let expectedRole = 'Top';
                let expectedUsername = 'Roidrage';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                const mockReturnedTeam =
                    {
                        registeredTeam: {
                            tournamentDetails: {
                                tournamentDay: expectedTournamentDay,
                                tournamentName: expectedTournamentName,
                            },
                            serverName: expectedServer,
                            teamName: expectedTeam,
                            playersDetails: [
                                {
                                    name: expectedUsername,
                                    role: expectedRole
                                },
                                {
                                    name: '1234321',
                                    role: 'Mid'
                                }
                            ]
                        },
                        unregisteredTeams: [
                            {
                                tournamentDetails: {
                                    tournamentDay: expectedTournamentDay,
                                    tournamentName: expectedTournamentName,
                                },
                                serverName: expectedServer,
                                teamName: 'Team One',
                                playersDetails: [
                                    {
                                        name: '1234321',
                                        role: 'Mid'
                                    }
                                ]
                            },
                            {
                                tournamentDetails: {
                                    tournamentDay: expectedTournamentDay,
                                    tournamentName: expectedTournamentName,
                                },
                                serverName: expectedServer,
                                teamName: 'Team Two',
                                playersDetails: [
                                    {
                                        name: '1234321',
                                        role: 'Mid'
                                    }
                                ]
                            }
                        ]
                    };
                clashTeamsServiceImpl.registerWithTeamV2.mockResolvedValue(mockReturnedTeam);
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            id: expectedUserId,
                            role: expectedRole,
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
                        expect(clashTeamsServiceImpl.registerWithTeamV2)
                            .toBeCalledWith(expectedUserId, expectedRole,
                                'Abra', expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledTimes(1);
                        expect(sendTeamUpdateThroughWs)
                            .toHaveBeenCalledWith([...mockReturnedTeam.unregisteredTeams,
                                mockReturnedTeam.registeredTeam], expect.anything());
                        expect(res.body).toEqual(mockReturnedTeam);
                        done();
                    })
            })

            test('As a User, I should be able to call /api/v2/team/register ' +
                'to register with a specific team without passing the Team ' +
                'portion of the teamname. - v2', (done) => {
                let expectedUserId = '123456';
                let expectedUsername = 'Roidrage';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                const mockReturnedTeam = {
                    registeredTeam:
                    {
                        tournamentDetails: {
                            tournamentDay: expectedTournamentDay,
                            tournamentName: expectedTournamentName,
                        },
                        serverName: expectedServer,
                        teamName: expectedTeam,
                        playersDetails: [
                            {name: expectedUsername},
                            {name: '1234321'}
                        ]
                    },
                    unregisteredTeams: []
                };
                clashTeamsServiceImpl.registerWithTeam.mockResolvedValue(mockReturnedTeam);
                request(application)
                    .post('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.registerWithTeam).toBeCalledWith(expectedUserId, 'Abra', expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual(mockReturnedTeam);
                        done();
                    })
            })

            test('Error - As a User, I should be able to call /api/v2/team/register ' +
                'to register with a specific team and if it fails then I will return a 500 error. - v2', (done) => {
                let expectedUserId = '12345';
                let expectedRole = 'Top';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.registerWithTeamV2.mockRejectedValue(new Error('Failed to persist User.'));
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            id: expectedUserId,
                            role: expectedRole,
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
                        expect(clashTeamsServiceImpl.registerWithTeamV2)
                            .toBeCalledWith(expectedUserId, expectedRole, 'Abra', expectedServer,
                                expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({error: 'Failed to persist User to Team.'});
                        done();
                    })
            })

            test('Bad Request - cannot find Team - As a User, I should be able to ' +
                'call /api/v2/team/register to register with a specific team and if ' +
                'the team request cannot be found then I will return a 500 error. - v2', (done) => {
                const expectedUserId = '12345';
                const expectedRole = 'Top';
                const expectedServer = 'Integration Server'
                const expectedTeam = 'Team Abra';
                const expectedTournamentName = "awesome_sauce";
                const expectedTournamentDay = "1";
                clashTeamsServiceImpl.registerWithTeamV2
                    .mockResolvedValue({error: 'Unable to find the Team requested to be persisted.'});
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            id: expectedUserId,
                            role: expectedRole,
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
                        expect(clashTeamsServiceImpl.registerWithTeamV2)
                            .toBeCalledWith(expectedUserId, expectedRole, 'Abra',
                                expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body)
                            .toEqual({error: 'Unable to find the Team requested to be persisted.'});
                        done();
                    })
            })

            test('Bad Request - missing user id - As a User, I should be able to call /api/v2/team/register ' +
                'to register with a specific team and be required to pass all required values. - v2', (done) => {
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedRole = 'Top';
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            role: expectedRole,
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
                        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing team name - As a User, I should be able to ' +
                'call /api/v2/team/register to register with a specific team and be required ' +
                'to pass all required values. - v2', (done) => {
                let expectedServer = 'Integration Server';
                let expectedRole = 'Top';
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            id: '12312',
                            role: expectedRole,
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
                        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing server name - As a User, I should be able ' +
                'to call /api/v2/team/register to register with a specific team and be ' +
                'required to pass all required values. - v2', (done) => {
                let expectedTeam = 'Team Abra';
                let expectedRole = 'Top';
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            id: '12312',
                            role: expectedRole,
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
                        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing tournament name - As a User, I should be able to call ' +
                '/api/v2/team/register to register with a specific team and be required to ' +
                'pass all required values. - v2', (done) => {
                let expectedServer = 'Integration Server';
                let expectedTeam = 'Team Abra';
                let expectedRole = 'Top';
                request(application)
                    .post('/api/team/register')
                    .send(
                        {
                            id: '12312',
                            role: expectedRole,
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
                        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing tournament day - As a User, I should be able to ' +
                'call /api/v2/team/register to register with a specific team and be required ' +
                'to pass all required values. - v2', (done) => {
                let expectedServer = 'Integration Server';
                let expectedTeam = 'Team Abra';
                let expectedRole = 'Top';
                request(application)
                    .post('/api/team/register')
                    .send(
                        {
                            id: '12312',
                            role: expectedRole,
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
                        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing role - As a User, I should be able to ' +
                'call /api/v2/team/register to register with a specific team and be required ' +
                'to pass all required values. - v2', (done) => {
                let expectedServer = 'Integration Server';
                let expectedTeam = 'Team Abra';
                request(application)
                    .post('/api/v2/team/register')
                    .send(
                        {
                            id: '12312',
                            username: 'Test User',
                            serverName: expectedServer,
                            teamName: expectedTeam,
                            tournamentName: 'awesome_sauce',
                            tournamentDay: '1'
                        }
                    )
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Missing Role to persist with.'});
                        expect(clashTeamsDbImpl.registerWithSpecificTeamV2).not.toBeCalled();
                        done();
                    })
            })
        })
    })

    describe('DELETE Clash Team Unregister', () => {

        describe('DELETE Clash Team Unregister', () => {
            test('As a User, I should be able to call /api/team/register with DELETE to unregister with a specific team.', (done) => {
                let expectedUserId = '11234213';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedUsername = 'Roidrage';
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.unregisterFromTeam.mockResolvedValue({
                    tournamentDetails: {
                        tournamentDay: expectedTournamentDay,
                        tournamentName: expectedTournamentName,
                    },
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    playersDetails: [{name: expectedUsername}]
                });
                request(application)
                    .delete('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.unregisterFromTeam).toBeCalledWith(expectedUserId, expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({message: 'Successfully removed from Team.'});
                        done();
                    })
            })

            test('Error - As a User, I should be able to call /api/team/register to unregister with a specific team and if it fails then I will return a 500 error.', (done) => {
                let expectedUserId = '123456';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.unregisterFromTeam.mockRejectedValue(new Error('Failed to unregister User.'));
                request(application)
                    .delete('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.unregisterFromTeam).toBeCalledWith(expectedUserId, expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({error: 'Failed to unregister User from Team due.'});
                        done();
                    })
            })

            test('Bad Request - Not on Team - As a User if I do not belong to the team, I should be able to call /api/team/register with DELETE to unregister with a specific team and be returned 400 and a generic error message.', (done) => {
                let expectedUserId = '123321123';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.unregisterFromTeam.mockResolvedValue({error: 'User not found on requested Team.'});
                request(application)
                    .delete('/api/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.unregisterFromTeam).toBeCalledWith(expectedUserId, expectedServer, expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({error: 'User not found on requested Team.'});
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

        describe('DELETE Clash Team Unregister - v2', () => {
            test('As a User, I should be able to call /api/v2/team/register with DELETE to ' +
                'unregister with a specific team.', (done) => {
                let expectedUserId = '11234213';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedUsername = 'Roidrage';
                let expectedTournamentDay = "1";
                let responseUnregistered = {
                    registeredTeam: {},
                    unregisteredTeams: [{
                        tournamentDetails: {
                            tournamentDay: expectedTournamentDay,
                            tournamentName: expectedTournamentName,
                        },
                        serverName: expectedServer,
                        teamName: expectedTeam,
                        playersDetails: [{name: expectedUsername}]
                    }]
                };
                let dbResponseUnregistered = [{
                    tournamentDetails: {
                        tournamentDay: expectedTournamentDay,
                        tournamentName: expectedTournamentName,
                    },
                    serverName: expectedServer,
                    teamName: expectedTeam,
                    playersDetails: [{name: expectedUsername}]
                }];
                clashTeamsServiceImpl.unregisterFromTeamV2.mockResolvedValue(dbResponseUnregistered);
                request(application)
                    .delete('/api/v2/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledTimes(1);
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledWith(dbResponseUnregistered, expect.anything());
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2)
                            .toBeCalledWith(expectedUserId, expectedServer,
                                expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual(responseUnregistered);
                        done();
                    })
            })

            test('Error - As a User, I should be able to call /api/v2/team/register ' +
                'to unregister with a specific team and if it fails then I will ' +
                'return a 500 error.', (done) => {
                let expectedUserId = '123456';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.unregisterFromTeamV2
                    .mockRejectedValue(new Error('Failed to unregister User.'));
                request(application)
                    .delete('/api/v2/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2)
                            .toBeCalledWith(expectedUserId, expectedServer,
                                expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({error: 'Failed to unregister User from Team due.'});
                        done();
                    })
            })

            test('Bad Request - Not on Team - As a User if I do not belong to the ' +
                'team, I should be able to call /api/v2/team/register with ' +
                'DELETE to unregister with a specific team and be returned 400 and ' +
                'a generic error message.', (done) => {
                let expectedUserId = '123321123';
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                let expectedTournamentName = "awesome_sauce";
                let expectedTournamentDay = "1";
                clashTeamsServiceImpl.unregisterFromTeamV2
                    .mockResolvedValue({error: 'User not found on requested Team.'});
                request(application)
                    .delete('/api/v2/team/register')
                    .send(
                        {
                            id: expectedUserId,
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
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2)
                            .toBeCalledWith(expectedUserId, expectedServer,
                                expectedTournamentName, expectedTournamentDay);
                        expect(res.body).toEqual({error: 'User not found on requested Team.'});
                        done();
                    })
            })

            test('Bad Request - missing user id - As a User, I should be able to call ' +
                '/api/v2/team/register to register with a specific team and be required ' +
                'to pass all required values.', (done) => {
                let expectedServer = 'Integration Server'
                let expectedTeam = 'Team Abra';
                request(application)
                    .delete('/api/v2/team/register')
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
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing server name - As a User, I should be able to call ' +
                '/api/v2/team/register to register with a specific team and be required ' +
                'to pass all required values.', (done) => {
                let expectedTeam = 'Team Abra';
                request(application)
                    .delete('/api/v2/team/register')
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
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing tournament name - As a User, I should be able to call ' +
                '/api/team/register to register with a specific team and be required to pass ' +
                'all required values.', (done) => {
                let expectedServer = 'Integration Server';
                let expectedTeam = 'Team Abra';
                request(application)
                    .delete('/api/v2/team/register')
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
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2).not.toBeCalled();
                        done();
                    })
            })

            test('Bad Request - missing tournament day - As a User, I should be able to call ' +
                '/api/v2/team/register to register with a specific team and be required to ' +
                'pass all required values.', (done) => {
                let expectedServer = 'Integration Server';
                let expectedTeam = 'Team Abra';
                request(application)
                    .delete('/api/v2/team/register')
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
                        expect(clashTeamsServiceImpl.unregisterFromTeamV2).not.toBeCalled();
                        done();
                    })
            })
        })
    })

    describe('POST Clash Create New Team', () => {
        describe('POST Clash Create New Team', () => {
            test('As a User, I should be able to create a new Team through /api/team POST.', (done) => {
                const payload = {
                    id: '123',
                    serverName: 'Test Server',
                    teamName: 'Team Awesomenaught',
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1',
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let expectedNewTeam = {
                    teamName: 'New Team',
                    serverName: payload.serverName,
                    players: ['Roidrage'],
                    tournamentName: payload.tournamentName,
                    tournamentDay: payload.tournamentDay,
                    startTime: payload.startTime
                };
                clashTeamsServiceImpl.createNewTeam.mockResolvedValue(expectedNewTeam);
                request(application)
                    .post('/api/team')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual(expectedNewTeam);
                        expect(clashTeamsServiceImpl.createNewTeam).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.createNewTeam).toHaveBeenCalledWith(payload.id, payload.serverName, payload.tournamentName, payload.tournamentDay, payload.startTime);
                        done();
                    })
            })

            test('Convert Team Db to Team Payload, if a map with not matching ids are passed, it should default to the id.', () => {
                let expectedServer = 'Test Server';
                let expectedUserId = '123';
                let expectedUsername = 'Roidrage';
                let expectedTeam = 'Team Awesomenaught';
                let expectedTournamentName = 'awesome_sauce';
                let expectedTournamentDay = '1';
                let expectedNewTeam = {
                    teamName: expectedTeam,
                    serverName: expectedServer,
                    players: [expectedUserId],
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay,
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let idToNameObject = {};

                idToNameObject[expectedUserId] = expectedUsername;
                let convertTeamDbToTeamPayload1 = convertTeamDbToTeamPayload(expectedNewTeam, idToNameObject);
                expect(convertTeamDbToTeamPayload1.playersDetails).toEqual([{name: expectedUsername}]);
            })

            test('No available Teams - As a User, I should be able to receive a generic error message if create a new Team through /api/team POST fails to be passed any valid Tournaments.', (done) => {
                const payload = {
                    id: '123',
                    serverName: 'Test Server',
                    teamName: 'Team Awesomenaught',
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1',
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let expectedNewTeam = {error: 'Player is not eligible to create a new Team.'};
                clashTeamsServiceImpl.createNewTeam.mockResolvedValue(expectedNewTeam);
                request(application)
                    .post('/api/team')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual(expectedNewTeam);
                        expect(clashTeamsServiceImpl.createNewTeam).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.createNewTeam).toHaveBeenCalledWith(payload.id, payload.serverName, payload.tournamentName, payload.tournamentDay, payload.startTime);
                        done();
                    })
            })

            test('Error - Failed to create Team - As a User, I should be able to receive a generic error message if create a new Team through /api/team POST fails.', (done) => {
                const payload = {
                    id: '123',
                    serverName: 'Test Server',
                    teamName: 'Team Awesomenaught',
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1',
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let error = new Error('Failed to create new team.');
                clashTeamsServiceImpl.createNewTeam.mockRejectedValue(error);
                request(application)
                    .post('/api/team')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Failed to create new Team.'});
                        expect(clashTeamsServiceImpl.createNewTeam).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.createNewTeam).toHaveBeenCalledWith(payload.id, payload.serverName, payload.tournamentName, payload.tournamentDay, payload.startTime);
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

        describe('POST Clash Create New Team - v2', () => {
            test('As a User, I should be able to create a new Team through /api/v2/team POST. - v2', (done) => {
                const payload = {
                    id: '123',
                    role: 'Top',
                    serverName: 'Test Server',
                    teamName: 'Team Awesomenaught',
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1',
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let expectedNewTeam = {
                    registeredTeam: {
                        teamName: 'New Team',
                        serverName: payload.serverName,
                        players: ['Roidrage'],
                        playersRoleDetails: {},
                        tournamentName: payload.tournamentName,
                        tournamentDay: payload.tournamentDay,
                        startTime: payload.startTime
                    },
                    unregisteredTeams: []
                };
                expectedNewTeam[payload.role] = 'Roidrage';
                clashTeamsServiceImpl.createNewTeamV2.mockResolvedValue(expectedNewTeam);
                request(application)
                    .post('/api/v2/team')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledTimes(1);
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledWith([expectedNewTeam.registeredTeam], expect.anything());
                        expect(res.body).toEqual(expectedNewTeam);
                        expect(clashTeamsServiceImpl.createNewTeamV2).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.createNewTeamV2).toHaveBeenCalledWith(payload.id, payload.role,
                            payload.serverName, payload.tournamentName, payload.tournamentDay, payload.startTime);
                        done();
                    })
            })

            test('Convert Team Db to Team Payload, if a map with not matching ids ' +
                'are passed, it should default to the id. - v2', () => {
                let expectedServer = 'Test Server';
                let expectedUserId = '123';
                let expectedRole = 'Top';
                let expectedTeam = 'Team Awesomenaught';
                let expectedTournamentName = 'awesome_sauce';
                let expectedTournamentDay = '1';
                let expectedNewTeam = {
                    teamName: expectedTeam,
                    serverName: expectedServer,
                    players: [expectedUserId],
                    playersWRoles: {
                        Top: expectedUserId
                    },
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay,
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let idToNameObject = {};
                let convertTeamDbToTeamPayload1 = convertTeamDbToTeamPayloadV2(expectedNewTeam, idToNameObject);
                expect(convertTeamDbToTeamPayload1.playersDetails)
                    .toEqual([{name: expectedUserId, role: expectedRole, id: expectedUserId}]);
            })

            test('No available Teams - As a User, I should be able to receive a generic ' +
                'error message if create a new Team through /api/v2/team POST fails to be passed ' +
                'any valid Tournaments. - v2', (done) => {
                const payload = {
                    id: '123',
                    role: 'Top',
                    serverName: 'Test Server',
                    teamName: 'Team Awesomenaught',
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1',
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let expectedNewTeam = {error: 'Player is not eligible to create a new Team. - v2'};
                clashTeamsServiceImpl.createNewTeamV2.mockResolvedValue(expectedNewTeam);
                request(application)
                    .post('/api/v2/team')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(sendTeamUpdateThroughWs).not.toHaveBeenCalled();
                        expect(res.body).toEqual(expectedNewTeam);
                        expect(clashTeamsServiceImpl.createNewTeamV2).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.createNewTeamV2).toHaveBeenCalledWith(payload.id, payload.role,
                            payload.serverName, payload.tournamentName, payload.tournamentDay, payload.startTime);
                        done();
                    })
            })

            test('Error - Failed to create Team - As a User, I should be able to receive ' +
                'a generic error message if create a new Team through /api/v2/team POST fails. - v2', (done) => {
                const payload = {
                    id: '123',
                    role: 'Top',
                    serverName: 'Test Server',
                    teamName: 'Team Awesomenaught',
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1',
                    startTime: 'Aug 12th 2021 7:00 pm PDT'
                };
                let error = new Error('Failed to create new team.');
                clashTeamsServiceImpl.createNewTeamV2.mockRejectedValue(error);
                request(application)
                    .post('/api/v2/team')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Failed to create new Team.'});
                        expect(clashTeamsServiceImpl.createNewTeamV2).toHaveBeenCalledTimes(1);
                        expect(clashTeamsServiceImpl.createNewTeamV2).toHaveBeenCalledWith(payload.id, payload.role,
                            payload.serverName, payload.tournamentName, payload.tournamentDay, payload.startTime);
                        done();
                    })
            })

            test('Bad Request - missing start time - Create New Team I should be returned a ' +
                '400 Bad Request if the Start Time is missing. - v2', (done) => {
                let expectedRole = 'Top';
                let expectedServer = 'Test Server';
                let expectedTeam = 'Team Awesomenaught';
                let expectedTournamentName = 'awesome_sauce';
                let expectedTournamentDay = '1';
                const expectedPayload =
                    {
                        id: '24323123',
                        role: expectedRole,
                        username: 'Test User',
                        serverName: expectedServer,
                        teamName: expectedTeam,
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    };
                request(application)
                    .post('/api/v2/team')
                    .send(expectedPayload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Missing Tournament start time to persist.'});
                        expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).not.toHaveBeenCalled();
                        done();
                    })
            })

            test('Bad Request - missing User id - Create New Team I should be returned a 400 ' +
                'Bad Request if the User Id is missing. - v2', (done) => {
                let expectedRole = 'Top';
                let expectedServer = 'Test Server';
                let expectedTeam = 'Team Awesomenaught';
                let expectedTournamentName = 'awesome_sauce';
                let expectedTournamentDay = '1';
                const expectedPayload =
                    {
                        role: expectedRole,
                        username: 'Test User',
                        serverName: expectedServer,
                        teamName: expectedTeam,
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    };
                request(application)
                    .post('/api/v2/team')
                    .send(expectedPayload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Missing User to persist.'});
                        expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).not.toHaveBeenCalled();
                        done();
                    })
            })

            test('Bad Request - missing Server - Create New Team I should be returned a ' +
                '400 Bad Request if the Server Name is missing. - v2', (done) => {
                let expectedRole = 'Top';
                let expectedTeam = 'Team Awesomenaught';
                let expectedTournamentName = 'awesome_sauce';
                let expectedTournamentDay = '1';
                const expectedPayload =
                    {
                        id: '24323123',
                        role: expectedRole,
                        username: 'Test User',
                        teamName: expectedTeam,
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    };
                request(application)
                    .post('/api/v2/team')
                    .send(expectedPayload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Missing Server to persist with.'});
                        expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).not.toHaveBeenCalled();
                        done();
                    })
            })

            test('Bad Request - missing Tournament Name - Create New Team I should be ' +
                'returned a 400 Bad Request if the Tournament Name is missing. - v2', (done) => {
                let expectedRole = 'Top';
                let expectedTeam = 'Team Awesomenaught';
                let expectedTournamentDay = '1';
                const expectedPayload =
                    {
                        id: '24323123',
                        role: expectedRole,
                        username: 'Test User',
                        teamName: expectedTeam,
                        serverName: 'Test Server',
                        tournamentDay: expectedTournamentDay
                    };
                request(application)
                    .post('/api/v2/team')
                    .send(expectedPayload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Missing Tournament Details to persist with.'});
                        expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).not.toHaveBeenCalled();
                        done();
                    })
            })

            test('Bad Request - missing Tournament Day - Create New Team I should be returned a ' +
                '400 Bad Request if the Tournament Day is missing. - v2', (done) => {
                let expectedRole = 'Top';
                let expectedTeam = 'Team Awesomenaught';
                let expectedTournamentName = 'awesome_sauce';
                const expectedPayload =
                    {
                        id: '24323123',
                        role: expectedRole,
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
                        expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).not.toHaveBeenCalled();
                        done();
                    })
            })

            test('Bad Request - missing Role - Create New Team I should be returned a ' +
                '400 Bad Request if the Role is missing. - v2', (done) => {
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
                    .post('/api/v2/team')
                    .send(expectedPayload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(res.body).toEqual({error: 'Missing Role to persist with.'});
                        expect(clashTeamsDbImpl.registerPlayerToNewTeamV2).not.toHaveBeenCalled();
                        done();
                    })
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
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(0, 1), expectedServerName, mockTentativeIds.slice(1)).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(1, 3), expectedServerName, mockTentativeIds).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(3, 4), expectedServerName, mockTentativeIds.slice(0, 1)).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));

            let expectedApiResponse = [];
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(0, 1), mockTentativeList.slice(1)));
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(1, 3), mockTentativeList));
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(3, 4), mockTentativeList.slice(0, 1)));
            clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue({
                '123456': mockTentativeList[0],
                '2': mockTentativeList[1]
            });
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

        test('When a request with a serverName is made for a tentative list with multiple ids and a few that do not have user mappings, then a list of tournaments and tentative users should be returned with their ids populated.', (done) => {
            const expectedServerName = 'Goon Squad';
            const mockTentativeList = ['Roidrage', 'TheIncentive'];
            const mockTentativeIds = ['123456', '2'];
            const mockReturnedClashTournaments = createMockListOfTournaments(4);

            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(0, 1), expectedServerName, mockTentativeIds.slice(1)).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(1, 3), expectedServerName, mockTentativeIds).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(3, 4), expectedServerName, ['3']).forEach(response => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(response));

            let expectedApiResponse = [];
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(0, 1), mockTentativeList.slice(1)));
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(1, 3), mockTentativeList));
            expectedApiResponse.push(...createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(3, 4), ['3']));
            clashSubscriptionDbImpl.retrievePlayerNames.mockResolvedValue({
                '123456': mockTentativeList[0],
                '2': mockTentativeList[1]
            });
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
                    expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledWith([...mockTentativeIds.reverse(), '3']);
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

        test('When a request with a serverName is made for a tentative list and if one of the tentative lists returned undefined, then a list of tournaments and tentative users should be returned and the undefined one should be populated with an empty tentative list.', (done) => {
            const mockReturnedClashTournaments = createMockListOfTournaments(4);
            const expectedServerName = 'Goon Squad';
            const expectedTentativeList = ['Roidrage'];
            let expectedResponse = createMockApiTentativeResponses(expectedServerName, mockReturnedClashTournaments.slice(0, 3), expectedTentativeList);
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
            createMockTentativeDbReturn(mockReturnedClashTournaments.slice(0, 3), expectedServerName, ['123456']).forEach((record) => clashTentativeDbImpl.getTentative.mockResolvedValueOnce(record));
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
                };
                clashTentativeServiceImpl.handleTentativeRequest.mockResolvedValue(expectedResponse);
                request(application)
                    .post(`/api/tentative`)
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(clashTentativeServiceImpl.handleTentativeRequest).toHaveBeenCalledTimes(1);
                        expect(clashTentativeServiceImpl.handleTentativeRequest).toHaveBeenCalledWith(payload.id, payload.serverName, payload.tournamentDetails.tournamentName, payload.tournamentDetails.tournamentDay);
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
                clashTentativeServiceImpl.handleTentativeRequest.mockRejectedValue(new Error('Failed to persist tentative record.'));
                request(application)
                    .post(`/api/tentative`)
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(clashTentativeServiceImpl.handleTentativeRequest).toHaveBeenCalledTimes(1);
                        expect(clashTentativeServiceImpl.handleTentativeRequest).toHaveBeenCalledWith(payload.id, payload.serverName, payload.tournamentDetails.tournamentName, payload.tournamentDetails.tournamentDay);
                        expect(res.body).toEqual({error: 'Failed to update Tentative record.'});
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
                    tournamentDetails: {tournamentDay: '2'}
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
                    tournamentDetails: {tournamentName: 'awesome_sauce'}
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

        describe('POST Tentative - /api/v2/tentative - v2', () => {
            test('When a User calls to be added or removed to the tentative list ' +
                'with the server name, tournament details and their id, they should ' +
                'successfully be added. - v2', (done) => {
                const expectedReturnedUnregisteredTeams = [{
                    teamName: 'Team unregisteredFrom',
                    serverName: 'Goon Squad',
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '2'
                    },
                    playerDetails: []
                }];
                const expectedApiResponse = {
                    tentativeDetails: {
                        tentativePlayers: ['Roidrage'],
                        serverName: 'Goon Squad',
                        tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
                    },
                    unregisteredTeams: expectedReturnedUnregisteredTeams
                };
                const payload = {
                    id: '2',
                    serverName: 'Goon Squad',
                    tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
                };
                clashTentativeServiceImpl.handleTentativeRequestV2.mockResolvedValue(expectedApiResponse);
                request(application)
                    .post('/api/v2/tentative')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200, (err, res) => {
                        if (err) return done(err);
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalled();
                        expect(sendTeamUpdateThroughWs).toHaveBeenCalledWith(expectedApiResponse.unregisteredTeams,
                            expect.anything());
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledTimes(1);
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledWith(payload.id,
                            payload.serverName, payload.tournamentDetails.tournamentName, payload.tournamentDetails.tournamentDay);
                        expect(res.body).toEqual(expectedApiResponse.tentativeDetails);
                        done();
                    })
            })

            test('ERROR - Failed to persist tentative - There was an error updating ' +
                'the tentative record. - v2', (done) => {
                const payload = {
                    id: '2',
                    serverName: 'Goon Squad',
                    tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
                }
                clashTentativeServiceImpl.handleTentativeRequestV2.mockRejectedValue(
                    new Error('Failed to persist tentative record.'));
                request(application)
                    .post(`/api/v2/tentative`)
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(500, (err, res) => {
                        if (err) return done(err);
                        expect(sendTeamUpdateThroughWs).not.toHaveBeenCalled();
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledTimes(1);
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledWith(payload.id,
                            payload.serverName, payload.tournamentDetails.tournamentName,
                            payload.tournamentDetails.tournamentDay);
                        expect(res.body).toEqual({error: 'Failed to update Tentative record.'});
                        done();
                    })
            })

            test('Bad request - Missing Id - The user id was not passed. - v2', (done) => {
                const payload = {
                    serverName: 'Goon Squad',
                    tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
                }
                request(application)
                    .post(`/api/v2/tentative`)
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledTimes(0);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                        expect(res.body).toEqual({error: 'Missing required request parameter.'});
                        done();
                    })
            })

            test('Bad request - Missing Server Name - The user id was not passed. - v2', (done) => {
                const payload = {
                    id: '2',
                    tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'}
                }
                request(application)
                    .post(`/api/v2/tentative`)
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledTimes(0);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                        expect(res.body).toEqual({error: 'Missing required request parameter.'});
                        done();
                    })
            })

            test('Bad request - Missing Tournament Details - The user id was not passed. - v2', (done) => {
                const payload = {
                    id: '2',
                    serverName: 'Goon Squad',
                }
                request(application)
                    .post('/api/v2/tentative')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledTimes(0);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                        expect(res.body).toEqual({error: 'Missing required request parameter.'});
                        done();
                    })
            })

            test('Bad request - Missing Tournament Name - The user id was not passed. - v2', (done) => {
                const payload = {
                    id: '2',
                    serverName: 'Goon Squad',
                    tournamentDetails: {tournamentDay: '2'}
                }
                request(application)
                    .post('/api/v2/tentative')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledTimes(0);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                        expect(res.body).toEqual({error: 'Missing required request parameter.'});
                        done();
                    })
            })

            test('Bad request - Missing Tournament Day - The user id was not passed. - v2', (done) => {
                const payload = {
                    id: '2',
                    serverName: 'Goon Squad',
                    tournamentDetails: {tournamentName: 'awesome_sauce'}
                }
                request(application)
                    .post('/api/v2/tentative')
                    .send(payload)
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(400, (err, res) => {
                        if (err) return done(err);
                        expect(clashTentativeServiceImpl.handleTentativeRequestV2).toHaveBeenCalledTimes(0);
                        expect(clashSubscriptionDbImpl.retrievePlayerNames).toHaveBeenCalledTimes(0);
                        expect(res.body).toEqual({error: 'Missing required request parameter.'});
                        done();
                    })
            })
        })
    })

    describe('GET User', () => {
        test('When I ask to retrieve the User information based on the User Id with a GET on /api/user, and it should respond with a User Details payload.', (done) => {
            const userId = '12321312';
            const mockDbResponse = {
                key: userId,
                playerName: 'Some Player',
                serverName: 'Some Server',
                timeAdded: new Date().toISOString(),
                subscribed: 'true',
                preferredChampions: ['Sett']
            };
            const mockResponseValue = {
                id: userId,
                username: mockDbResponse.playerName,
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
                playerName: 'some player',
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {'UpcomingClashTournamentDiscordDM': true}
            };
            const mockDbResponse = {
                key: payload.id,
                serverName: 'Some Server',
                playerName: payload.playerName,
                timeAdded: new Date().toISOString(),
                subscribed: true,
                preferredChampions: ['Sett']
            };
            const mockResponseValue = {
                id: payload.id,
                username: payload.playerName,
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
                    expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledWith(payload.id, payload.serverName, payload.playerName, payload.preferredChampions, payload.subscriptions.UpcomingClashTournamentDiscordDM)
                    done();
                })
        })

        test('As a User, if the subscriptions is empty then UpcomingClashTournamentDiscordDM should be defaulted to false, I can do it through post.', (done) => {
            let payload = {
                id: '1234556778',
                playerName: 'some player',
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {}
            };
            const mockDbResponse = {
                key: payload.id,
                serverName: 'Some Server',
                playerName: payload.playerName,
                timeAdded: new Date().toISOString(),
                preferredChampions: ['Sett']
            };
            const mockResponseValue = {
                id: payload.id,
                username: payload.playerName,
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
                    expect(clashSubscriptionDbImpl.createUpdateUserDetails).toHaveBeenCalledWith(payload.id, payload.serverName, payload.playerName, payload.preferredChampions, payload.subscriptions.UpcomingClashTournamentDiscordDM)
                    done();
                })
        })

        test('As a User, if an error is returned as an attribute return as 400 with the error.', (done) => {
            let payload = {
                id: '1234556778',
                playerName: 'some player',
                serverName: 'Some Server',
                preferredChampions: ['Sett'],
                subscriptions: {}
            };
            const mockDbResponse = {
                error: 'Cannot persist more than 5 champions.'
            };
            clashSubscriptionDbImpl.createUpdateUserDetails.mockResolvedValue(mockDbResponse);
            request(application)
                .post('/api/user')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Cannot persist more than 5 champions.'});
                    done();
                })
        })

        test('Bad Request - missing id - As a User, when I request to create my data, I want to receive an error related to the Id passed if it is missing.', (done) => {
            let payload = {
                playerName: 'Some Player',
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

        test('Bad Request - missing player name - As a User, when I request to create my data, I want to receive an error related to the Id passed if it is missing.', (done) => {
            let payload = {
                id: '1',
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
                    expect(res.body).toEqual({error: 'Missing required User Details'});
                    done();
                })
        })

        test('Bad Request - missing Server Name - As a User, when I request to create my data, I want to receive an error related to the Server Name passed if it is missing.', (done) => {
            let payload = {
                id: '12312312',
                playerName: 'Some Player',
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
                playerName: 'Some Player',
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
                playerName: 'Some Player',
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

    describe('PUT User - /api/user', () => {
        test('When I call this endpoint with an id, username, and server. I should be able to have a response with the a user object.', (done) => {
            const payload = {
                id: '1234556778',
                username: 'some player',
                serverName: 'Some Server'
            };
            const expectedResponse = {
                id: payload.id,
                username: payload.username,
                serverName: payload.serverName,
                preferredChampions: [],
                subscriptions: {'UpcomingClashTournamentDiscordDM': false}
            };
            clashUserServiceImpl.checkIfIdExists.mockResolvedValue({
                id: payload.id,
                username: payload.username,
                serverName: payload.serverName,
                preferredChampions: []
            });
            request(application)
                .post('/api/user/verify')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashUserServiceImpl.checkIfIdExists).toHaveBeenCalledTimes(1);
                    expect(clashUserServiceImpl.checkIfIdExists).toHaveBeenCalledWith(payload.id, payload.username, payload.serverName);
                    expect(res.body).toEqual(expectedResponse);
                    done();
                })
        })

        test('Error - Failed to verify user', (done) => {
            const payload = {
                id: '1',
                username: 'some player',
                serverName: 'Some Server'
            };
            clashUserServiceImpl.checkIfIdExists.mockRejectedValue(new Error('Failed to find user.'));
            request(application)
                .post('/api/user/verify')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, (err, res) => {
                    if (err) return done(err);
                    expect(clashUserServiceImpl.checkIfIdExists).toHaveBeenCalledTimes(1);
                    expect(clashUserServiceImpl.checkIfIdExists).toHaveBeenCalledWith(payload.id, payload.username, payload.serverName);
                    expect(res.body).toEqual({error: 'Failed to verify User.'});
                    done();
                })
        })

        test('Bad Request - Missing User Id', (done) => {
            const payload = {
                username: 'some player',
                serverName: 'Some Server'
            };
            const expectedResponse = {error: 'Missing expected User Information'};
            request(application)
                .post('/api/user/verify')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashUserServiceImpl.checkIfIdExists).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual(expectedResponse);
                    done();
                })
        })

        test('Bad Request - Missing Username', (done) => {
            const payload = {
                id: '1',
                serverName: 'Some Server'
            };
            const expectedResponse = {error: 'Missing expected User Information'};
            request(application)
                .post('/api/user/verify')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashUserServiceImpl.checkIfIdExists).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual(expectedResponse);
                    done();
                })
        })

        test('Bad Request - Missing Server Name', (done) => {
            const payload = {
                id: '1',
                username: 'some player'
            };
            const expectedResponse = {error: 'Missing expected User Information'};
            request(application)
                .post('/api/user/verify')
                .send(payload)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(clashUserServiceImpl.checkIfIdExists).toHaveBeenCalledTimes(0);
                    expect(res.body).toEqual(expectedResponse);
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

