import {TestBed} from '@angular/core/testing';
import {ClashBotService} from './clash-bot.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {UserDetails} from "../interfaces/user-details";
import {ClashTeam} from "../interfaces/clash-team";
import {ClashBotGenericResponse} from "../interfaces/clash-bot-generic-response";
import {ClashBotUserDetails} from "../interfaces/clash-bot-user-details";
import {ClashBotTentativeDetails} from "../interfaces/clash-bot-tentative-details";
import {ClashBotTentativeRequest} from "../interfaces/clash-bot-tentative-request";
import {ClashBotUserRegister} from "../interfaces/clash-bot-user-register";

describe('ClashBotService', () => {
  let service: ClashBotService;
  let httpMock: HttpTestingController;

  function stubLocation(location: any) {
    jest.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      ...location,
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClashBotService]
    });
    service = TestBed.inject(ClashBotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  })

  test('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('GET Clash Teams', () => {
    test('When I call to retrieve Clash Teams, and retrieve Observable<ClashTeam[]>', () => {
      stubLocation({hostname: "localhost"});
      const mockResponse = [
        {
          teamName: 'Team Abra',
          playersDetails: [
            {
              name: 'Roïdräge',
              champions: ['Volibear', 'Ornn', 'Sett'],
              role: 'Top'
            },
            {
              name: 'TheIncentive',
              champions: ['Lucian'],
              role: 'ADC'
            },
            {
              name: 'Pepe Conrad',
              champions: ['Lucian'],
              role: 'Jg'
            }
          ]
        }
      ];
      let serverName = 'Goon Squad';
      service.getClashTeams(serverName).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual([
          {
            teamName: 'Team Abra',
            playersDetails: [
              {
                name: 'Roïdräge',
                champions: ['Volibear', 'Ornn', 'Sett'],
                role: 'Top'
              },
              {
                name: 'TheIncentive',
                champions: ['Lucian'],
                role: 'ADC'
              },
              {
                name: 'Pepe Conrad',
                champions: ['Lucian'],
                role: 'Jg'
              }
            ]
          }
        ])
      });
      const req = httpMock.expectOne(`/api/v2/teams/${serverName}`);
      req.flush(mockResponse);
    })
  })

  describe('GET Clash Tournaments', () => {
    test('When I retrieve Clash Tournaments and I am not in dev mode, I should use prod and be returned a Observable<ClashTeam[]>', () => {
      stubLocation({hostname: "clash-bot.ninja"});
      const mockResponse = [
        {
          "tournamentName": "bandle_city",
          "tournamentDay": "3",
          "startTime": "August 21 2021 07:00 pm PDT",
          "registrationTime": "August 21 2021 04:15 pm PDT"
        },
        {
          "tournamentName": "bandle_city",
          "tournamentDay": "4",
          "startTime": "August 22 2021 07:00 pm PDT",
          "registrationTime": "August 22 2021 04:15 pm PDT"
        }
      ];
      service.getClashTournaments().subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`/api/tournaments`);
      req.flush(mockResponse);
    })
  })

  describe('POST Clash Create New Team', () => {
    test('When I request to create a new Team, I should use the window host and be returned Observable<ClashTeam>', () => {
      stubLocation({hostname: "clashbot.ninja"});
      const mockResponse: ClashBotGenericResponse = {
        registeredTeam: {
          teamName: 'Team Abra',
          serverName: 'Integration Server',
          tournamentDetails: {
            tournamentDay: 'awesome_sauce',
            tournamentName: '1',
          },
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
        unregisteredTeams: []
      };
      const teamRequest: ClashTeam = mockResponse.registeredTeam;
      const userDetail: UserDetails = {
        id: 1234,
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedRole = 'Top';
      const expectedPayload = {
        id: userDetail.id,
        role: expectedRole,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.createNewTeam(userDetail, teamRequest, expectedRole).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`/api/v2/team`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })
  })

  describe('POST Register to Clash Team', () => {
    test('When I request to register a player to a Clash Tournament from a host that is not localhost, I should hit the service from the current host and be returned a payload of Observable<ClashTeam>', () => {
      stubLocation({hostname: "clash-bot"});
      const mockResponse: ClashBotGenericResponse = {
          registeredTeam: {
            teamName: 'Team Abra',
            serverName: 'Integration Server',
            tournamentDetails: {
              tournamentDay: 'awesome_sauce',
              tournamentName: '1',
            },
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
          unregisteredTeams: []
        }
      ;
      const expectedRole = 'Top';
      let teamRequest: ClashBotUserRegister = {
        teamName: 'Team Abra',
        role: expectedRole,
        tournamentDetails: {},
        serverName: 'Integration Server'
      };
      const userDetail: UserDetails = {
        id: 1234,
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedPayload = {
        id: userDetail.id,
        role: expectedRole,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.registerUserForTeam(userDetail, teamRequest).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`/api/v2/team/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })
  })

  describe('DELETE Unregister from Clash Team', () => {
    test('When I request to unregister form a Team, I should make a call to the Clash Bot register controller with method DELETE and be returned Observable<ClashBotGenericResponse>', () => {
      stubLocation({hostname: "clash-bot.ninja"});
      const teamRequest: ClashTeam =
        {
          teamName: 'Team Abra',
          serverName: 'Integration Server',
          tournamentDetails: {
            tournamentDay: 'awesome_sauce',
            tournamentName: '1',
          },
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
        };
      const mockResponse: ClashBotGenericResponse = {
        registeredTeam: {},
        unregisteredTeams: [teamRequest]
      };
      const userDetail: UserDetails = {
        id: 1234,
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedPayload = {
        id: userDetail.id,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.unregisterUserFromTeam(userDetail, teamRequest).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`/api/v2/team/register`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })
  })

  describe('GET Clash Bot User Information', () => {
    test('When I request for user information, I should respond with an Observable<ClashBotUserDetails>', (done) => {
      stubLocation({hostname: "clash-bot.ninja"});
      const expectedUserDetails: ClashBotUserDetails = {
        id: 12345566,
        username: 'Some Player',
        serverName: 'Some Guild',
        preferredChampions: [],
        subscriptions: {'UpcomingClashTournamentDiscordDM': true}
      };

      service.getUserDetails(expectedUserDetails.id).subscribe((data) => {
        expect(data).toEqual(expectedUserDetails);
        done();
      })
      const req = httpMock.expectOne(`/api/user?id=${expectedUserDetails.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(expectedUserDetails);
    })
  })

  describe('POST Clash Bot User Information', () => {
    test('When I request to persist data of the User t, I should be returned an Observable<ClashBotUser>', () => {
      stubLocation({hostname: "clash-bot.ninja"});
      let payload = {
        id: 1234556778,
        playerName: 'Some Player',
        serverName: 'Some Server',
        preferredChampions: ['Sett'],
        subscriptions: {'UpcomingClashTournamentDiscordDM': 'true'}
      };
      const set = new Set<string>();
      set.add('Sett');
      service.postUserDetails(payload.id, payload.serverName, set, payload.subscriptions, payload.playerName).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(payload);
      });
      const req = httpMock.expectOne(`/api/user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(payload);
    })
  })

  describe('GET Clash Bot Tentative List', () => {
    test('When I call to retrieve the Tentative list from Clash Bot, I should call and be returned a Observable<ClashBotTentativeDetails[]>', (done) => {
      stubLocation({hostname: "clash-bot.ninja"});
      const expectedClashBotTentativeDetails: ClashBotTentativeDetails[] = [{
        serverName: 'Some Guild',
        tentativePlayers: ['Roidrage'],
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '1'
        }
      }];


      service.getServerTentativeList(expectedClashBotTentativeDetails[0].serverName)
        .subscribe((response) => {
          expect(response).toEqual(expectedClashBotTentativeDetails);
          done();
        });

      const req = httpMock.expectOne(`/api/tentative?serverName=Some%20Guild`);
      expect(req.request.method).toBe('GET');
      req.flush(expectedClashBotTentativeDetails);
    })
  })

  describe('POST Clash Bot Tentative List', () => {

    test('When I call to update user in Tentative list from Clash Bot with user id, serverName, tournament details, and server, I should call and be returned an Observable<ClashBotTentativeDetails>', (done) => {
      stubLocation({hostname: "clash-bot.ninja"});
      const expectedUserId = '1';
      const expectedServerName = 'Goon Squad';
      const expectedTournamentName = 'awesome_sauce';
      const expectedTournamentDay = '2';
      const expectedClashBotTentativeDetails: ClashBotTentativeDetails = {
        serverName: 'Some Guild',
        tentativePlayers: ['Roidrage'],
        tournamentDetails: {
          tournamentName: 'awesome_sauce',
          tournamentDay: '2'
        }
      };
      const expectedPayload: ClashBotTentativeRequest = {
        id: expectedUserId,
        serverName: expectedServerName,
        tournamentDetails: {
          tournamentName: expectedTournamentName,
          tournamentDay: expectedTournamentDay
        }
      }

      service.postTentativeList(expectedUserId, expectedServerName, expectedTournamentName, expectedTournamentDay)
        .subscribe((data) => {
          expect(data).toEqual(expectedClashBotTentativeDetails);
          done();
        });

      const req = httpMock.expectOne(`/api/v2/tentative`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(expectedClashBotTentativeDetails);
    })
  })

});
