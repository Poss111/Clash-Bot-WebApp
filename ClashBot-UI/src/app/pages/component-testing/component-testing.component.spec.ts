import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestingComponent } from './component-testing.component';
import {TournamentNameTransformerPipe} from "../../tournament-name-transformer.pipe";
import {TeamCardComponent} from "../teams-dashboard/team-card/team-card.component";
import {MatCardContent, MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatDialogModule} from "@angular/material/dialog";
import {TeamCardPlayerDetailsComponent} from "../teams-dashboard/team-card/team-card-player-details/team-card-player-details.component";
import {SharedModule} from "../../components/shared/shared.module";

describe('ComponentTestingComponent', () => {
  let component: ComponentTestingComponent;
  let fixture: ComponentFixture<ComponentTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComponentTestingComponent, TournamentNameTransformerPipe, TeamCardComponent,
        TeamCardPlayerDetailsComponent],
      imports: [MatCardModule, MatIconModule, MatDialogModule, SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });
});
