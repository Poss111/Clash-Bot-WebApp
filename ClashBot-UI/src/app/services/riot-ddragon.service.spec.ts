import {TestBed} from "@angular/core/testing";

import {RiotDdragonService} from "./riot-ddragon.service";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";

describe("RiotDdragonService", () => {
    let service: RiotDdragonService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [RiotDdragonService]
        });
        service = TestBed.inject(RiotDdragonService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    test("should be created", () => {
        expect(service).toBeTruthy();
    });

    test("Should make a call to retrieve the list of valid champion names.", (done) => {
        window.localStorage.setItem("leagueApiVersion", "12.8.1");
        const mockChampionsList = {
            type: "champion",
            format: "standAloneComplex",
            version: "12.8.1",
            data: {
                Aatrox: {
                    version: "12.8.1",
                    id: "Aatrox",
                    key: "266",
                    name: "Aatrox",
                    title: "the Darkin Blade"
                }
            }
        };
        service.getListOfChampions().subscribe((data) => {
            expect(data).toBeTruthy();
            done();
        });
        const request = httpMock.expectOne("https://ddragon.leagueoflegends.com/cdn/12.8.1/data/en_US/champion.json");
        expect(request.request.method).toEqual("GET");
        request.flush(mockChampionsList);
    })

    test("Should make a call to get version that the Riot API offers for their ddragon library.", () => {
        let mockVersions = [
            "12.8.1",
            "12.4.1",
            "12.3.1",
            "12.1.1",
            "11.21.1",
            "12.6.1",
            "12.7.1",
            "12.5.1",
            "12.2.1",
            "11.24.1",
            "11.23.1",
            "11.22.1"
        ];
        service.getVersions().subscribe((data) => {
            expect(data).toEqual(mockVersions);
        })
        const request = httpMock.expectOne("https://ddragon.leagueoflegends.com/api/versions.json");
        expect(request.request.method).toEqual("GET");
        request.flush(mockVersions);
    })

});
