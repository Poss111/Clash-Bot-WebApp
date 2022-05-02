import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KebabCasePipe} from "./kebab-case.pipe";
import {ImageFallbackDirective} from "./image-fallback.directive";
import {SpinnerComponent} from './spinner/spinner.component';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

@NgModule({
    declarations: [
        KebabCasePipe,
        ImageFallbackDirective,
        SpinnerComponent
    ],
    imports: [
        MatProgressSpinnerModule,
        CommonModule
    ],
    exports: [
        KebabCasePipe,
        ImageFallbackDirective,
        SpinnerComponent
    ]
})
export class SharedModule {
}
