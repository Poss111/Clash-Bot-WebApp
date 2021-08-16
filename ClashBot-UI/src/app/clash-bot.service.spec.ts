import {TestBed} from '@angular/core/testing';
import {ClashBotService} from './clash-bot.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {UserDetails} from "./user-details";
import {ClashTeam} from "./clash-team";
import mock = jest.mock;

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

  describe('POST Register to Clash Team', () => {
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
