import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {UserDetailsService} from "./user-details.service";
import {Subject} from "rxjs";
import {UserDetails} from "./user-details";
import Mock = jest.Mock;
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatCardModule} from "@angular/material/card";

jest.mock('./user-details.service');

describe('AppComponent', () => {
  let userDetailsServiceMock: UserDetailsService;
  let getUserDetailsMock: Mock<Subject<UserDetails>> = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatToolbarModule,
        MatCardModule
      ],
      declarations: [AppComponent],
      providers: [UserDetailsService]
    }).compileComponents();
    userDetailsServiceMock = TestBed.inject(UserDetailsService);
    userDetailsServiceMock.getUserDetails = getUserDetailsMock;
  });

  test('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  test('The user details should be loaded when created.', () => {
    let subject = new Subject<UserDetails>();
    getUserDetailsMock.mockReturnValue(subject);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    expect(app.user$).toEqual(subject);
  })


});
