import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileComponent } from './user-profile.component';
import {UserProfileModule} from "./user-profile.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ UserProfileModule, BrowserAnimationsModule ]
    })
    .compileComponents();
  });

  test('should create', () => {
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  let createComponent = () => {
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  }
});
