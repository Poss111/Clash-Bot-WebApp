import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KebabCasePipe} from "./kebab-case.pipe";
import {ImageFallbackDirective} from "./image-fallback.directive";
import { NotificationsComponent } from './notifications/notifications.component';
import {MatIconModule} from "@angular/material/icon";

@NgModule({
  declarations: [KebabCasePipe, ImageFallbackDirective, NotificationsComponent],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [
    KebabCasePipe,
    ImageFallbackDirective,
    NotificationsComponent
  ]
})
export class SharedModule {
}
