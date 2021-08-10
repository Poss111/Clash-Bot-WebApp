import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeDashboardComponent } from './welcome-dashboard.component';

describe('WelcomeDashboardComponent', () => {
  let component: WelcomeDashboardComponent;
  let fixture: ComponentFixture<WelcomeDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WelcomeDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
