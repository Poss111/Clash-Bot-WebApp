import {getTestBed, TestBed} from '@angular/core/testing';

import { ClashBotService } from './clash-bot.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";

describe('ClashBotService', () => {
  let service: ClashBotService;
  let httpMock: HttpTestingController;

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

  test('should return a sample payload',  () => {
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
    service.getClashTeams().subscribe(data => {
      console.log(data);
      expect(data).toBeTruthy();
      expect(data).toEqual( [
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
    const req = httpMock.expectOne(`http://localhost:8000/teams`);
    req.flush(mockResponse);
  })
});
