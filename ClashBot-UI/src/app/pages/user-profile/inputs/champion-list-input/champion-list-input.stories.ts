// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Meta, Story} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {ChampionListInputComponent} from "./champion-list-input.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatChipsModule} from "@angular/material/chips";
import {MatIconModule} from "@angular/material/icon";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {SharedModule} from "../../../../shared/shared.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {action} from "@storybook/addon-actions";

export default {
    title: "Shared/ChampionListInput",
    component: ChampionListInputComponent,
    argTypes: {
        addEvent: {action: true}
    },
    decorators: [
        moduleMetadata({
            declarations: [],
            imports: [
                MatFormFieldModule,
                FormsModule,
                ReactiveFormsModule,
                MatChipsModule,
                MatIconModule,
                MatAutocompleteModule,
                SharedModule,
                BrowserAnimationsModule
            ],
        })
    ]
} as Meta;

const Template: Story<ChampionListInputComponent> = (args: ChampionListInputComponent) => ({
    props: {
        ...args,
        addEvent: action("addEvent"),
        removeEvent: action("removeEvent"),
    },
});

export const NoChampions = Template.bind({});
NoChampions.args = {
    selectedChampions: [],
    listOfChampions: ["Aatrox", "Sett"]
};

export const OneChampion = Template.bind({});
OneChampion.args = {
    selectedChampions: ["Aatrox"],
    listOfChampions: ["Ahri", "Anivia", "Sett", "Viegar"]
};

export const FullListOfChampions = Template.bind({});
FullListOfChampions.args = {
    selectedChampions: ["Aatrox", "Ahri", "Anivia", "Sett", "Viegar"],
    listOfChampions: ["Volibear"]
};