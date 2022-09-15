import {ComponentFixture, TestBed} from "@angular/core/testing";

import {TeamsDashboardViewComponent} from "./teams-dashboard-view.component";
import {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from "@angular/core";
import {MatTooltipModule} from "@angular/material/tooltip";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

describe("TeamsDashboardViewComponent", () => {
  let component: TeamsDashboardViewComponent;
  let fixture: ComponentFixture<TeamsDashboardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamsDashboardViewComponent ],
      imports: [MatTooltipModule, BrowserAnimationsModule],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsDashboardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test("should create", () => {
    expect(component).toBeTruthy();
  });
});
