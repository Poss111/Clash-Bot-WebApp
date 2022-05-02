import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamsTentativeTableComponent } from './teams-tentative-table.component';

describe('TeamsTentativeTableComponent', () => {
  let component: TeamsTentativeTableComponent;
  let fixture: ComponentFixture<TeamsTentativeTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamsTentativeTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsTentativeTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
