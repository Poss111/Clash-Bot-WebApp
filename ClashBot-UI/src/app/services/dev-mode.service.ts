import {Injectable, isDevMode} from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class DevModeService {

  constructor() { }

  isDevMode() {
    return isDevMode();
  }
}
