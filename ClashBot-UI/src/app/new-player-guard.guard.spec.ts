import {TestBed} from "@angular/core/testing";

import {NewPlayerGuardGuard} from "./new-player-guard.guard";

describe("NewPlayerGuardGuard", () => {
  let guard: NewPlayerGuardGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(NewPlayerGuardGuard);
  });

  it("should be created", () => {
    expect(guard).toBeTruthy();
  });
});
