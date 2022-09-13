import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {KebabCasePipe} from "./kebab-case.pipe";
import {ImageFallbackDirective} from "./image-fallback.directive";
import {SpinnerComponent} from "./spinner/spinner.component";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {TournamentNameTransformerPipe} from "./tournament-name-transformer.pipe";
import {ServerFormComponent} from "./server-form/server-form.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {ReactiveFormsModule} from "@angular/forms";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatButtonModule} from "@angular/material/button";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";

@NgModule({
    declarations: [
        KebabCasePipe,
        ImageFallbackDirective,
        SpinnerComponent,
        TournamentNameTransformerPipe,
        ServerFormComponent
    ],
    imports: [
        MatProgressSpinnerModule,
        CommonModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule
    ],
    exports: [
        KebabCasePipe,
        ImageFallbackDirective,
        SpinnerComponent,
        TournamentNameTransformerPipe,
        ServerFormComponent
    ]
})
export class SharedModule {
}
