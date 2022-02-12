import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KebabCasePipe} from "./kebab-case.pipe";
import {ImageFallbackDirective} from "./image-fallback.directive";

@NgModule({
  declarations: [KebabCasePipe, ImageFallbackDirective],
  imports: [
    CommonModule
  ],
  exports: [
    KebabCasePipe,
    ImageFallbackDirective
  ]
})
export class SharedModule {
}
