import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsernameNotificationsComponent } from './username-notifications.component';

describe('UsernameNotificationsComponent', () => {
  let component: UsernameNotificationsComponent;
  let fixture: ComponentFixture<UsernameNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsernameNotificationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsernameNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
