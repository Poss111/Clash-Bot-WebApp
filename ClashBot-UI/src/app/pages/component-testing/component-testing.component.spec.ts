import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestingComponent } from './component-testing.component';
import {TournamentNameTransformerPipe} from "../../tournament-name-transformer.pipe";
import {TeamCardComponent} from "../teams-dashboard/team-card/team-card.component";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatDialogModule} from "@angular/material/dialog";

describe('ComponentTestingComponent', () => {
  let component: ComponentTestingComponent;
  let fixture: ComponentFixture<ComponentTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComponentTestingComponent, TournamentNameTransformerPipe, TeamCardComponent],
      imports: [MatCardModule, MatIconModule, MatDialogModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
