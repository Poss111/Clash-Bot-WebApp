import {NgModule, SecurityContext} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";

import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {WelcomeDashboardComponent} from "./pages/welcome-dashboard/welcome-dashboard.component";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatMenuModule} from "@angular/material/menu";
import {ClashTournamentCalendarComponent} from "./clash-tournament-calendar/clash-tournament-calendar.component";
import {ClashTournamentCalendarHeaderComponent} from "./clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {OAuthModule, OAuthStorage} from "angular-oauth2-oidc";
import {DiscordInterceptor} from "./services/discord-interceptor.service";
import {DiscordService} from "./services/discord.service";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {UpcomingTournamentDetailsCardComponent} from "./upcoming-tournament-details-card/upcoming-tournament-details-card.component";
import {MatListModule} from "@angular/material/list";
import {ReleaseNotificationDialogComponent} from "./dialogs/release-notification-dialog/release-notification-dialog.component";
import {MarkdownModule} from "ngx-markdown";
import {MatDialogModule} from "@angular/material/dialog";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {ReactiveFormsModule} from "@angular/forms";
import {PageLoadingService} from "./services/page-loading.service";
import {SharedModule} from "./shared/shared.module";
import {ApiModule, BASE_PATH} from "clash-bot-service-api"
import {environment} from "../environments/environment";
import {ProfileIconComponent} from "./profile-icon/profile-icon.component";

export function storageFactory(): OAuthStorage {
  return localStorage;
}

@NgModule({
    declarations: [
        AppComponent,
        WelcomeDashboardComponent,
        ClashTournamentCalendarComponent,
        ClashTournamentCalendarHeaderComponent,
        UpcomingTournamentDetailsCardComponent,
        ReleaseNotificationDialogComponent,
        ProfileIconComponent
    ],
    imports: [
        ApiModule,
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatCardModule,
        MatDialogModule,
        MatButtonModule,
        MatToolbarModule,
        MatIconModule,
        MatSnackBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatMenuModule,
        MatProgressBarModule,
        MatListModule,
        MatSlideToggleModule,
        ReactiveFormsModule,
        SharedModule,
        OAuthModule.forRoot(),
        MarkdownModule.forRoot({
            sanitize: SecurityContext.HTML
        })
    ],
    providers: [
        DiscordService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: DiscordInterceptor,
            multi: true
        },
        {
          provide: OAuthStorage,
          useFactory: storageFactory
        },
        PageLoadingService,
        {
            provide: BASE_PATH, useValue: environment.basePath
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
