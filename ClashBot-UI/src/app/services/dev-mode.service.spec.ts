import {TestBed} from "@angular/core/testing";

import {DevModeService} from "./dev-mode.service";

describe("DevModeService", () => {
  let service: DevModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevModeService);
  });

  test("should be created", () => {
    expect(service).toBeTruthy();
  });

  test("When isDevMode is called, it should return a boolean based on if the application is in DevMod..", () => {
    expect(service.isDevMode()).toBeTruthy();
  })
});
