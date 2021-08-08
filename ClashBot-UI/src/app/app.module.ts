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
import {TeamCardComponent} from './team-card/team-card.component';
import {HttpClientModule} from "@angular/common/http";
import {ClashBotService} from "./clash-bot.service";
import { ErrorHandlerComponent } from './error-handler/error-handler.component';

@NgModule({
  declarations: [
    AppComponent,
    TeamCardComponent,
    ErrorHandlerComponent
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
  ],
  providers: [ClashBotService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
