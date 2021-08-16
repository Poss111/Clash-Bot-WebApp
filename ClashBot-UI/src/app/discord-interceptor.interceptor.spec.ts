import {TestBed} from '@angular/core/testing';

import {DiscordInterceptor} from './discord-interceptor.service';
import {OAuthService} from "angular-oauth2-oidc";
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {DiscordService} from "./discord.service";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {ClashBotService} from "./clash-bot.service";

jest.mock('angular-oauth2-oidc');

describe('DiscordInterceptorInterceptor', () => {
  let mockDiscordService: DiscordService;
  let mockClashBotService: ClashBotService;
  let mockOAuthService: OAuthService;
  let getAccessToken: any;
  let httpMock: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OAuthService,
        ClashBotService,
        DiscordService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: DiscordInterceptor,
          multi: true,
        },
      ]
    });
    mockDiscordService = TestBed.inject(DiscordService);
    mockOAuthService = TestBed.inject(OAuthService);
    mockClashBotService = TestBed.inject(ClashBotService);
    httpMock = TestBed.inject(HttpTestingController);
    getAccessToken = jest.fn();
    mockOAuthService.getAccessToken = getAccessToken;
  });

  test('When a call is made for discord, it should add the Bearer token from the OAuthService to it.', () => {
    mockDiscordService.getGuilds().subscribe(response => {
      expect(response).toBeTruthy();
    })
    const mockGuilds = [{
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
    const request = httpMock.expectOne('https://discord.com/api/users/@me/guilds');
    request.flush(mockGuilds);
    expect(request.request.headers.has('Authorization')).toBeTruthy();
  })

  test('When a call is made for Clash Bot Service, it should not add anything.', () => {
    mockClashBotService.getClashTournaments().subscribe(response => {
      expect(response).toBeTruthy();
    })
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
    const request = httpMock.expectOne(`http://localhost:80/api/tournaments`);
    request.flush(mockResponse);
    expect(request.request.headers.has('Authorization')).toBeFalsy();
  })
});
