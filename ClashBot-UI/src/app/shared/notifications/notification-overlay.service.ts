import { Injectable } from '@angular/core';
import {Overlay} from "@angular/cdk/overlay";
import {ComponentPortal} from "@angular/cdk/portal";
import {NotificationsComponent} from "./notifications.component";

@Injectable({
  providedIn: 'root'
})
export class NotificationOverlayService {

  constructor(private overlay: Overlay) { }

  open() {
    const overlayRef = this.overlay.create()
    overlayRef.attach(new ComponentPortal(NotificationsComponent));
  }
}
