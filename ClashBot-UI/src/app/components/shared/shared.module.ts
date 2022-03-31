import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KebabCasePipe} from "./pipes/kebab-case.pipe";
import {ImageFallbackDirective} from "./directives/image-fallback.directive";
import {NotificationsComponent} from './notifications/notifications.component';
import {MatIconModule} from "@angular/material/icon";
import {NotificationIconComponent} from './notifications/notification-icon/notification-icon.component';
import {OverlayModule} from "@angular/cdk/overlay";
import {MatBadgeModule} from "@angular/material/badge";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";

@NgModule({
    declarations: [KebabCasePipe, ImageFallbackDirective, NotificationsComponent, NotificationIconComponent],
    imports: [
        CommonModule,
        MatIconModule,
        OverlayModule,
        MatBadgeModule,
        MatButtonModule,
        MatTooltipModule
    ],
    exports: [
        KebabCasePipe,
        ImageFallbackDirective,
        NotificationsComponent,
        NotificationIconComponent
    ]
})
export class SharedModule {
}
