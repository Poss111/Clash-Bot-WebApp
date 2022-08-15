import {HttpClientModule} from "@angular/common/http";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

@NgModule({
  imports: [
    HttpClientModule
  ]
})
export class MatIconRegisteryModule {
  constructor(private matIconRegistry: MatIconRegistry,
              private sanitizer: DomSanitizer) {
    this.matIconRegistry.addSvgIcon("league-top",
      this.sanitizer.bypassSecurityTrustResourceUrl("assets/top.svg"));
    this.matIconRegistry.addSvgIcon("league-mid",
      this.sanitizer.bypassSecurityTrustResourceUrl("assets/mid.svg"));
    this.matIconRegistry.addSvgIcon("league-jg",
      this.sanitizer.bypassSecurityTrustResourceUrl("assets/jg.svg"));
    this.matIconRegistry.addSvgIcon("league-bot",
      this.sanitizer.bypassSecurityTrustResourceUrl("assets/bot.svg"));
    this.matIconRegistry.addSvgIcon("league-supp",
      this.sanitizer.bypassSecurityTrustResourceUrl("assets/supp.svg"));
  }

}
