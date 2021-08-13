import {TestBed} from '@angular/core/testing';
import {ClashBotService} from './clash-bot.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {DevModeService} from "./dev-mode.service";

describe('ClashBotService', () => {
  let service: ClashBotService;
  let httpMock: HttpTestingController;
  let devModeServiceMock: DevModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClashBotService, DevModeService]
    });
    service = TestBed.inject(ClashBotService);
    httpMock = TestBed.inject(HttpTestingController);
    devModeServiceMock = TestBed.inject(DevModeService);
  });

  afterEach(() => {
    httpMock.verify();
  })

  test('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('When I call to retrieve Clash Teams from local host, I should use localhost with port 80 and retrieve Observable<ClashTeam[]>', () => {
    devModeServiceMock.isDevMode = jest.fn().mockReturnValue(true);
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
    devModeServiceMock.isDevMode = jest.fn().mockReturnValue(false);
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

  test('When I retrieve Clash Tournaments and I am not in dev mode, I should use prod and be returned a Observable<ClashTeam[]>', () => {
    devModeServiceMock.isDevMode = jest.fn().mockReturnValue(false);
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

  test('When I retrieve Clash Tournaments,  I should use localhost with port 80 and be returned a Observable<ClashTeam[]>', () => {
    devModeServiceMock.isDevMode = jest.fn().mockReturnValue(true);
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

});
