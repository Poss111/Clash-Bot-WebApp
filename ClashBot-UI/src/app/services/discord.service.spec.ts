import {TestBed} from '@angular/core/testing';
import {DiscordService} from './discord.service';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {environment} from "../../environments/environment";

describe('DiscordService', () => {
    let service: DiscordService;
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
            providers: [DiscordService]
        });
        service = TestBed.inject(DiscordService);
        httpMock = TestBed.inject(HttpTestingController);
        httpMock.verify();
    });

    test('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Get Guilds', () => {
        test('When discords guilds for the user is called, it should return an Observable<Guild>', () => {
            environment.production = true;
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
            service.getGuilds().subscribe((guilds) => {
                expect(guilds).toHaveLength(mockGuilds.length);
                expect(guilds).toEqual(mockGuilds);
            })
            const request = httpMock.expectOne('https://discord.com/api/users/@me/guilds');
            expect(request.request.method).toEqual('GET');
            request.flush(mockGuilds);
        })

        test('When discords guilds for the user is called when in local, it should return an Observable<Guild> that is mocked', () => {
            environment.production = false;
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
            service.getGuilds().subscribe((guilds) => {
                expect(guilds).toHaveLength(mockGuilds.length);
                expect(guilds).toEqual(mockGuilds);
            })
            const request = httpMock.expectOne('https://localhost:3000/api/users/@me/guilds');
            expect(request.request.method).toEqual('GET');
            request.flush(mockGuilds);
        })
    })

    describe("Get User Details", () => {
        test('When discords user details for the user is called, it should return an Observable<UserDetails>', () => {
          environment.production = true;
            const mockUserDetails = {
                "id": "321312312",
                "username": "SomeUser",
                "avatar": "2112312123123123",
                "discriminator": "2632157",
                "public_flags": 0,
                "flags": 0,
                "banner": null,
                "banner_color": "#eb0000",
                "accent_color": 15400960,
                "locale": "en-US",
                "mfa_enabled": false
            };
            service.getUserDetails().subscribe((userDetails) => {
                expect(userDetails).toEqual(mockUserDetails);
            })
            const request = httpMock.expectOne('https://discord.com/api/users/@me');
            expect(request.request.method).toEqual('GET');
            request.flush(mockUserDetails);
        })

        test('When discords user details for the user is called in local, it should return an Observable<UserDetails>', () => {
            environment.production = false;
            const mockUserDetails = {
                "id": "321312312",
                "username": "SomeUser",
                "avatar": "2112312123123123",
                "discriminator": "2632157",
                "public_flags": 0,
                "flags": 0,
                "banner": null,
                "banner_color": "#eb0000",
                "accent_color": 15400960,
                "locale": "en-US",
                "mfa_enabled": false
            };
            service.getUserDetails().subscribe((userDetails) => {
                expect(userDetails).toEqual(mockUserDetails);
            })
            const request = httpMock.expectOne('https://localhost:3000/api/users/@me');
            expect(request.request.method).toEqual('GET');
            request.flush(mockUserDetails);
        })
    })
});
