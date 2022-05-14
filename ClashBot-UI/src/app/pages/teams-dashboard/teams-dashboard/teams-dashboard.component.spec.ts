import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TeamsDashboardComponent} from './teams-dashboard.component';
import {ClashBotService} from "../../../services/clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TestScheduler} from "rxjs/testing";
import {FilterType} from "../../../interfaces/filter-type";
import {HttpErrorResponse} from "@angular/common/http";
import {ClashTeam} from "../../../interfaces/clash-team";
import {UserDetails} from "../../../interfaces/user-details";
import {MatDialog} from "@angular/material/dialog";
import {ClashTournaments} from "../../../interfaces/clash-tournaments";
import {ApplicationDetailsService} from "../../../services/application-details.service";
import {ApplicationDetails} from "../../../interfaces/application-details";
import {DiscordGuild} from "../../../interfaces/discord-guild";
import {ClashBotTentativeDetails} from "../../../interfaces/clash-bot-tentative-details";
import {ClashBotUserRegister} from "../../../interfaces/clash-bot-user-register";
import {TeamsWebsocketService} from "../../../services/teams-websocket.service";
import {Subject} from "rxjs";
import {TeamsModule} from "../teams.module";
import {
    copyObject,
    create400HttpError,
    createEmptyMockClashTentativeDetails,
    createMockAppDetails,
    createMockClashBotUserDetails, createMockClashTeam, createMockGuilds,
    createMockUserDetails, setupLoggedInMockApplicationDetails, setupLoggedOutMockApplicationDetails
} from "../../../shared/shared-test-mocks.spec";

jest.mock("../../../services/clash-bot.service");
jest.mock("../../../services/application-details.service");
jest.mock("../../../services/teams-websocket.service");
jest.mock("@angular/material/snack-bar");

describe('TeamsDashboardComponent', () => {
    let component: TeamsDashboardComponent;
    let fixture: ComponentFixture<TeamsDashboardComponent>;
    let clashBotServiceMock: any;
    let applicationDetailsMock: any;
    let teamsWebsocketServiceMock: any;
    let snackBarMock: any;
    let testScheduler: TestScheduler;

    beforeEach(async () => {
        testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
        jest.resetAllMocks();
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [TeamsModule],
            providers: [ClashBotService, TeamsWebsocketService,
                ApplicationDetailsService, MatSnackBar, MatDialog],
        }).compileComponents();
        clashBotServiceMock = TestBed.inject(ClashBotService);
        teamsWebsocketServiceMock = TestBed.inject(TeamsWebsocketService);
        snackBarMock = TestBed.inject(MatSnackBar);
        applicationDetailsMock = TestBed.inject(ApplicationDetailsService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TeamsDashboardComponent);
    });

    describe('On Init', () => {
        test('(create, logged in, and default guild) - a call to the Application Details should be made and if the User has a default guild it will be set and then a call to retrieve the teams will be made.', (done) => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const mockUserDetails: UserDetails = createMockUserDetails();
                let mockGuilds = mockDiscordGuilds();
                let mockClashTournaments = createMockClashTournaments('awesome_sauce', '1');
                let mockClashTeams = createMockClashTeams(mockClashTournaments, mockUserDetails);
                let mockMappedTeams = mapClashTeams(mockClashTeams);
                const expectedTeamsFilter = mockGuilds.map((record) => {
                    let id = record.name.replace(new RegExp(/ /, 'g'), '-').toLowerCase();
                    return {
                        value: record.name,
                        type: FilterType.SERVER,
                        state: false,
                        id: id
                    }
                });
                let mockApplicationsDetails: ApplicationDetails = createMockAppDetails(mockGuilds, createMockClashBotUserDetails(), mockUserDetails);
                mockApplicationsDetails.loggedIn = true;
                mockApplicationsDetails.defaultGuild = 'Clash Bot';
                let mockClashTentativeDetails: ClashBotTentativeDetails[] = createEmptyMockClashTentativeDetails();
                mockClashTentativeDetails[0].tentativePlayers.push("Sample User");
                let coldClashTeamsWebsocketObs = new Subject<ClashTeam | String>();

                applicationDetailsMock.getApplicationDetails.mockReturnValue(cold('x|', {x: mockApplicationsDetails}));
                clashBotServiceMock.getServerTentativeList.mockReturnValue(cold('x|', {x: mockClashTentativeDetails}));
                clashBotServiceMock.getClashTeams.mockReturnValue(cold('x|', {x: mockClashTeams}));
                teamsWebsocketServiceMock.getSubject.mockReturnValue(coldClashTeamsWebsocketObs);

                component = fixture.componentInstance;

                expect(component.showSpinner).toBeFalsy();

                mockClashTentativeDetails[0].isMember = true;
                mockClashTentativeDetails[1].isMember = false;
                mockClashTentativeDetails[2].isMember = false;

                let msg: ClashTeam = {
                    teamName: 'Team toBeAdded',
                    playersDetails: [{
                        name: 'PlayerOne',
                        id: 1,
                        role: 'Top',
                        champions: [],
                        isUser: true
                    }],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    },
                    serverName: 'Goon Squad',
                    startTime: new Date().toISOString(),
                    id: "Goon Squad"
                };

                coldClashTeamsWebsocketObs.subscribe((msg) => {
                    if (typeof msg === 'string') {
                        expect(msg).toEqual(mockApplicationsDetails.defaultGuild);
                    }
                });

                fixture.detectChanges();

                flush();

                expect(component.showSpinner).toBeFalsy();
                expect(component.teamFilters).toEqual(expectedTeamsFilter);
                expect(component.currentApplicationDetails).toEqual(mockApplicationsDetails);
                expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
                expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.getClashTeams).toHaveBeenCalledWith(mockApplicationsDetails.defaultGuild);
                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledWith(mockApplicationsDetails.defaultGuild);
                expect(teamsWebsocketServiceMock.getSubject).toHaveBeenCalledTimes(2);
                expect(component.tentativeList).toEqual(mockClashTentativeDetails);

                coldClashTeamsWebsocketObs.subscribe((msg) => {
                    if (typeof msg !== 'string') {
                        expect(component.teams.length).toEqual(mockMappedTeams.length + 1);
                        expect(component.teams).toEqual([...mockMappedTeams, msg]);
                        coldClashTeamsWebsocketObs.unsubscribe();
                        done();
                    }
                });

                coldClashTeamsWebsocketObs.next(msg);
            })
        })

        test('(create, logged in, no default guild) - a call to the Application Details should be made and if the User does not have a default guild, then none shall be chosen.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                let mockObservableGuilds = mockDiscordGuilds();
                const expectedTeamsFilter = mockObservableGuilds.map((record) => {
                    let id = record.name.replace(new RegExp(/ /, 'g'), '-').toLowerCase();
                    return {
                        value: record.name,
                        type: FilterType.SERVER,
                        state: false,
                        id: id
                    }
                });
                const mockApplicationsDetails: ApplicationDetails = {
                    currentTournaments: [],
                    userGuilds: mockObservableGuilds
                }

                let coldApplicationDetailsObs = cold('x|', {x: mockApplicationsDetails});

                applicationDetailsMock.getApplicationDetails.mockReturnValue(coldApplicationDetailsObs);

                component = fixture.componentInstance;

                fixture.detectChanges();

                flush();
                expect(component.showSpinner).toBeFalsy();
                expect(component.teamFilters).toEqual(expectedTeamsFilter);
                expect(applicationDetailsMock.getApplicationDetails).toHaveBeenCalledTimes(2);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
            })
        })
    })

    describe('Handling Incoming Websocket Event', () => {
        test('(empty) - I should not do anything.', () => {
            component = fixture.componentInstance;
            let msg: ClashTeam = {}
            component.handleIncomingTeamsWsEvent(msg);
            expect(component.teams).toEqual([]);
        })

        test('(New Team with User) - it should be added and remove one eligible Tournaments.', () => {
            component = fixture.componentInstance;
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            let mockUserDetails = createMockUserDetails();
            let mockAppDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                mockUserDetails
            );
            let mockClashTeam: ClashTeam = createMockClashTeam();
            mockClashTeam.playersDetails = [{
                name: mockUserDetails.username,
                id: mockUserDetails.id,
                role: 'Top',
                champions: [],
                isUser: true
            }];
            mockClashTeam.tournamentDetails = {
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay
            };
            mockAppDetails.currentTournaments = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            component.currentApplicationDetails = mockAppDetails;
            expect(component.teams.length).toEqual(0);

            component.handleIncomingTeamsWsEvent(mockClashTeam);

            expect(component.teams.length).toEqual(1);
            expect(component.teams.includes(mockClashTeam)).toBeTruthy();
            expect(component.eligibleTournaments).toHaveLength(1);
            expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
        })

        test('(New Team without User) - it should be added and not remove eligible Tournaments.', () => {
            component = fixture.componentInstance;
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            let mockUserDetails = createMockUserDetails();
            let mockAppDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                mockUserDetails
            );
            let mockClashTeam: ClashTeam = createMockClashTeam();
            mockClashTeam.playersDetails = [{
                name: 'Other user',
                id: 1231232131,
                role: 'Top',
                champions: [],
                isUser: true
            }];
            mockClashTeam.tournamentDetails = {
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay
            };
            mockAppDetails.currentTournaments = mockClashTournaments;
            component.currentApplicationDetails = mockAppDetails;

            expect(component.teams.length).toEqual(0);

            component.handleIncomingTeamsWsEvent(mockClashTeam);

            expect(component.teams.length).toEqual(1);
            expect(component.teams.includes(mockClashTeam)).toBeTruthy();
            expect(component.eligibleTournaments).toHaveLength(2);
            expect(component.eligibleTournaments).toEqual(mockClashTournaments);
        })

        test('(New Team with User and no existing Team) - it should overwrite the existing Teams.', () => {
            component = fixture.componentInstance;
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            let mockUserDetails = createMockUserDetails();
            let msg: ClashTeam = createMockClashTeam();
            msg.playersDetails = [{
                name: mockUserDetails.username,
                id: mockUserDetails.id,
                role: 'Top',
                champions: [],
                isUser: true
            }];
            msg.tournamentDetails = {
                tournamentName: expectedTournamentName,
                tournamentDay: expectedTournamentDay
            };
            let mockApplicationDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                mockUserDetails
            );
            mockApplicationDetails.currentTournaments = mockClashTournaments;
            component.currentApplicationDetails = mockApplicationDetails;
            component.teams = [{error: 'No data'}];
            expect(component.teams.length).toEqual(1);

            component.handleIncomingTeamsWsEvent(msg);

            expect(component.teams.length).toEqual(1);
            expect(component.teams.includes(msg)).toBeTruthy();
            expect(component.eligibleTournaments).toHaveLength(1);
            expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
        })

        test('(Team with no players) - it should be removed.', () => {
            component = fixture.componentInstance;
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            let mockApplicationDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                createMockUserDetails()
            );
            mockApplicationDetails.currentTournaments = mockClashTournaments;
            let msg: ClashTeam = {
                teamName: 'Team toBeRemoved',
                playersDetails: [
                    {
                        name: 'PlayerOne',
                        id: 1,
                        role: 'Top',
                        champions: [],
                        isUser: true
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Mid',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Jg',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Bot',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Supp',
                        champions: [],
                        isUser: false
                    }
                ],
                tournamentDetails: {
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                },
                serverName: 'Goon Squad',
                startTime: new Date().toISOString()
            }
            let copyOfMsg = JSON.parse(JSON.stringify(msg));
            copyOfMsg.playersDetails = [];
            component.currentApplicationDetails = mockApplicationDetails;
            component.teams.push(msg);

            expect(component.teams.length).toEqual(1);
            component.handleIncomingTeamsWsEvent(copyOfMsg);
            expect(component.teams).toEqual([{error: 'No data'}]);
            expect(component.eligibleTournaments).toHaveLength(2);
            expect(component.eligibleTournaments).toEqual(mockClashTournaments);
        })

        test('(Team with undefined Players) - it should be removed.', () => {
            component = fixture.componentInstance;
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            let mockApplicationDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                createMockUserDetails()
            );
            mockApplicationDetails.currentTournaments = mockClashTournaments;
            let msg: ClashTeam = {
                teamName: 'Team toBeRemoved',
                playersDetails: [
                    {
                        name: 'PlayerOne',
                        id: 1,
                        role: 'Top',
                        champions: [],
                        isUser: true
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Mid',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Jg',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Bot',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Supp',
                        champions: [],
                        isUser: false
                    }
                ],
                tournamentDetails: {
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                },
                serverName: 'Goon Squad',
                startTime: new Date().toISOString()
            }
            let copyOfMsg = JSON.parse(JSON.stringify(msg));
            delete copyOfMsg.playersDetails;
            component.currentApplicationDetails = mockApplicationDetails;
            component.teams.push(msg);

            expect(component.teams.length).toEqual(1);
            component.handleIncomingTeamsWsEvent(copyOfMsg);
            expect(component.teams).toEqual([{error: 'No data'}]);
            expect(component.eligibleTournaments).toHaveLength(2);
            expect(component.eligibleTournaments).toEqual(mockClashTournaments);
        })

        test('(Existing Team update, user to be added) - it should update the existing Team.', () => {
            component = fixture.componentInstance;
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            let mockUserDetails = createMockUserDetails();
            let mockApplicationDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                createMockUserDetails()
            );
            mockApplicationDetails.currentTournaments = mockClashTournaments;
            let msg: ClashTeam = {
                teamName: 'Team toBeUpdated',
                playersDetails: [
                    {
                        name: '',
                        id: 0,
                        role: 'Top',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: 'PlayerTwo',
                        id: 2,
                        role: 'Mid',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Jg',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Bot',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Supp',
                        champions: [],
                        isUser: false
                    }
                ],
                tournamentDetails: {
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                },
                serverName: 'Goon Squad',
                startTime: new Date().toISOString(),
                id: "goon-squad-team-tobeupdated",
            };
            let updatedTeamState = JSON.parse(JSON.stringify(msg));
            updatedTeamState.playersDetails[0] = {
                name: mockUserDetails.username,
                id: mockUserDetails.id,
                role: 'Top',
                champions: [],
                isUser: true
            };
            component.teams = [msg];
            component.currentApplicationDetails = mockApplicationDetails;

            expect(component.teams.length).toEqual(1);
            component.handleIncomingTeamsWsEvent(updatedTeamState);
            expect(component.teams.length).toEqual(1);
            expect(component.teams).toEqual([updatedTeamState]);
            expect(component.teams[0].playersDetails?.length).toEqual(5);
            expect(component.teams[0].playersDetails?.[0].name).toEqual('Roidrage');
            expect(component.teams[0].playersDetails?.[0].role).toEqual('Top');
            expect(component.teams[0].playersDetails?.[0].id).toEqual(mockUserDetails.id);
            expect(component.eligibleTournaments).toEqual(mockClashTournaments);
        })

        test('(Existing Team update, user to be removed) - it should update the existing Team.', () => {
            component = fixture.componentInstance;
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
            let mockUserDetails = createMockUserDetails();
            let mockApplicationDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                mockUserDetails
            );
            mockApplicationDetails.currentTournaments = mockClashTournaments;
            let msg: ClashTeam = {
                teamName: 'Team toBeUpdated',
                playersDetails: [
                    {
                        name: mockUserDetails.username,
                        id: mockUserDetails.id,
                        role: 'Top',
                        champions: [],
                        isUser: true
                    },
                    {
                        name: 'PlayerTwo',
                        id: 2,
                        role: 'Mid',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Jg',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Bot',
                        champions: [],
                        isUser: false
                    },
                    {
                        name: '',
                        id: 0,
                        role: 'Supp',
                        champions: [],
                        isUser: false
                    }
                ],
                tournamentDetails: {
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                },
                serverName: 'Goon Squad',
                startTime: new Date().toISOString(),
                id: "goon-squad-team-tobeupdated",
            };
            let updatedTeamState = JSON.parse(JSON.stringify(msg));
            updatedTeamState.playersDetails[0] = {
                name: '',
                id: 0,
                role: 'Top',
                champions: [],
                isUser: false
            };
            component.teams = [msg];
            component.currentApplicationDetails = mockApplicationDetails;

            expect(component.teams.length).toEqual(1);
            component.handleIncomingTeamsWsEvent(updatedTeamState);
            expect(component.teams.length).toEqual(1);
            expect(component.teams).toEqual([updatedTeamState]);
            expect(component.teams[0].playersDetails?.length).toEqual(5);
            expect(component.teams[0].playersDetails?.[0].name).toEqual('');
            expect(component.teams[0].playersDetails?.[0].role).toEqual('Top');
            expect(component.teams[0].playersDetails?.[0].id).toEqual(0);
            expect(component.eligibleTournaments).toEqual(mockClashTournaments);
        })
    })

    describe('Update Tentative List based on Team', () => {
        test('If a mappedTeam is passed and the player passed back on the Team was tentative, then it should build ' +
            'a list of playerNames on the Team and remove it from the existing tentativeList.', () => {
            const expectedPlayer = 'Pepe Conrad';
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';

            const mockClashTeams: ClashTeam =
                {
                    teamName: 'Team Abra',
                    serverName: expectedServerName,
                    tournamentDetails: {
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    },
                    playersDetails: [
                        {
                            id: 1,
                            name: 'Roïdräge',
                            champions: ['Volibear', 'Ornn', 'Sett'],
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 4,
                            name: 'Pepe Conrad',
                            champions: ['Lucian'],
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 3,
                            name: 'Shiragaku',
                            champions: ['Lucian'],
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 2,
                            name: 'TheIncentive',
                            champions: ['Lucian'],
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 5,
                            name: 'Bing Bong',
                            champions: ['Lucian'],
                            role: 'Supp',
                            isUser: false
                        }
                    ]
                };
            component = fixture.componentInstance;
            component.tentativeList = [];
            component.tentativeList.push({
                serverName: expectedServerName,
                tentativePlayers: [expectedPlayer],
                isMember: true,
                tournamentDetails: {
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                }
            });
            let expectedTentativeList = JSON.parse(JSON.stringify(component.tentativeList));
            expectedTentativeList[0].tentativePlayers = [];
            expectedTentativeList[0].isMember = false;
            component.updateTentativeListBasedOnTeam(mockClashTeams);
            expect(component.tentativeList).toEqual(expectedTentativeList);
        })

        test('If a mappedTeam is passed and the player passed back on the Team not tentative, then it should build ' +
            'a list of playerNames on the Team and not update the tentative list.', () => {
            const expectedPlayer = 'Pepe Conrad';
            const expectedServerName = 'Goon Squad';
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';

            const mockClashTeams: ClashTeam =
                {
                    teamName: 'Team Abra',
                    serverName: expectedServerName,
                    tournamentDetails: {
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    },
                    playersDetails: [
                        {
                            id: 1,
                            name: 'Roïdräge',
                            champions: ['Volibear', 'Ornn', 'Sett'],
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 4,
                            name: 'Pepe Conrad',
                            champions: ['Lucian'],
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 3,
                            name: 'Shiragaku',
                            champions: ['Lucian'],
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 2,
                            name: 'TheIncentive',
                            champions: ['Lucian'],
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 5,
                            name: 'Bing Bong',
                            champions: ['Lucian'],
                            role: 'Supp',
                            isUser: false
                        }
                    ]
                };
            component = fixture.componentInstance;
            component.tentativeList = [];
            component.tentativeList.push({
                serverName: expectedServerName,
                tentativePlayers: [expectedPlayer],
                isMember: true,
                tournamentDetails: {
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay
                }
            });
            let expectedTentativeList = JSON.parse(JSON.stringify(component.tentativeList));
            expectedTentativeList[0].tentativePlayers = [];
            expectedTentativeList[0].isMember = false;
            component.updateTentativeListBasedOnTeam(mockClashTeams);
            expect(component.tentativeList).toEqual(expectedTentativeList);
        })
    })

    describe('Filter Team', () => {
        test('(Filter with valid value) - it should make a call and retrieve the Teams from the ClashBot Service with the argument passed.', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                const mockUserDetails: UserDetails = createMockUserDetails();
                let mockAppDetails = createMockAppDetails(
                    createMockGuilds(),
                    createMockClashBotUserDetails(),
                    mockUserDetails
                );
                mockAppDetails.loggedIn = true;

                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '1';
                let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
                let mockClashTeams: ClashTeam[] = createMockClashTeams(mockClashTournaments, mockUserDetails);
                let emptyMockClashTentativeDetails = createEmptyMockClashTentativeDetails();
                let expectedClashTeam: ClashTeam[] = mapClashTeams(mockClashTeams);
                mockAppDetails.currentTournaments = mockClashTournaments;
                component = fixture.componentInstance;
                component.currentApplicationDetails = mockAppDetails;

                const serverTentativeListObservable$ = cold('----x|', {x: emptyMockClashTentativeDetails});
                const clashTeamsObservable$ = cold('----x|', {x: mockClashTeams});

                clashBotServiceMock.getServerTentativeList.mockReturnValue(serverTentativeListObservable$);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);
                teamsWebsocketServiceMock.getSubject.mockReturnValue({
                    next: jest.fn().mockReturnThis(),
                    pipe: jest.fn().mockReturnThis(),
                    subscribe: jest.fn().mockReturnThis()
                });

                const expectedSearchPhrase = 'Goon Squad';

                component.filterTeam(expectedSearchPhrase);

                expectObservable(clashTeamsObservable$).toBe('----x|', {x: mockClashTeams});

                flush();

                expect(clashBotServiceMock.getClashTeams).toBeCalledWith(expectedSearchPhrase);
                expect(component.showSpinner).toBeFalsy();
                expect(component.teams).toEqual(expectedClashTeam);
                expect(component.eligibleTournaments).toHaveLength(1);
                expect(component.eligibleTournaments[0]).toEqual(mockClashTournaments[1]);
            })
        })

        test('(Filter with valid value and API error) - When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and if an generic error occurs the Snack Bar should be called with a generic message..', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                const mockUserDetails: UserDetails = createMockUserDetails();
                let mockAppDetails = createMockAppDetails(
                    createMockGuilds(),
                    createMockClashBotUserDetails(),
                    mockUserDetails
                );
                mockAppDetails.loggedIn = true;

                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '1';
                let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
                let emptyMockClashTentativeDetails = createEmptyMockClashTentativeDetails();
                mockAppDetails.currentTournaments = mockClashTournaments;
                component = fixture.componentInstance;
                component.currentApplicationDetails = mockAppDetails;

                const serverTentativeListObservable$ = cold('----x|', {x: emptyMockClashTentativeDetails});
                const clashTeamsObservable$ = cold('-#', undefined, create400HttpError());

                clashBotServiceMock.getServerTentativeList.mockReturnValue(serverTentativeListObservable$);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);
                teamsWebsocketServiceMock.getSubject.mockReturnValue({
                    next: jest.fn().mockReturnThis(),
                    pipe: jest.fn().mockReturnThis(),
                    subscribe: jest.fn().mockReturnThis()
                });

                const expectedSearchPhrase = 'Goon Squad';

                component.filterTeam(expectedSearchPhrase);

                expectObservable(clashTeamsObservable$).toBe('-#', undefined, create400HttpError());

                flush();
                expect(clashBotServiceMock.getClashTeams).toBeCalledWith(expectedSearchPhrase);
                expect(component.showSpinner).toBeFalsy();
                expect(component.teams).toHaveLength(1);
                expect(component.teams).toEqual([{error: "Failed to make call."}]);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
            })
        })

        test('(Filter with valid value and Timeout) - times out after 7 seconds the Snack Bar should be called with a generic message..', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                const mockUserDetails: UserDetails = createMockUserDetails();
                let mockAppDetails = createMockAppDetails(
                    createMockGuilds(),
                    createMockClashBotUserDetails(),
                    mockUserDetails
                );
                mockAppDetails.loggedIn = true;

                const expectedTournamentName = 'awesome_sauce';
                const expectedTournamentDay = '1';
                let mockClashTournaments: ClashTournaments[] = createMockClashTournaments(expectedTournamentName, expectedTournamentDay);
                let mockClashTeams: ClashTeam[] = createMockClashTeams(mockClashTournaments, mockUserDetails);
                let emptyMockClashTentativeDetails = createEmptyMockClashTentativeDetails();
                mockAppDetails.currentTournaments = mockClashTournaments;
                component = fixture.componentInstance;
                component.currentApplicationDetails = mockAppDetails;

                const serverTentativeListObservable$ = cold('----x|', {x: emptyMockClashTentativeDetails});
                const clashTeamsObservable$ = cold('7000ms x|', {x: mockClashTeams});

                clashBotServiceMock.getServerTentativeList.mockReturnValue(serverTentativeListObservable$);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);
                teamsWebsocketServiceMock.getSubject.mockReturnValue({
                    next: jest.fn().mockReturnThis(),
                    pipe: jest.fn().mockReturnThis(),
                    subscribe: jest.fn().mockReturnThis()
                });

                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                const expectedSearchPhrase = 'Goon Squad';

                component.filterTeam(expectedSearchPhrase);

                expectObservable(clashTeamsObservable$).toBe('7000ms x|', {x: mockClashTeams});

                flush();
                expect(clashBotServiceMock.getClashTeams).toBeCalledWith(expectedSearchPhrase);
                expect(component.showSpinner).toBeFalsy();
                expect(component.teams).toHaveLength(1);
                expect(component.teams).toEqual([{error: "Failed to make call."}]);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
            })
        })

        test('(Filter with valid value and User is not loggedIn) - it should not make a call but show a snack bar error immediately that the player needs to login again.', () => {
            const mockUserDetails: UserDetails = createMockUserDetails();
            let mockAppDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                mockUserDetails
            );
            mockAppDetails.loggedIn = false;

            component = fixture.componentInstance;
            component.currentApplicationDetails = mockAppDetails;

            component.filterTeam('Goon Squad');

            expect(component.showSpinner).toBeFalsy();
            expect(snackBarMock.open).toHaveBeenCalledTimes(1);
            expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
            expect(component.teams).toEqual([{error: "No data"}]);
        })
    })

    describe('Register for Team', () => {
        test('(Register for Team with valid User) - call to Clash Bot service to register a user to the team.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const mockUserDetails: UserDetails = createMockUserDetails();
                const mockClashTournaments = createMockClashTournaments('msi2022', '1');
                let mockAppDetails = createMockAppDetails(
                    createMockGuilds(),
                    createMockClashBotUserDetails(),
                    mockUserDetails
                );
                mockAppDetails.loggedIn = true;
                mockAppDetails.currentTournaments = mockClashTournaments;
                const expectedServer = 'Test Server';
                const registerUserRequest: ClashBotUserRegister = {
                    teamName: 'Team Abra',
                    role: 'Top',
                    tournamentDetails: {
                        tournamentName: mockClashTournaments[0].tournamentName,
                        tournamentDay: mockClashTournaments[0].tournamentDay
                    },
                    serverName: expectedServer
                };

                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: expectedServer,
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top',
                                isUser: false
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Mid',
                                isUser: false
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'Jg',
                                isUser: false
                            },
                            {
                                id: 4,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'Bot',
                                isUser: false
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
                expectedMockClashTeamResponse[0].playersDetails.push({
                    id: mockUserDetails.id,
                    name: mockUserDetails.username,
                    role: 'Supp',
                    isUser: true
                });
                let mockRetrieveUserResponse = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));

                component = fixture.componentInstance;
                component.currentApplicationDetails = mockAppDetails;

                component.teams = JSON.parse(JSON.stringify(mockClashTeams));

                let registerUserForTeamColdObservable = cold('-x|', {x: mockRetrieveUserResponse});

                clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

                component.registerForTeam(registerUserRequest);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.registerUserForTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.registerUserForTeam).toHaveBeenCalledWith(mockUserDetails, registerUserRequest);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
            });
        })

        test('(Register for Team with no valid User) - it should show a snackbar error.', () => {
            const mockUserDetails: UserDetails = createMockUserDetails();
            const mockClashTournaments = createMockClashTournaments('msi2022', '1');
            let mockAppDetails = createMockAppDetails(
                createMockGuilds(),
                createMockClashBotUserDetails(),
                mockUserDetails
            );
            mockAppDetails.loggedIn = false;
            mockAppDetails.currentTournaments = mockClashTournaments;
            const expectedServer = 'Test Server';
            const registerUserRequest: ClashBotUserRegister = {
                teamName: 'Team Abra',
                role: 'Top',
                tournamentDetails: {
                    tournamentName: mockClashTournaments[0].tournamentName,
                    tournamentDay: mockClashTournaments[0].tournamentDay
                },
                serverName: expectedServer
            };
            component = fixture.componentInstance;
            component.currentApplicationDetails = mockAppDetails;

            component.registerForTeam(registerUserRequest);

            expect(clashBotServiceMock.registerUserForTeam).not.toHaveBeenCalled();
            expect(snackBarMock.open).toHaveBeenCalledTimes(1);
            expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
        })

        test('(Register for Team and API Error) - should invoke the Snack Bar if there is an error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const mockUserDetails: UserDetails = createMockUserDetails();
                const mockClashTournaments = createMockClashTournaments('msi2022', '1');
                let mockAppDetails = createMockAppDetails(
                    createMockGuilds(),
                    createMockClashBotUserDetails(),
                    mockUserDetails
                );
                mockAppDetails.loggedIn = true;
                mockAppDetails.currentTournaments = mockClashTournaments;

                component = fixture.componentInstance;
                component.currentApplicationDetails = mockAppDetails;

                const mockRetrieveUserResponse: ClashTeam = {teamName: 'Team Awesome'};
                component.teams = [{teamName: 'Team Awesome', playersDetails: []}];
                const expectedError =
                    new HttpErrorResponse({
                        error: 'Failed to make call.',
                        headers: undefined,
                        status: 400,
                        statusText: 'Bad Request',
                        url: 'https://localhost.com/api'
                    });
                let registerUserForTeamColdObservable = cold('-#', undefined, expectedError);

                clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

                component.registerForTeam(mockRetrieveUserResponse);

                flush();

                expect(component.teams).toEqual([{
                    teamName: 'Team Awesome',
                    playersDetails: []
                }]);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Failed to register you to the Team, missing required details.', 'X', {duration: 5000});
            });
        })

        test('(Register for Team and Timeout Error) -  should invoke the Snack Bar if there is an timeout.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const mockUserDetails: UserDetails = createMockUserDetails();
                const mockClashTournaments = createMockClashTournaments('msi2022', '1');
                let mockAppDetails = createMockAppDetails(
                    createMockGuilds(),
                    createMockClashBotUserDetails(),
                    mockUserDetails
                );
                mockAppDetails.loggedIn = true;
                mockAppDetails.currentTournaments = mockClashTournaments;
                const expectedServer = 'Test Server';
                const registerUserRequest: ClashBotUserRegister = {
                    teamName: 'Team Abra',
                    role: 'Top',
                    tournamentDetails: {
                        tournamentName: mockClashTournaments[0].tournamentName,
                        tournamentDay: mockClashTournaments[0].tournamentDay
                    },
                    serverName: expectedServer
                };

                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: expectedServer,
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top',
                                isUser: false
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Mid',
                                isUser: false
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'Jg',
                                isUser: false
                            },
                            {
                                id: 4,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'Bot',
                                isUser: false
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
                expectedMockClashTeamResponse[0].playersDetails.push({
                    id: mockUserDetails.id,
                    name: mockUserDetails.username,
                    role: 'Supp',
                    isUser: true
                });
                let mockRetrieveUserResponse = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));

                component = fixture.componentInstance;
                component.currentApplicationDetails = mockAppDetails;

                component.teams = JSON.parse(JSON.stringify(mockClashTeams));

                let registerUserForTeamColdObservable = cold('7000ms -x|', {x: mockRetrieveUserResponse});

                clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

                component.registerForTeam(registerUserRequest);

                flush();

                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your registration timed out, please try again!', 'X', {duration: 5000});
            });
        })
    })

    describe('Unregister from Team', () => {
        test('(Unregister from Team) - invoke a call to Clash Bot service to unregister a user from team.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;

                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: 'Test Server',
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top',
                                isUser: false
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'Mid',
                                isUser: false
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg',
                                isUser: false
                            },
                            {
                                id: 4,
                                name: loggedInMockApplicationDetails?.userDetails?.username ?? "",
                                role: 'Bot',
                                isUser: false
                            },
                            {
                                id: 5,
                                name: 'The Micah-chan',
                                role: 'Supp',
                                isUser: true
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
                let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
                expectedMockClashTeamResponse[0].playersDetails.pop();

                component.teams = copyObject(mockClashTeams);

                let unregisterUserFromTeamColdObservable = cold('-x|', {x: {message: 'Successfully unregistered User from Team.'}});

                clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);

                component.unregisterFromTeam(mockTeamToUnregisterFrom);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledWith(loggedInMockApplicationDetails.userDetails, mockTeamToUnregisterFrom);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
            });
        })

        test('(Unregister when logged out) - it should show a snackbar error.', () => {
            component = fixture.componentInstance;
            let loggedOutMockApplicationDetails = setupLoggedOutMockApplicationDetails();
            component.currentApplicationDetails = loggedOutMockApplicationDetails;
            let mockClashTeams: ClashTeam[] = [
                {
                    teamName: 'Team Abra',
                    serverName: 'Test Server',
                    playersDetails: [
                        {
                            id: 1,
                            name: 'Roïdräge',
                            champions: ['Volibear', 'Ornn', 'Sett'],
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 2,
                            name: 'TheIncentive',
                            champions: ['Lucian'],
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 3,
                            name: 'Pepe Conrad',
                            champions: ['Lucian'],
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 4,
                            name: loggedOutMockApplicationDetails?.userDetails?.username ?? "",
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 5,
                            name: 'The Micah-chan',
                            role: 'Supp',
                            isUser: true
                        }
                    ]
                }
            ];
            let mockTeamToUnregisterFrom = copyObject(mockClashTeams[0]);
            component.teams = copyObject(mockClashTeams);

            component.unregisterFromTeam(mockTeamToUnregisterFrom);

            expect(clashBotServiceMock.unregisterUserFromTeam).not.toHaveBeenCalled();
            expect(snackBarMock.open).toHaveBeenCalledTimes(1);
            expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
        })

        test('(Unregister with API Error) - invoke the Snack Bar if there is an error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: 'Test Server',
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top',
                                isUser: false
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'Mid',
                                isUser: false
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg',
                                isUser: false
                            },
                            {
                                id: 4,
                                name: loggedInMockApplicationDetails?.userDetails?.username ?? "",
                                role: 'Bot',
                                isUser: false
                            },
                            {
                                id: 5,
                                name: 'The Micah-chan',
                                role: 'Supp',
                                isUser: true
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = copyObject(mockClashTeams);
                let mockTeamToUnregisterFrom = copyObject(mockClashTeams[0]);
                expectedMockClashTeamResponse[0].playersDetails.pop();
                component.teams = copyObject(mockClashTeams);

                clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(cold('-#', undefined, create400HttpError()));

                component.unregisterFromTeam(mockTeamToUnregisterFrom);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledWith(loggedInMockApplicationDetails.userDetails, mockTeamToUnregisterFrom);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Failed to unregister you from the Team.', 'X', {duration: 5000});
            });
        })

        test('(Unregister with Timeout Error) - should invoke the Snack Bar if there is an timeout.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: 'Test Server',
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top',
                                isUser: false
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'Mid',
                                isUser: false
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg',
                                isUser: false
                            },
                            {
                                id: 4,
                                name: loggedInMockApplicationDetails?.userDetails?.username ?? "",
                                role: 'Bot',
                                isUser: false
                            },
                            {
                                id: 5,
                                name: 'The Micah-chan',
                                role: 'Supp',
                                isUser: true
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = copyObject(mockClashTeams);
                let mockTeamToUnregisterFrom = copyObject(mockClashTeams[0]);
                expectedMockClashTeamResponse[0].playersDetails.pop();
                component.teams = copyObject(mockClashTeams);
                clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(cold('7000ms x|', {x: {message: 'Successfully unregistered User from Team.'}}));

                component.unregisterFromTeam(mockTeamToUnregisterFrom);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledWith(loggedInMockApplicationDetails.userDetails, mockTeamToUnregisterFrom);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your request timed out, please try again!', 'X', {duration: 5000});
            });
        })
    })

    describe('Create New Team', () => {
        test('(Post Team) - should invoke post for new team from Clash Bot Service.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                const tournaments = loggedInMockApplicationDetails.currentTournaments;
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                const expectedServerName = 'Integration Server';
                component.currentSelectedGuild = expectedServerName;
                const expectedRole = 'Top';
                let mockCreateNewTeamReturn: ClashTeam = {
                    teamName: 'Team Testing',
                    serverName: expectedServerName,
                    tournamentDetails: {tournamentName: '', tournamentDay: ''},
                    startTime: '',
                    playersDetails: [{
                        id: loggedInMockApplicationDetails?.userDetails?.id ?? 0,
                        name: loggedInMockApplicationDetails?.userDetails?.username ?? "",
                        role: expectedRole,
                        isUser: true
                    }]
                };
                component.eligibleTournaments = copyObject(loggedInMockApplicationDetails.currentTournaments);
                clashBotServiceMock.createNewTeam.mockReturnValue(cold('-x|', {x: mockCreateNewTeamReturn}));

                component.createNewTeam({role: expectedRole, tournamentDay: "2", tournamentName: "msi2022"});

                flush();

                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
                expect(clashBotServiceMock.createNewTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.createNewTeam).toHaveBeenCalledWith(
                    loggedInMockApplicationDetails.userDetails,
                    {
                        serverName: expectedServerName,
                        startTime: tournaments ? tournaments[0].startTime : undefined,
                        tournamentDetails: {
                            tournamentName: 'msi2022',
                            tournamentDay: '2'
                        }
                    },
                    expectedRole
                );
            })
        })

        test('(Post Team with User not logged in) - should invoke Snack bar with invalid user.', () => {
            component = fixture.componentInstance;
            component.currentApplicationDetails = setupLoggedOutMockApplicationDetails();
            component.currentSelectedGuild = 'Integration Server';

            component.createNewTeam({role: 'Top', tournamentDay: "2", tournamentName: "msi2022"});

            expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
            expect(clashBotServiceMock.createNewTeam).not.toHaveBeenCalled();
            expect(snackBarMock.open).toHaveBeenCalledTimes(1);
            expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
            expect(component.teams).toEqual([{error: "No data"}]);
        })

        test('(Post Team with API Error) - should invoke Snack bar with API Error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                const tournaments = loggedInMockApplicationDetails.currentTournaments;
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                const expectedServerName = 'Integration Server';
                component.currentSelectedGuild = expectedServerName;
                const expectedRole = 'Top';
                component.eligibleTournaments = copyObject(loggedInMockApplicationDetails.currentTournaments);
                clashBotServiceMock.createNewTeam.mockReturnValue(cold('-#|', undefined, create400HttpError()));

                component.createNewTeam({role: expectedRole, tournamentDay: "2", tournamentName: "msi2022"});

                flush();

                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
                expect(clashBotServiceMock.createNewTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.createNewTeam).toHaveBeenCalledWith(
                    loggedInMockApplicationDetails.userDetails,
                    {
                        serverName: expectedServerName,
                        startTime: tournaments ? tournaments[0].startTime : undefined,
                        tournamentDetails: {
                            tournamentName: 'msi2022',
                            tournamentDay: '2'
                        }
                    },
                    expectedRole
                );
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! An error occurred while creating a new team.', 'X', {duration: 5000});
            })
        })

        test('(Post Team with Timeout Error) - should invoke Snack bar with Timeout Error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                const tournaments = loggedInMockApplicationDetails.currentTournaments;
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                const expectedServerName = 'Integration Server';
                component.currentSelectedGuild = expectedServerName;
                const expectedRole = 'Top';
                let mockCreateNewTeamReturn: ClashTeam = {
                    teamName: 'Team Testing',
                    serverName: expectedServerName,
                    tournamentDetails: {tournamentName: '', tournamentDay: ''},
                    startTime: '',
                    playersDetails: [{
                        id: loggedInMockApplicationDetails?.userDetails?.id ?? 0,
                        name: loggedInMockApplicationDetails?.userDetails?.username ?? "",
                        role: expectedRole,
                        isUser: true
                    }]
                };
                component.eligibleTournaments = copyObject(loggedInMockApplicationDetails.currentTournaments);
                clashBotServiceMock.createNewTeam.mockReturnValue(cold('7000ms -x|', {x: mockCreateNewTeamReturn}));

                component.createNewTeam({role: expectedRole, tournamentDay: "2", tournamentName: "msi2022"});

                flush();

                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
                expect(clashBotServiceMock.createNewTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.createNewTeam).toHaveBeenCalledWith(
                    loggedInMockApplicationDetails.userDetails,
                    {
                        serverName: expectedServerName,
                        startTime: tournaments ? tournaments[0].startTime : undefined,
                        tournamentDetails: {
                            tournamentName: 'msi2022',
                            tournamentDay: '2'
                        }
                    },
                    expectedRole
                );
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your request to create a new Team has timed out. Please try again.', 'X', {duration: 5000});
            })
        })
    })

    describe('Tournament to Clash Team Map', () => {
        test('As a user, I should know all Tournaments I am scheduled with and which Teams I am assigned to.', () => {
            const expectedTournamentName = 'awesome_sauce';
            const expectedTournamentDay = '1';
            const expectedUserId = 1;
            let mockClashTournaments: ClashTournaments[] = [
                {
                    tournamentName: expectedTournamentName,
                    tournamentDay: expectedTournamentDay,
                    startTime: new Date().toISOString(),
                    registrationTime: new Date().toISOString()
                }
            ];
            let mockClashTeams: ClashTeam[] = [
                {
                    teamName: 'Team Abra',
                    serverName: 'Special Server',
                    tournamentDetails: {
                        tournamentName: 'dne',
                        tournamentDay: expectedTournamentDay
                    },
                    playersDetails: [
                        {
                            id: 1,
                            name: 'User 1',
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 2,
                            name: 'User 2',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 3,
                            name: 'User 3',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 4,
                            name: 'User 4',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 5,
                            name: 'User 5',
                            role: 'Supp',
                            isUser: false
                        },
                    ]
                },
                {
                    teamName: 'Team Abra',
                    serverName: 'Special Server',
                    tournamentDetails: {
                        tournamentName: expectedTournamentName,
                        tournamentDay: expectedTournamentDay
                    },
                    playersDetails: [
                        {
                            id: 0,
                            name: 'User 1',
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: 'User 2',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: 'User 3',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: expectedUserId,
                            name: 'expectedUser',
                            role: 'Supp',
                            isUser: true
                        }
                    ]
                }
            ];
            const expectedTournamentToTeamUserMap = new Map<ClashTournaments, ClashTeam>();
            expectedTournamentToTeamUserMap.set(mockClashTournaments[0], mockClashTeams[1]);
            component = fixture.componentInstance;
            expect(component.createUserToTournamentMap(expectedUserId, mockClashTournaments, mockClashTeams)).toEqual(expectedTournamentToTeamUserMap);
        })
    })

    describe('Sync Team Details', () => {
        test('(Player is on Team for both Tournaments and alone on first) - it should populate the eligible Tournaments list and add the detail if the Player is on the Team.', () => {
            component = fixture.componentInstance;
            let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
            component.currentApplicationDetails = loggedInMockApplicationDetails;
            const tournaments = loggedInMockApplicationDetails.currentTournaments;
            const user = loggedInMockApplicationDetails.userDetails;
            let mockTeamData: ClashTeam[] = [
                {
                    teamName: 'Test Team 1',
                    serverName: 'Integration Server',
                    tournamentDetails: tournaments ? tournaments[0] : {tournamentName: "", tournamentDay: "0"},
                    playersDetails: [
                        {
                            id: user ? user.id : 0,
                            name: user ? user.username : "",
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Supp',
                            isUser: false
                        }
                    ],
                    startTime: new Date().toISOString()
                },
                {
                    teamName: 'Test Team 2',
                    serverName: 'Integration Server',
                    tournamentDetails: tournaments ? tournaments[1] : {tournamentName: "", tournamentDay: "0"},
                    playersDetails: [
                        {
                            id: user ? user.id : 0,
                            name: user ? user.username : "",
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 2,
                            name: 'User 2',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Supp',
                            isUser: false
                        }],
                    startTime: new Date().toISOString()
                }
            ];

            let expectedMappedTeamData = copyObject(mockTeamData);
            expectedMappedTeamData[0].id = "integration-server-test-team-1"
            expectedMappedTeamData[0].playersDetails[0].isUser = true;
            expectedMappedTeamData[1].id = "integration-server-test-team-2"
            expectedMappedTeamData[1].playersDetails[0].isUser = true;

            component.syncTeamInformation(mockTeamData);

            expect(component.teams).toEqual(expectedMappedTeamData);
            expect(component.eligibleTournaments).toEqual([tournaments?.pop()]);
        })

        test('(Player is on Team for both Tournaments and alone on both) - it should populate the eligible Tournaments list and add the detail if the Player is on the Team.', () => {
            component = fixture.componentInstance;
            let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
            component.currentApplicationDetails = loggedInMockApplicationDetails;
            const tournaments = loggedInMockApplicationDetails.currentTournaments;
            const user = loggedInMockApplicationDetails.userDetails;
            let mockTeamData: ClashTeam[] = [
                {
                    teamName: 'Test Team 1',
                    serverName: 'Integration Server',
                    tournamentDetails: tournaments ? tournaments[0] : {tournamentName: "", tournamentDay: "0"},
                    playersDetails: [
                        {
                            id: user ? user.id : 0,
                            name: user ? user.username : "",
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Supp',
                            isUser: false
                        }
                    ],
                    startTime: new Date().toISOString()
                },
                {
                    teamName: 'Test Team 2',
                    serverName: 'Integration Server',
                    tournamentDetails: tournaments ? tournaments[1] : {tournamentName: "", tournamentDay: "0"},
                    playersDetails: [
                        {
                            id: user ? user.id : 0,
                            name: user ? user.username : "",
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Supp',
                            isUser: false
                        }
                    ],
                    startTime: new Date().toISOString()
                }
            ];

            let expectedMappedTeamData = copyObject(mockTeamData);
            expectedMappedTeamData[0].id = "integration-server-test-team-1"
            expectedMappedTeamData[0].playersDetails[0].isUser = true;
            expectedMappedTeamData[1].id = "integration-server-test-team-2"
            expectedMappedTeamData[1].playersDetails[0].isUser = true;

            component.syncTeamInformation(mockTeamData);

            expect(component.teams).toEqual(expectedMappedTeamData);
            expect(component.eligibleTournaments).toEqual([]);
        })

        test('(Player is on Team for one Tournament) - it should populate the eligible Tournaments list and add the detail if the Player is on the Team.', () => {
            component = fixture.componentInstance;
            let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
            component.currentApplicationDetails = loggedInMockApplicationDetails;
            const tournaments = loggedInMockApplicationDetails.currentTournaments;
            const user = loggedInMockApplicationDetails.userDetails;
            let mockTeamData: ClashTeam[] = [
                {
                    teamName: 'Test Team 1',
                    serverName: 'Integration Server',
                    tournamentDetails: tournaments ? tournaments[0] : {tournamentName: "", tournamentDay: "0"},
                    playersDetails: [
                        {
                            id: user ? user.id : 0,
                            name: user ? user.username : "",
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Supp',
                            isUser: false
                        }
                    ],
                    startTime: new Date().toISOString()
                },
                {
                    teamName: 'Test Team 2',
                    serverName: 'Integration Server',
                    tournamentDetails: tournaments ? tournaments[1] : {tournamentName: "", tournamentDay: "0"},
                    playersDetails: [
                        {
                            id: 5,
                            name: 'Mocky mock',
                            role: 'Top',
                            isUser: false
                        },
                        {
                            id: 2,
                            name: 'User 2',
                            role: 'Mid',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Jg',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Bot',
                            isUser: false
                        },
                        {
                            id: 0,
                            name: '',
                            role: 'Supp',
                            isUser: false
                        }],
                    startTime: new Date().toISOString()
                }
            ];

            let expectedMappedTeamData = copyObject(mockTeamData);
            expectedMappedTeamData[0].id = "integration-server-test-team-1"
            expectedMappedTeamData[0].playersDetails[0].isUser = true;
            expectedMappedTeamData[1].id = "integration-server-test-team-2"

            component.syncTeamInformation(mockTeamData);

            expect(component.teams).toEqual(expectedMappedTeamData);
            expect(component.eligibleTournaments).toEqual([tournaments?.pop()]);
        })

        test('(No Teams) - it should populate the teams list with an error of No data', () => {
            component = fixture.componentInstance;
            let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
            component.currentApplicationDetails = loggedInMockApplicationDetails;

            component.syncTeamInformation([]);

            expect(component.teams).toEqual([{error: 'No data'}]);
            expect(component.eligibleTournaments).toEqual(loggedInMockApplicationDetails.currentTournaments);
        })
    })

    describe('Update Tentative List Details', () => {
        test('(User is logged in and User is on first tentative list) - it will populate the tentativeList with the tentativeList details for the server.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let tournaments = loggedInMockApplicationDetails.currentTournaments;
                let user = loggedInMockApplicationDetails.userDetails;
                const expectedGuildName = 'LoL-ClashBotSupport';
                const mockClashTentativeDetails: ClashBotTentativeDetails[] = [
                    {
                        serverName: expectedGuildName,
                        tournamentDetails: tournaments ? tournaments[0] : {tournamentName: "", tournamentDay: "0"},
                        tentativePlayers: [user?.username ?? ""]
                    },
                    {
                        serverName: expectedGuildName,
                        tournamentDetails: tournaments ? tournaments[1] : {tournamentName: "", tournamentDay: "0"},
                        tentativePlayers: []
                    }
                ];

                clashBotServiceMock.getServerTentativeList.mockReturnValue(cold('x|', {x: copyObject(mockClashTentativeDetails)}));
                component.updateTentativeList(expectedGuildName);

                mockClashTentativeDetails[0].isMember = true;
                mockClashTentativeDetails[1].isMember = false;

                expect(component.tentativeDataStatus).toEqual('LOADING');

                flush();

                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledWith(expectedGuildName);
                expect(component.tentativeList).toEqual(mockClashTentativeDetails);
                expect(component.tentativeDataStatus).toEqual('SUCCESSFUL');
            })
        })

        test('(User is logged in and User is not on any tentative list) - it will populate the tentativeList with the tentativeList details for the server.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let tournaments = loggedInMockApplicationDetails.currentTournaments;
                const expectedGuildName = 'LoL-ClashBotSupport';
                const mockClashTentativeDetails: ClashBotTentativeDetails[] = [
                    {
                        serverName: expectedGuildName,
                        tournamentDetails: tournaments ? tournaments[0] : {tournamentName: "", tournamentDay: "0"},
                        tentativePlayers: []
                    },
                    {
                        serverName: expectedGuildName,
                        tournamentDetails: tournaments ? tournaments[1] : {tournamentName: "", tournamentDay: "0"},
                        tentativePlayers: []
                    }
                ];

                clashBotServiceMock.getServerTentativeList.mockReturnValue(cold('x|', {x: copyObject(mockClashTentativeDetails)}));
                component.updateTentativeList(expectedGuildName);

                mockClashTentativeDetails[0].isMember = false;
                mockClashTentativeDetails[1].isMember = false;

                expect(component.tentativeDataStatus).toEqual('LOADING');

                flush();

                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledWith(expectedGuildName);
                expect(component.tentativeList).toEqual(mockClashTentativeDetails);
                expect(component.tentativeDataStatus).toEqual('SUCCESSFUL');
            })
        })

        test('(User is logged in an get Tentative List API fails) - it should invoke a snack bar with a generic error message.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                component.currentApplicationDetails = setupLoggedInMockApplicationDetails();
                const expectedGuildName = 'LoL-ClashBotSupport';

                const mockTentativeDetailsObs = cold('#', undefined, create400HttpError());

                clashBotServiceMock.getServerTentativeList.mockReturnValue(mockTentativeDetailsObs);

                component.updateTentativeList(expectedGuildName);

                flush();

                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledWith(expectedGuildName);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! We were unable to retrieve the Tentative details list for the server! Please try again later.', 'X', {duration: 5000});
                expect(component.tentativeList).toBeFalsy();
                expect(component.tentativeDataStatus).toEqual('FAILED');
            })
        })

        test('(User is logged in an get Tentative List API Times out) - it should invoke a snack bar with a generic error message.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                component.currentApplicationDetails = setupLoggedInMockApplicationDetails();
                const expectedGuildName = 'LoL-ClashBotSupport';

                clashBotServiceMock.getServerTentativeList.mockReturnValue(cold('7000ms x|', {x: []}));

                component.updateTentativeList(expectedGuildName);

                flush();

                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledWith(expectedGuildName);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! We were unable to retrieve the Tentative details list for the server! Please try again later.', 'X', {duration: 5000});
                expect(component.tentativeList).toBeFalsy();
                expect(component.tentativeDataStatus).toEqual('FAILED');
            })
        })

        test('(User is not logged in) - it should invoke a snack bar with a generic error message.', () => {
            component = fixture.componentInstance;
            component.currentApplicationDetails = setupLoggedOutMockApplicationDetails();
            const expectedGuildName = 'LoL-ClashBotSupport';

            component.updateTentativeList(expectedGuildName);

            expect(clashBotServiceMock.getServerTentativeList).not.toHaveBeenCalled()
            expect(snackBarMock.open).toHaveBeenCalledTimes(1);
            expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
            expect(component.tentativeList).toBeFalsy();
        })
    })

    // @TODO refactor for change to observables
    describe('Tentative register/unregister', () => {
        test('(User is logged in and to be added) - it should call to the clash bot service should be made with the user id.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let user = loggedInMockApplicationDetails.userDetails;
                const mockTentativeDetails: ClashBotTentativeDetails = {
                    serverName: 'Goon Squad',
                    tentativePlayers: ['Roidrage'],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    },
                    index: 0,
                    isMember: false
                };

                let updatedTentativeDetails: ClashBotTentativeDetails = copyObject(mockTentativeDetails);
                updatedTentativeDetails.tentativePlayers.push(user?.username ?? "");

                clashBotServiceMock.postTentativeList.mockReturnValue(cold('x|', {x: updatedTentativeDetails}));

                component.tentativeList = [copyObject(mockTentativeDetails)];
                component.tentativeList.push({
                    serverName: 'Goon Squad',
                    tentativePlayers: ['Roidrage'],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '2'
                    },
                    isMember: false
                });

                component.tentativeRegister(mockTentativeDetails);

                flush();

                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledWith(`${user?.id}`, mockTentativeDetails.serverName, mockTentativeDetails.tournamentDetails.tournamentName, mockTentativeDetails.tournamentDetails.tournamentDay);
                expect(component.tentativeList && component.tentativeList[0].tentativePlayers.includes(user?.username ?? "dne")).toBeTruthy();
                expect(component.tentativeList && component.tentativeList[0].isMember).toBeTruthy();
            });
        })

        test('(User is logged in and to be removed) - it should have a confirm dialog pop up to confirm the user action then the call to the clash bot service should be made with the user id.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let user = loggedInMockApplicationDetails.userDetails;
                const mockTentativeDetails: ClashBotTentativeDetails = {
                    serverName: 'Goon Squad',
                    tentativePlayers: ['Sample User', user?.username ?? ""],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    },
                    index: 0,
                    isMember: true
                };
                let updatedTentativeDetails: ClashBotTentativeDetails = copyObject(mockTentativeDetails);
                updatedTentativeDetails.tentativePlayers.pop();

                clashBotServiceMock.postTentativeList.mockReturnValue(cold('x|', {x: updatedTentativeDetails}));

                component.tentativeList = [copyObject(mockTentativeDetails)];
                component.tentativeList.push({
                    serverName: 'Goon Squad',
                    tentativePlayers: ['Sample User'],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '2'
                    },
                    isMember: false
                });

                component.tentativeRegister(mockTentativeDetails);

                flush();

                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledWith(`${user?.id}`, mockTentativeDetails.serverName, mockTentativeDetails.tournamentDetails.tournamentName, mockTentativeDetails.tournamentDetails.tournamentDay);
                expect(component.tentativeList && !component.tentativeList[0].tentativePlayers.includes(user?.username ?? "")).toBeTruthy();
                expect(component.tentativeList && !component.tentativeList[0].isMember).toBeTruthy();
            });
        })

        test('(User is logged in and API call fails) - then a generic message should be shown with a snack bar pop up.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let user = loggedInMockApplicationDetails.userDetails;
                const mockTentativeDetails: ClashBotTentativeDetails = {
                    serverName: 'Goon Squad',
                    tentativePlayers: ['Roidrage', 'Sample User'],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    },
                    index: 0,
                    isMember: true
                };

                const mockedClashBotServiceObs = cold('#', undefined, create400HttpError());

                clashBotServiceMock.postTentativeList.mockReturnValue(mockedClashBotServiceObs);
                component.tentativeRegister(mockTentativeDetails);

                flush()

                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledWith(`${user?.id}`, mockTentativeDetails.serverName, mockTentativeDetails.tournamentDetails.tournamentName, mockTentativeDetails.tournamentDetails.tournamentDay);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops, we were unable to update the tentative list. Please try again later!', 'X', {duration: 5000});
            });
        })

        test('(User is logged in and API times out) - then a generic message should be shown with a snack bar pop up.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;
                let loggedInMockApplicationDetails = setupLoggedInMockApplicationDetails();
                component.currentApplicationDetails = loggedInMockApplicationDetails;
                let user = loggedInMockApplicationDetails.userDetails;
                const mockTentativeDetails: ClashBotTentativeDetails = {
                    serverName: 'Goon Squad',
                    tentativePlayers: ['Roidrage', 'Sample User'],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    },
                    index: 0,
                    isMember: true
                };

                const mockedClashBotServiceObs = cold('7000ms -x|', {x: []});

                clashBotServiceMock.postTentativeList.mockReturnValue(mockedClashBotServiceObs);
                component.tentativeRegister(mockTentativeDetails);

                flush()

                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledWith(`${user?.id}`, mockTentativeDetails.serverName, mockTentativeDetails.tournamentDetails.tournamentName, mockTentativeDetails.tournamentDetails.tournamentDay);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops, we were unable to update the tentative list. Please try again later!', 'X', {duration: 5000});
            });
        })

        test('(User is not logged in) - then a generic message should be shown with a snack bar pop up.', () => {
                component = fixture.componentInstance;
                component.currentApplicationDetails = setupLoggedOutMockApplicationDetails();
                const mockTentativeDetails: ClashBotTentativeDetails = {
                    serverName: 'Goon Squad',
                    tentativePlayers: ['Roidrage', 'Sample User'],
                    tournamentDetails: {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1'
                    },
                    index: 0,
                    isMember: true
                };

                component.tentativeRegister(mockTentativeDetails);

                expect(clashBotServiceMock.postTentativeList).not.toHaveBeenCalled();
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
        })
    })
})

function mockDiscordGuilds(): DiscordGuild[] {
    return [{
        "id": "136278926191362058",
        "name": "Garret's Discord",
        "icon": "17ce03186d96453d4f2b341649b2b7cc",
        "owner": false,
        "permissions": 37215809,
        "features": [],
        "permissions_new": "246997835329"
    }, {
        "id": "434172219472609281",
        "name": "The Other Other Guys",
        "icon": "87580ac4ffcd87347a7e1d566e9285ce",
        "owner": false,
        "permissions": 104324673,
        "features": [],
        "permissions_new": "247064944193"
    }, {
        "id": "837685892885512202",
        "name": "LoL-ClashBotSupport",
        "icon": '123123123',
        "owner": true,
        "permissions": 2147483647,
        "features": [],
        "permissions_new": "274877906943"
    }];
}

function createMockClashTeams(mockClashTournaments: ClashTournaments[], mockUserDetails: UserDetails) {
    return [
        {
            teamName: 'Team Abra',
            serverName: 'Test Server',
            tournamentDetails: {
                tournamentName: mockClashTournaments[0].tournamentName,
                tournamentDay: '2'
            },
            playersDetails: [
                {
                    id: 1,
                    name: 'Roïdräge',
                    champions: ['Volibear', 'Ornn', 'Sett'],
                    role: 'Top',
                    isUser: false
                },
                {
                    id: 4,
                    name: 'Pepe Conrad',
                    champions: ['Lucian'],
                    role: 'Mid',
                    isUser: false
                },
                {
                    id: 3,
                    name: 'Pepe Conrad',
                    champions: ['Lucian'],
                    role: 'Jg',
                    isUser: false
                },
                {
                    id: 2,
                    name: 'TheIncentive',
                    champions: ['Lucian'],
                    role: 'Bot',
                    isUser: false
                },
                {
                    id: 5,
                    name: 'Pepe Conrad',
                    champions: ['Lucian'],
                    role: 'Supp',
                    isUser: false
                }
            ]
        },
        {
            teamName: 'Team Abra',
            serverName: 'Test Server',
            tournamentDetails: {
                tournamentName: mockClashTournaments[0].tournamentName,
                tournamentDay: mockClashTournaments[0].tournamentDay
            },
            playersDetails: [
                {
                    id: mockUserDetails.id,
                    name: mockUserDetails.username,
                    role: 'Top',
                    isUser: true
                },
                {
                    id: 0,
                    name: '',
                    role: 'Mid',
                    isUser: false
                },
                {
                    id: 0,
                    name: '',
                    role: 'Jg',
                    isUser: false
                },
                {
                    id: 0,
                    name: '',
                    role: 'Bot',
                    isUser: false
                },
                {
                    id: 0,
                    name: '',
                    role: 'Supp',
                    isUser: false
                }
            ]
        }
    ];
}

function createMockClashTournaments(expectedTournamentName: string, expectedTournamentDay: string): ClashTournaments[] {
    return [
        {
            tournamentName: expectedTournamentName,
            tournamentDay: expectedTournamentDay,
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: expectedTournamentName,
            tournamentDay: '2',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        }
    ];
}

function mapClashTeams(mockClashTeams: ClashTeam[]) {
    return mockClashTeams.map(record => {
        return {
            teamName: record.teamName,
            serverName: record.serverName,
            playersDetails: record.playersDetails,
            id: `${record.serverName}-${record.teamName}`.replace(new RegExp(/ /, 'g'), '-').toLowerCase(),
            tournamentDetails: record.tournamentDetails
        }
    })
}
