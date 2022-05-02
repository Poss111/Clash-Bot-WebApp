import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTeamCardComponent } from './new-team-card.component';

describe('NewTeamCardComponent', () => {
  let component: NewTeamCardComponent;
  let fixture: ComponentFixture<NewTeamCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewTeamCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewTeamCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
