import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSuccessfulComponent } from './login-successful.component';

describe('LoginSuccessfulComponent', () => {
  let component: LoginSuccessfulComponent;
  let fixture: ComponentFixture<LoginSuccessfulComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginSuccessfulComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginSuccessfulComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
