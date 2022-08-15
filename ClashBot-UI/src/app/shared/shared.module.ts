import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {KebabCasePipe} from "./kebab-case.pipe";
import {ImageFallbackDirective} from "./image-fallback.directive";
import {SpinnerComponent} from "./spinner/spinner.component";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {TournamentNameTransformerPipe} from "./tournament-name-transformer.pipe";

@NgModule({
    declarations: [
        KebabCasePipe,
        ImageFallbackDirective,
        SpinnerComponent,
        TournamentNameTransformerPipe
    ],
    imports: [
        MatProgressSpinnerModule,
        CommonModule
    ],
    exports: [
        KebabCasePipe,
        ImageFallbackDirective,
        SpinnerComponent,
        TournamentNameTransformerPipe
    ]
})
export class SharedModule {
}
