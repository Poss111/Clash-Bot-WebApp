import {TestBed} from '@angular/core/testing';
import {ClashBotService} from './clash-bot.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {UserDetails} from "./user-details";
import {ClashTeam} from "./clash-team";
import {ClashBotGenericResponse} from "./clash-bot-generic-response";
import {ClashBotUserDetails} from "./clash-bot-user-details";

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
    test('When I call to retrieve Clash Teams from local host, I should use localhost with port 80 and retrieve Observable<ClashTeam[]>', () => {
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
      const req = httpMock.expectOne(`http://localhost:80/api/teams/${serverName}`);
      req.flush(mockResponse);
    })

    test('When I call to retrieve Clash Teams from local host, I should use localhost with port 80 and retrieve Observable<ClashTeam[]>', () => {
      stubLocation({hostname: "clash-bot.ninja"});
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
      const req = httpMock.expectOne(`/api/teams/${serverName}`);
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

    test('When I retrieve Clash Tournaments, I should use localhost with port 80 and be returned a Observable<ClashTeam[]>', () => {
      stubLocation({hostname: "localhost"});
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
      const req = httpMock.expectOne(`http://localhost:80/api/tournaments`);
      req.flush(mockResponse);
    })

  })

  describe('POST Clash Create New Team - \\api\\team', () => {
    test('When I request to create a new Team from localhost, I should use localhost with port 80 and be returned Observable<ClashTeam>', () => {
      stubLocation({hostname: "localhost"});
      const mockResponse: ClashTeam =
          {
            teamName: 'Team Abra',
            serverName: 'Integration Server',
            tournamentDetails: {
              tournamentDay: 'awesome_sauce',
              tournamentName: '1',
            },
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
          };
      const teamRequest: ClashTeam = mockResponse;
      const userDetail: UserDetails = {
        id: '1234',
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedPayload = {
        id: userDetail.id,
        username: userDetail.username,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.createNewTeam(userDetail, teamRequest).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`http://localhost:80/api/team`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })

    test('When I request to create a new Team, I should use the window host and be returned Observable<ClashTeam>', () => {
      stubLocation({hostname: "clashbot.ninja"});
      const mockResponse: ClashTeam =
          {
              teamName: 'Team Abra',
              serverName: 'Integration Server',
              tournamentDetails: {
                  tournamentDay: 'awesome_sauce',
                  tournamentName: '1',
              },
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
          };
      const teamRequest: ClashTeam = mockResponse;
      const userDetail: UserDetails = {
          id: '1234',
          username: 'Test User',
          discriminator: ';lkj213412'
      };
      const expectedPayload = {
          id: userDetail.id,
          username: userDetail.username,
          teamName: teamRequest.teamName,
          serverName: teamRequest.serverName,
          tournamentName: teamRequest.tournamentDetails?.tournamentName,
          tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.createNewTeam(userDetail, teamRequest).subscribe(data => {
          expect(data).toBeTruthy();
          expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`/api/team`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })
  })

  describe('Method POST Register to Clash Team', () => {
    test('When I request to register a player to a Clash Tournament from localhost, I should use localhost with port 80 and be returned a payload of Observable<ClashTeam>', () => {
      stubLocation({hostname: "localhost"});
      const mockResponse: ClashTeam =
        {
          teamName: 'Team Abra',
          serverName: 'Integration Server',
          tournamentDetails: {
            tournamentDay: 'awesome_sauce',
            tournamentName: '1',
          },
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
        };
      const teamRequest: ClashTeam = mockResponse;
      const userDetail: UserDetails = {
        id: '1234',
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedPayload = {
        id: userDetail.id,
        username: userDetail.username,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.registerUserForTeam(userDetail, teamRequest).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`http://localhost:80/api/team/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })

    test('When I request to register a player to a Clash Tournament from a host that is not localhost, I should hit the service from the current host and be returned a payload of Observable<ClashTeam>', () => {
      stubLocation({hostname: "clash-bot"});
      const mockResponse: ClashTeam =
        {
          teamName: 'Team Abra',
          serverName: 'Integration Server',
          tournamentDetails: {
            tournamentDay: 'awesome_sauce',
            tournamentName: '1',
          },
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
        };
      const teamRequest: ClashTeam = mockResponse;
      const userDetail: UserDetails = {
        id: '1234',
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedPayload = {
        id: userDetail.id,
        username: userDetail.username,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.registerUserForTeam(userDetail, teamRequest).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`/api/team/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })
  })

  describe('Method DELETE Unregister from Clash Team', () => {
    test('When I request to unregister form a Team and from localhost, I should make a call to the Clash Bot register controller localhost with port 80 with method DELETE and be returned Observable<ClashBotGenericResponse>',() => {
      stubLocation({hostname: "localhost"});
      const mockResponse: ClashBotGenericResponse = {message: 'Successfully unregister User from team' };
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
        };
      const userDetail: UserDetails = {
        id: '1234',
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedPayload = {
        id: userDetail.id,
        username: userDetail.username,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.unregisterUserFromTeam(userDetail, teamRequest).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`http://localhost:80/api/team/register`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })

    test('When I request to unregister form a Team, I should make a call to the Clash Bot register controller with method DELETE and be returned Observable<ClashBotGenericResponse>',() => {
      stubLocation({hostname: "clash-bot.ninja"});
      const mockResponse: ClashBotGenericResponse = {message: 'Successfully unregister User from team' };
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
        };
      const userDetail: UserDetails = {
        id: '1234',
        username: 'Test User',
        discriminator: ';lkj213412'
      };
      const expectedPayload = {
        id: userDetail.id,
        username: userDetail.username,
        teamName: teamRequest.teamName,
        serverName: teamRequest.serverName,
        tournamentName: teamRequest.tournamentDetails?.tournamentName,
        tournamentDay: teamRequest.tournamentDetails?.tournamentDay
      }
      service.unregisterUserFromTeam(userDetail, teamRequest).subscribe(data => {
        expect(data).toBeTruthy();
        expect(data).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`/api/team/register`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(expectedPayload);
      req.flush(mockResponse);
    })
  })

  describe('GET Clash Bot User Information', () => {
    test('When I request for user information from localhost, I should respond with an Observable<ClashBotUserDetails>', (done) => {
      const expectedUserDetails: ClashBotUserDetails = {
        id: '12345566',
        preferredChampions: new Set<string>(),
        subscriptions: { 'UpcomingClashTournamentDiscordDM': true}
      };

      service.getUserDetails(expectedUserDetails.id).subscribe((data) => {
        expect(data).toEqual(expectedUserDetails);
        done();
      })
      const req = httpMock.expectOne(`http://localhost:80/api/user?id=${expectedUserDetails.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(expectedUserDetails);
    })

    test('When I request for user information, I should respond with an Observable<ClashBotUserDetails>', (done) => {
      stubLocation({hostname: "clash-bot.ninja"});
      const expectedUserDetails: ClashBotUserDetails = {
        id: '12345566',
        preferredChampions: new Set<string>(),
        subscriptions: { 'UpcomingClashTournamentDiscordDM': true}
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

  describe('Build Host Url', () => {
    test('When I request the host to use from buildHostUrl and it is localhost, I should be returned a url with the prefix of http://localHost:80', () => {
      stubLocation({hostname: "localhost", port: 'http'});
      const url = '/api/tournaments';
      expect(service.buildHostUrl(url).startsWith('http://localhost:80')).toBeTruthy()
    })

    test('When I request the host to use from buildHostUrl and it is not localhost, I should be returned the same url.', () => {
      stubLocation({hostname: "clash-bot.ninja", port: 'http'});
      const url = '/api/tournaments';
      expect(service.buildHostUrl(url)).toEqual(url);
    })
  })
});
