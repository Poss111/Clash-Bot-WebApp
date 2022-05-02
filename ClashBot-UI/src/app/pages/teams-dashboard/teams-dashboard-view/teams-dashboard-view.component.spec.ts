import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamsDashboardViewComponent } from './teams-dashboard-view.component';

describe('TeamsDashboardViewComponent', () => {
  let component: TeamsDashboardViewComponent;
  let fixture: ComponentFixture<TeamsDashboardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamsDashboardViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamsDashboardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
