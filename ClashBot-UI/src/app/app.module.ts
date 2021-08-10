import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {ClashBotService} from "./clash-bot.service";
import { ErrorHandlerComponent } from './error-handler/error-handler.component';
import { WelcomeDashboardComponent } from './welcome-dashboard/welcome-dashboard.component';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule} from "@angular/material/core";
import { MatMenuModule } from "@angular/material/menu";
import { ClashTournamentCalendarComponent } from './clash-tournament-calendar/clash-tournament-calendar.component';
import { ClashTournamentCalendarHeaderComponent } from './clash-tournament-calendar-header/clash-tournament-calendar-header.component';
import {OAuthModule} from "angular-oauth2-oidc";
import { LoginSuccessfulComponent } from './login-successful/login-successful.component';
import {DiscordInterceptor} from "./discord-interceptor.service";

@NgModule({
  declarations: [
    AppComponent,
    ErrorHandlerComponent,
    WelcomeDashboardComponent,
    ClashTournamentCalendarComponent,
    ClashTournamentCalendarHeaderComponent,
    LoginSuccessfulComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    OAuthModule.forRoot(),
  ],
  providers: [ClashBotService, {provide: HTTP_INTERCEPTORS, useClass: DiscordInterceptor, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule {
}
