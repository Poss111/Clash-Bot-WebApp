import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeDashboardComponent } from './welcome-dashboard.component';
import {MatCardModule} from "@angular/material/card";
import { MatIconModule} from "@angular/material/icon";
import {ClashTournamentCalendarComponent} from "../clash-tournament-calendar/clash-tournament-calendar.component";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {DateTimeProvider, OAuthLogger, OAuthService, UrlHelperService} from "angular-oauth2-oidc";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {ClashBotService} from "../clash-bot.service";
import {MatSnackBar} from "@angular/material/snack-bar";

describe('WelcomeDashboardComponent', () => {
  let component: WelcomeDashboardComponent;
  let fixture: ComponentFixture<WelcomeDashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WelcomeDashboardComponent, ClashTournamentCalendarComponent ],
      imports: [MatCardModule, MatIconModule, MatDatepickerModule, HttpClientTestingModule],
      providers: [OAuthService, UrlHelperService, OAuthLogger, DateTimeProvider, ClashBotService, MatSnackBar]
    })
    .compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    httpMock.verify();
    fixture = TestBed.createComponent(WelcomeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should create', () => {
    expect(component).toBeTruthy();
  });
});
