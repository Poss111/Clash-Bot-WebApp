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
import {ColdObservable} from "rxjs/internal/testing/ColdObservable";
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
    create400HttpError,
    createEmptyMockClashTentativeDetails,
    createMockAppDetails,
    createMockClashBotUserDetails, createMockClashTeam, createMockGuilds,
    createMockUserDetails
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

        // @TODO refactor for change to observables
        test('When the filterTeam method is called, it should make a call and retrieve the Teams from the ClashBot Service and if the call times out after 7 seconds the Snack Bar should be called with a generic message..', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                const mockUserDetails: UserDetails = {id: 12321, username: 'Test User', discriminator: '12312asd'};
                setupGuildObservable(cold);

                component = fixture.componentInstance;

                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: 'Test Server',
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top'
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'ADC'
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg'
                            }
                        ]
                    }
                ];

                const userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                const clashTeamsObservable$ = cold('7000ms x|', {x: mockClashTeams});

                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                const expectedSearchPhrase = 'Goon Squad';

                component.filterTeam(expectedSearchPhrase);

                expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});
                expectObservable(clashTeamsObservable$).toBe('7000ms x|', {x: mockClashTeams});

                flush();
                expect(clashBotServiceMock.getClashTeams).toBeCalledWith(expectedSearchPhrase);
                expect(component.showSpinner).toBeFalsy();
                expect(component.teams).toHaveLength(1);
                expect(component.teams).toEqual([{error: "Timeout has occurred"}]);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
            })
        })

        // @TODO refactor for change to observables
        test('Error - getUserDetails - When the filterTeam method is called with invalid User Details, it should not make a call but show a snack bar error immediately that the player needs to login again.', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                const mockUserDetails: UserDetails = {id: 0, username: '', discriminator: '12312asd'};

                component = fixture.componentInstance;

                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: 'Test Server',
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top'
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'ADC'
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg'
                            }
                        ]
                    },

                    {
                        teamName: 'Team Abra',
                        serverName: 'Test Server',
                        playersDetails: [
                            {id: 4, name: mockUserDetails.username, role: 'Top'}
                        ]
                    }
                ];

                const userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                const clashTeamsObservable$ = cold('----x|', {x: mockClashTeams});

                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                const expectedSearchPhrase = 'Goon Squad';

                component.filterTeam(expectedSearchPhrase);

                expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});
                expectObservable(clashTeamsObservable$).toBe('----x|', {x: mockClashTeams});

                flush();
                expect(component.showSpinner).toBeFalsy();
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
                expect(component.teams).toEqual([{error: "No data"}]);
            })
        })
    })

    // @TODO refactor for change to observables
    describe('Register for Team', () => {
        test('When I call register for Team, it should subscribe to retrieve the latest User Details and then invoke a call to Clash Bot service to register a user to the team.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const expectedServer = 'Test Server';
                const mockUserDetails: UserDetails = {id: 12321, username: 'Test User', discriminator: '12312asd'};
                const registerUserRequest: ClashBotUserRegister = {
                    teamName: 'Team Abra',
                    role: 'Top',
                    tournamentDetails: {
                        tournamentName: 'msi2021',
                        tournamentDay: '1'
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
                expect(component.showSpinner).toBeFalsy();

                component.teams = JSON.parse(JSON.stringify(mockClashTeams));

                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                let registerUserForTeamColdObservable = cold('-x|', {x: mockRetrieveUserResponse});
                let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

                clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                component.registerForTeam(registerUserRequest);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.registerUserForTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.registerUserForTeam).toHaveBeenCalledWith(mockUserDetails, registerUserRequest);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
            });
        })

        test('When I call register for Team, it should subscribe to retrieve the latest User Details and if the Users Details are empty then it should show a snackbar error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;

                component = fixture.componentInstance;

                const mockUserDetails: UserDetails = {id: 0, username: '', discriminator: '12312asd'};
                const mockRetrieveUserResponse: ClashTeam = {teamName: 'Team Awesome'};

                component.teams = [{teamName: 'Team Awesome', playersDetails: []}]

                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                let registerUserForTeamColdObservable = cold('-x|', {x: mockRetrieveUserResponse})

                clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

                component.registerForTeam(mockRetrieveUserResponse);

                flush();

                expect(component.teams).toEqual([{
                    teamName: 'Team Awesome',
                    playersDetails: []
                }]);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
            });
        })

        test('When I call register for Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                component = fixture.componentInstance;

                const mockUserDetails: UserDetails = {id: 12321, username: 'Test User', discriminator: '12312asd'};
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
                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
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

        test('When I call register for Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an timeout.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;

                component = fixture.componentInstance;

                const mockUserDetails: UserDetails = {id: 12321, username: 'Test User', discriminator: '12312asd'};
                const mockRetrieveUserResponse: ClashTeam = {teamName: 'Team Awesome'};

                component.teams = [{teamName: 'Team Awesome', playersDetails: []}];

                let registerUserForTeamColdObservable = cold('7000ms -x|', {x: mockUserDetails});

                clashBotServiceMock.registerUserForTeam.mockReturnValue(registerUserForTeamColdObservable);

                component.registerForTeam(mockRetrieveUserResponse);

                flush();

                expect(component.teams).toEqual([{teamName: 'Team Awesome', playersDetails: []}]);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your registration timed out, please try again!', 'X', {duration: 5000});
            });
        })

    })

    // @TODO refactor for change to observables
    describe('Unregister from Team', () => {
        test('When I call unregister from Team, it should subscribe to retrieve the latest User Details and then invoke a call to Clash Bot service to unregister a user from team.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const expectedServer = 'Test Server';
                const mockUserDetails: UserDetails = {id: 12321, username: 'Test User', discriminator: '12312asd'};

                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: expectedServer,
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top'
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'ADC'
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg'
                            },
                            {
                                id: 4,
                                name: mockUserDetails.username,
                                role: 'Supp'
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
                let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
                expectedMockClashTeamResponse[0].playersDetails.pop();
                let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

                component = fixture.componentInstance;
                expect(component.showSpinner).toBeFalsy();
                component.teams = JSON.parse(JSON.stringify(mockClashTeams));

                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                let unregisterUserFromTeamColdObservable = cold('-x|', {x: mockUnregisterFromTeamResponse});
                let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

                clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                component.unregisterFromTeam(mockTeamToUnregisterFrom);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledWith(mockUserDetails, mockTeamToUnregisterFrom);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
            });
        })

        test('Error - Missing User Details - When I call unregister from Team, it should subscribe to retrieve the latest User Details and if the Users Details are empty then it should show a snackbar error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;

                const expectedServer = 'Test Server';
                const mockUserDetails: UserDetails = {id: 0, username: '', discriminator: '12312asd'};

                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: expectedServer,
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top'
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'ADC'
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg'
                            },
                            {
                                id: 4,
                                name: mockUserDetails.username,
                                role: 'Supp'
                            }
                        ]
                    }
                ];

                let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
                let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
                let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

                component = fixture.componentInstance;

                expect(component.showSpinner).toBeFalsy();

                component.teams = JSON.parse(JSON.stringify(mockClashTeams));

                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                let unregisterUserFromTeamColdObservable = cold('-x|', {x: mockUnregisterFromTeamResponse});
                let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

                clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                component.unregisterFromTeam(mockTeamToUnregisterFrom);

                flush();

                expect(component.teams).toEqual([{error: 'No data'}]);
                expect(clashBotServiceMock.unregisterUserFromTeam).not.toHaveBeenCalled();
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! You are not logged in, please navigate to the Welcome page and login.', 'X', {duration: 5000});
            })
        })

        test('Error - Unregister Failed - When I call unregister from Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an error.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const expectedServer = 'Test Server';
                const mockUserDetails: UserDetails = {id: 12321, username: 'Test User', discriminator: '12312asd'};
                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: expectedServer,
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top'
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'ADC'
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg'
                            },
                            {
                                id: 4,
                                name: mockUserDetails.username,
                                role: 'Supp'
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
                let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
                expectedMockClashTeamResponse[0].playersDetails.pop();

                component = fixture.componentInstance;

                expect(component.showSpinner).toBeFalsy();

                component.teams = JSON.parse(JSON.stringify(mockClashTeams));

                const expectedError =
                    new HttpErrorResponse({
                        error: 'Failed to make call.',
                        headers: undefined,
                        status: 400,
                        statusText: 'Bad Request',
                        url: 'https://localhost.com/api/teams/unregister'
                    });
                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                let unregisterUserFromTeamColdObservable = cold('-#', undefined, expectedError);
                let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

                clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                component.unregisterFromTeam(mockTeamToUnregisterFrom);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledWith(mockUserDetails, mockTeamToUnregisterFrom);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Failed to unregister you from the Team.', 'X', {duration: 5000});
            });
        })

        test('Error - Timeout for Unregister - When I call unregister from Team, it should subscribe to retrieve the latest User Details and should invoke the Snack Bar if there is an timeout.', () => {
            testScheduler.run((helpers) => {
                const {cold, flush} = helpers;
                const expectedServer = 'Test Server';
                const mockUserDetails: UserDetails = {id: 12321, username: 'Test User', discriminator: '12312asd'};
                let mockClashTeams: ClashTeam[] = [
                    {
                        teamName: 'Team Abra',
                        serverName: expectedServer,
                        playersDetails: [
                            {
                                id: 1,
                                name: 'Roïdräge',
                                champions: ['Volibear', 'Ornn', 'Sett'],
                                role: 'Top'
                            },
                            {
                                id: 2,
                                name: 'TheIncentive',
                                champions: ['Lucian'],
                                role: 'ADC'
                            },
                            {
                                id: 3,
                                name: 'Pepe Conrad',
                                champions: ['Lucian'],
                                role: 'Jg'
                            },
                            {
                                id: 4,
                                name: mockUserDetails.username,
                                role: 'Supp'
                            }
                        ]
                    }
                ];
                let expectedMockClashTeamResponse = JSON.parse(JSON.stringify(mockClashTeams));
                let mockTeamToUnregisterFrom = JSON.parse(JSON.stringify(expectedMockClashTeamResponse[0]));
                expectedMockClashTeamResponse[0].playersDetails.pop();
                let mockUnregisterFromTeamResponse = {message: 'Successfully unregistered User from Team.'};

                component = fixture.componentInstance;
                expect(component.showSpinner).toBeFalsy();
                component.teams = JSON.parse(JSON.stringify(mockClashTeams));

                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                let unregisterUserFromTeamColdObservable = cold('7000ms x|', {x: mockUnregisterFromTeamResponse});
                let clashTeamsObservable$ = cold('x|', {x: expectedMockClashTeamResponse});

                clashBotServiceMock.unregisterUserFromTeam.mockReturnValue(unregisterUserFromTeamColdObservable);
                clashBotServiceMock.getClashTeams.mockReturnValue(clashTeamsObservable$);

                component.unregisterFromTeam(mockTeamToUnregisterFrom);

                flush();

                expect(component.teams).toEqual(mockClashTeams);
                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.unregisterUserFromTeam).toHaveBeenCalledWith(mockUserDetails, mockTeamToUnregisterFrom);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops! Your request timed out, please try again!', 'X', {duration: 5000});
            });
        })
    })

    // @TODO refactor for change to observables
    describe('Error Handlers', () => {
        test('If getClashTeams service returns and error then a Mat Snack Bar should be opened and an error should be returned.', () => {
            component = fixture.componentInstance;
            const expectedError =
                new HttpErrorResponse({
                    error: 'Failed to make call.',
                    headers: undefined,
                    status: 400,
                    statusText: 'Bad Request',
                    url: 'https://clash-bot.ninja/api/teams'
                });
            testScheduler.run((helpers) => {
                const {expectObservable} = helpers;
                expectObservable(component.handleClashTeamsError(snackBarMock, expectedError)).toBe('#', undefined, expectedError);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Failed to retrieve Teams. Please try again later.', 'X', {duration: 5000});
            })
        })
    })

    // @TODO refactor for change to observables
    describe('Create New Team', () => {
        test('When createNewTeam is called with a MatOption, then a call to the create new team ' +
            'Clash Bot Service endpoint should be made with the details necessary to create a new team.', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;

                let mockUserDetails: UserDetails = {id: 12321312, username: 'Test User', discriminator: '12312asdawe'};
                const expectedServerName = 'Integration Server';
                const expectedRole = 'Top';
                let mockEligibleTournaments = [{
                    tournamentName: 'awesome_sauce',
                    tournamentDay: '1',
                    registrationTime: new Date().toISOString(),
                    startTime: new Date().toISOString()
                }];
                let mockReturnedUpdatedTeamsList: ClashTeam[] = [
                    {
                        teamName: 'Team Testing',
                        serverName: expectedServerName,
                        tournamentDetails: {tournamentName: '', tournamentDay: ''},
                        startTime: '',
                        playersDetails: [{
                            id: 1, name: mockUserDetails.username, role: 'Top'
                        }]
                    }
                ];
                let mockCreateNewTeamReturn: ClashTeam = {
                    teamName: 'Team Testing',
                    serverName: expectedServerName,
                    tournamentDetails: {tournamentName: '', tournamentDay: ''},
                    startTime: '',
                    playersDetails: [{
                        id: mockUserDetails.id,
                        name: mockUserDetails.username,
                        role: expectedRole,
                        isUser: true
                    }]
                };

                component = fixture.componentInstance;
                component.eligibleTournaments = JSON.parse(JSON.stringify(mockEligibleTournaments));

                let userDetailsColdObservable = cold('-x|', {x: mockUserDetails});
                let getTeamsColdObservable = cold('-x|', {x: mockReturnedUpdatedTeamsList});
                let createTeamColdObservable = cold('-x|', {x: mockCreateNewTeamReturn});

                clashBotServiceMock.getClashTeams.mockReturnValue(getTeamsColdObservable);
                clashBotServiceMock.createNewTeam.mockReturnValue(getTeamsColdObservable);

                expectObservable(userDetailsColdObservable).toBe('-x|', {x: mockUserDetails});
                expectObservable(getTeamsColdObservable).toBe('-x|', {x: mockReturnedUpdatedTeamsList});
                expectObservable(createTeamColdObservable).toBe('-x|', {x: mockCreateNewTeamReturn});

                component.createNewTeam({role: "", tournamentDay: "", tournamentName: ""});

                flush();

                expect(clashBotServiceMock.getClashTeams).not.toHaveBeenCalled();
            })
        })
    })

    // @TODO refactor for change to observables
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

    // @TODO refactor for change to observables
    describe('Sync Team Details', () => {
        test('When a Team list and a list of Tournaments are passed to syncTeamDetails, it should ' +
            'populate the eligible Tournaments list and add the detail if the Player is on the Team.', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                component = fixture.componentInstance;
                let mockTournaments: ClashTournaments[] = [
                    {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1',
                        startTime: new Date().toISOString(),
                        registrationTime: new Date().toISOString()
                    },
                    {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '2',
                        startTime: new Date().toISOString(),
                        registrationTime: new Date().toISOString()
                    },
                ]
                let mockUserDetails: UserDetails = {id: 123321, username: 'Hi', discriminator: '123123jsaf'};
                let mockTeamData: ClashTeam[] = [
                    {
                        teamName: 'Test Team 1',
                        serverName: 'Integration Server',
                        tournamentDetails: {
                            tournamentName: mockTournaments[0].tournamentName,
                            tournamentDay: mockTournaments[0].tournamentDay
                        },
                        playersDetails: [
                            {
                                id: mockUserDetails.id,
                                name: mockUserDetails.username,
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
                        teamName: 'Test Team 1',
                        serverName: 'Integration Server',
                        tournamentDetails: {
                            tournamentName: mockTournaments[1].tournamentName,
                            tournamentDay: mockTournaments[1].tournamentDay
                        },
                        playersDetails: [
                            {
                                id: mockUserDetails.id,
                                name: mockUserDetails.username,
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
                let mockApplicationDetails: ApplicationDetails = {currentTournaments: mockTournaments}
                let mockApplicationDetailsObservable = cold('-x|', {x: mockApplicationDetails});

                let expectedTeamData = mockTeamData.map(record => {
                    if (record.playersDetails) {
                        record.playersDetails.forEach(player => player.isUser = player.name === mockUserDetails.username);
                    }
                    return record;
                });

                applicationDetailsMock.getApplicationDetails.mockReturnValue(mockApplicationDetailsObservable);

                expectObservable(mockApplicationDetailsObservable).toBe('-x|', {x: mockApplicationDetails});
                component.syncTeamInformation(mockTeamData);

                flush();
                expect(component.teams).toEqual(expectedTeamData);
                expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
                expect(component.eligibleTournaments).toEqual([mockTournaments[1]]);
            });
        })

        test('When a Team list and an empty list of Tournaments are passed to syncTeamDetails, it should have an empty eligible tournaments list.', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                component = fixture.componentInstance;
                let mockTournaments: ClashTournaments[] = [];
                let mockUserDetails: UserDetails = {id: 123321, username: 'Hi', discriminator: '123123jsaf'};
                let mockTeamData: ClashTeam[] = [
                    {
                        teamName: 'Test Team 1',
                        serverName: 'Integration Server',
                        tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '1'},
                        playersDetails: [{id: 1, name: mockUserDetails.username, role: 'Top'}],
                        startTime: new Date().toISOString()
                    },
                    {
                        teamName: 'Test Team 1',
                        serverName: 'Integration Server',
                        tournamentDetails: {tournamentName: 'awesome_sauce', tournamentDay: '2'},
                        playersDetails: [{id: 1, name: mockUserDetails.username, role: 'Top'}, {
                            id: 2,
                            name: 'Test User 2',
                            role: 'Mid'
                        }],
                        startTime: new Date().toISOString()
                    }
                ];
                let mockApplicationDetails: ApplicationDetails = {currentTournaments: mockTournaments}
                let mockApplicationDetailsObservable = cold('-x|', {x: mockApplicationDetails});

                let expectedTeamData = mockTeamData.map(record => {
                    if (record.playersDetails) {
                        record.playersDetails.forEach(player => player.isUser = player.name === mockUserDetails.username);
                    }
                    return record;
                });

                applicationDetailsMock.getApplicationDetails.mockReturnValue(mockApplicationDetailsObservable);

                expectObservable(mockApplicationDetailsObservable).toBe('-x|', {x: mockApplicationDetails});
                component.syncTeamInformation(mockTeamData);

                flush();
                expect(component.teams).toEqual(expectedTeamData);
                expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
                expect(component.eligibleTournaments).toEqual([]);
            });
        })

        test('When an empty Team list is passed, it should populate the teams list with an error of No data', () => {
            testScheduler.run((helpers) => {
                const {cold, expectObservable, flush} = helpers;
                component = fixture.componentInstance;
                let mockTournaments: ClashTournaments[] = [
                    {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '1',
                        startTime: new Date().toISOString(),
                        registrationTime: new Date().toISOString()
                    },
                    {
                        tournamentName: 'awesome_sauce',
                        tournamentDay: '2',
                        startTime: new Date().toISOString(),
                        registrationTime: new Date().toISOString()
                    },
                ]

                let mockApplicationDetails: ApplicationDetails = {currentTournaments: mockTournaments}
                let mockApplicationDetailsObservable = cold('-x|', {x: mockApplicationDetails});

                applicationDetailsMock.getApplicationDetails.mockReturnValue(mockApplicationDetailsObservable);

                expectObservable(mockApplicationDetailsObservable).toBe('-x|', {x: mockApplicationDetails});

                component.syncTeamInformation([]);

                flush();
                expect(component.teams).toEqual([{error: 'No data'}]);
                expect(applicationDetailsMock.getApplicationDetails).toBeCalledTimes(1);
                expect(component.eligibleTournaments).toEqual(mockTournaments);
            });
        })
    })

    // @TODO refactor for change to observables
    describe('Update Tentative List Details', () => {
        test('If updateTentativeList is called with a serverName, it will populate the tentativeList with the tentiveList details for the server.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                const expectedGuildName = 'LoL-ClashBotSupport';
                const mockUserDetails: UserDetails = {id: 1, username: 'Sample User', discriminator: '12312'};
                const mockClashTentativeDetails: ClashBotTentativeDetails[] = [{
                    "serverName": expectedGuildName,
                    "tournamentDetails": {"tournamentName": "awesome_sauce", "tournamentDay": "2"},
                    "tentativePlayers": ["Sample User"]
                }, {
                    "serverName": expectedGuildName,
                    "tournamentDetails": {"tournamentName": "awesome_sauce", "tournamentDay": "3"},
                    "tentativePlayers": []
                }, {
                    "serverName": expectedGuildName,
                    "tournamentDetails": {"tournamentName": "awesome_sauce", "tournamentDay": "4"},
                    "tentativePlayers": []
                }];

                const mockTentativeDetailsObs = cold('x|', {x: JSON.parse(JSON.stringify(mockClashTentativeDetails))});

                clashBotServiceMock.getServerTentativeList.mockReturnValue(mockTentativeDetailsObs);

                component = fixture.componentInstance;
                component.updateTentativeList(expectedGuildName);

                mockClashTentativeDetails[0].isMember = true;
                mockClashTentativeDetails[1].isMember = false;
                mockClashTentativeDetails[2].isMember = false;

                expect(component.tentativeDataStatus).toEqual('LOADING');
                flush();

                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.getServerTentativeList).toHaveBeenCalledWith(expectedGuildName);
                expect(component.tentativeList).toEqual(mockClashTentativeDetails);
                expect(component.tentativeDataStatus).toEqual('SUCCESSFUL');
            })
        })

        test('ERROR - call fails - If the updateTentativeList call fails, it should invoke a snack bar with a generic error message.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                const expectedGuildName = 'LoL-ClashBotSupport';

                const expectedError =
                    new HttpErrorResponse({
                        error: 'Failed to make call.',
                        headers: undefined,
                        status: 400,
                        statusText: 'Bad Request',
                        url: 'https://localhost/api/tentative'
                    });
                const mockUserDetails: UserDetails = {id: 1, username: 'Sample User', discriminator: '12312'};

                const mockTentativeDetailsObs = cold('#', undefined, expectedError);

                clashBotServiceMock.getServerTentativeList.mockReturnValue(mockTentativeDetailsObs);

                component = fixture.componentInstance;
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

        test('ERROR - Timeout - If the updateTentativeList call timesout, it should invoke a snack bar with a generic error message.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                const expectedGuildName = 'LoL-ClashBotSupport';
                const mockUserDetails: UserDetails = {id: 1, username: 'Sample User', discriminator: '12312'};

                const mockTentativeDetailsObs = cold('7000ms x|', {x: []});

                clashBotServiceMock.getServerTentativeList.mockReturnValue(mockTentativeDetailsObs);

                component = fixture.componentInstance;
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
    })

    // @TODO refactor for change to observables
    describe('Tentative register/unregister', () => {
        test('When tentativeRegister is called with add, it should call to the clash bot service should be made with the user id.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
                const mockUserDetails: UserDetails = {id: 1, username: 'Sample User', discriminator: '12312'};
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

                let updatedTentativeDetails: ClashBotTentativeDetails = JSON.parse(JSON.stringify(mockTentativeDetails));
                updatedTentativeDetails.tentativePlayers.push(mockUserDetails.username);
                const mockedClashBotServiceObs = cold('x|', {x: updatedTentativeDetails});

                clashBotServiceMock.postTentativeList.mockReturnValue(mockedClashBotServiceObs);

                component = fixture.componentInstance;

                component.tentativeList = [JSON.parse(JSON.stringify(mockTentativeDetails))];
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
                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledWith(`${mockUserDetails.id}`, mockTentativeDetails.serverName, mockTentativeDetails.tournamentDetails.tournamentName, mockTentativeDetails.tournamentDetails.tournamentDay);
                expect(component.tentativeList && component.tentativeList[0].tentativePlayers.includes('Sample User')).toBeTruthy();
                expect(component.tentativeList && component.tentativeList[0].isMember).toBeTruthy();
            });
        })

        test('When tentativeRegister is called with remove, it should have a confirm dialog pop up to confirm the user action then the call to the clash bot service should be made with the user id.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
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
                let updatedTentativeDetails: ClashBotTentativeDetails = JSON.parse(JSON.stringify(mockTentativeDetails));
                updatedTentativeDetails.tentativePlayers.pop();
                const mockUserDetails: UserDetails = {id: 1, username: 'Sample User', discriminator: '12312'};
                const mockUserDetailsObs = cold('x|', {x: mockUserDetails});
                const mockedClashBotServiceObs = cold('x|', {x: updatedTentativeDetails});

                clashBotServiceMock.postTentativeList.mockReturnValue(mockedClashBotServiceObs);

                component = fixture.componentInstance;

                component.tentativeList = [JSON.parse(JSON.stringify(mockTentativeDetails))];
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
                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledWith(`${mockUserDetails.id}`, mockTentativeDetails.serverName, mockTentativeDetails.tournamentDetails.tournamentName, mockTentativeDetails.tournamentDetails.tournamentDay);
                expect(component.tentativeList && !component.tentativeList[0].tentativePlayers.includes('Sample User')).toBeTruthy();
                expect(component.tentativeList && !component.tentativeList[0].isMember).toBeTruthy();
            });
        })

        test('ERROR - Failed to make call to Clash Bot Service - If the call fails when trying to update the tentative list, then a generic message should be shown with a snack bar pop up.', () => {
            testScheduler.run(helpers => {
                const {cold, flush} = helpers;
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

                const expectedError =
                    new HttpErrorResponse({
                        error: 'Failed to make call.',
                        headers: undefined,
                        status: 400,
                        statusText: 'Bad Request',
                        url: 'https://localhost/api/tentative'
                    });
                const mockUserDetails: UserDetails = {id: 1, username: 'Sample User', discriminator: '12312'};

                const mockedClashBotServiceObs = cold('#', undefined, expectedError);

                clashBotServiceMock.postTentativeList.mockReturnValue(mockedClashBotServiceObs);
                component = fixture.componentInstance;
                component.tentativeRegister(mockTentativeDetails);

                flush()

                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledTimes(1);
                expect(clashBotServiceMock.postTentativeList).toHaveBeenCalledWith(`${mockUserDetails.id}`, mockTentativeDetails.serverName, mockTentativeDetails.tournamentDetails.tournamentName, mockTentativeDetails.tournamentDetails.tournamentDay);
                expect(snackBarMock.open).toHaveBeenCalledTimes(1);
                expect(snackBarMock.open).toHaveBeenCalledWith('Oops, we were unable to update the tentative list. Please try again later!', 'X', {duration: 5000});
            });
        })
    });
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

function setupGuildObservable<T>(cold: <T = string>(marbles: string, values?: { [p: string]: T }, error?: any) => ColdObservable<T>) {
    let mockObservableGuilds = [{
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
        "icon": null,
        "owner": true,
        "permissions": 2147483647,
        "features": [],
        "permissions_new": "274877906943"
    }];
    const guildObservable$ = cold('x|', {x: mockObservableGuilds});
    // discordServiceMock.getGuilds.mockReturnValue(guildObservable$);
    return {mockObservableGuilds, guildObservable$};
}
