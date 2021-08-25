import { Injectable } from '@angular/core';
import {environment} from "../environments/environment";
declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalyticsService {

  constructor() { }

  sendPageNavigationEvent(pageUrl: string): void {
    if (environment.gTag) {
        console.log('Google event invoked...');
          gtag('config', environment.gTag, {'page_path': pageUrl});
    }
  }

}
