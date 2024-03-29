import {ComponentFixture, TestBed} from "@angular/core/testing";

import {TeamsDashboardHelpDialogComponent} from "./teams-dashboard-help-dialog.component";
import {MatIconModule} from "@angular/material/icon";
import {MatChipsModule} from "@angular/material/chips";
import {MatDialogModule} from "@angular/material/dialog";

describe("TeamsDashboardHelpDialogComponent", () => {
  let component: TeamsDashboardHelpDialogComponent;
  let fixture: ComponentFixture<TeamsDashboardHelpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamsDashboardHelpDialogComponent ],
      imports: [ MatIconModule, MatChipsModule, MatDialogModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsDashboardHelpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
