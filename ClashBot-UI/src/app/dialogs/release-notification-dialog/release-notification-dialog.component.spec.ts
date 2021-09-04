import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleaseNotificationDialogComponent } from './release-notification-dialog.component';

describe('ReleaseNotificationDialogComponent', () => {
  let component: ReleaseNotificationDialogComponent;
  let fixture: ComponentFixture<ReleaseNotificationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReleaseNotificationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReleaseNotificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
