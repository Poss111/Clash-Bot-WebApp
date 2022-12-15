import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailsInputComponent } from './user-details-input.component';

describe('UserDetailsInputComponent', () => {
  let component: UserDetailsInputComponent;
  let fixture: ComponentFixture<UserDetailsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserDetailsInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDetailsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
