import {ComponentFixture, TestBed} from "@angular/core/testing";
import {UpcomingTournamentDetailsCardComponent} from "./upcoming-tournament-details-card.component";
import {MatCardModule} from "@angular/material/card";
import {MatListModule} from "@angular/material/list";
import {MatIconModule} from "@angular/material/icon";
import {SharedModule} from "../shared/shared.module";

describe("UpcomingTournamentDetailsCardComponent", () => {
  let component: UpcomingTournamentDetailsCardComponent;
  let fixture: ComponentFixture<UpcomingTournamentDetailsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpcomingTournamentDetailsCardComponent ],
      imports: [MatCardModule, MatListModule, MatIconModule, SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpcomingTournamentDetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
