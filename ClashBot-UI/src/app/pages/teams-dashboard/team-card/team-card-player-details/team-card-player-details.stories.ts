// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {TeamCardPlayerDetailsComponent} from "./team-card-player-details.component";
import {SharedModule} from "../../../../shared/shared.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

export default {
    title: 'CardItems/PlayerDetails',
    component: TeamCardPlayerDetailsComponent,
    // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
    argTypes: {
        player: { control: { type: null } },
    },
    decorators: [
        moduleMetadata({
            declarations: [],
            imports: [MatCardModule, SharedModule, MatIconModule, MatButtonModule, MatExpansionModule, BrowserAnimationsModule],
        })
    ]
} as Meta;

const Template: Story<TeamCardPlayerDetailsComponent> = (args: TeamCardPlayerDetailsComponent) => ({
    props: args,
});

export const PrimaryWithChampions = Template.bind({});
PrimaryWithChampions.args = {
    player: {name: 'Roidrage', id: 1, role: 'Top', champions: ['Camille', 'Volibear', 'Ornn']},
    playerDetails: {name: 'Roidrage', id: 1, role: 'Top', champions: ['Camille', 'Volibear', 'Ornn']},
    showPlayerDetails: true
};

export const PrimaryWithoutChampions = Template.bind({});
PrimaryWithoutChampions.args = {
    player: {name: 'Roidrage', id: 1, role: 'Top', champions: []},
    playerDetails: {name: 'Roidrage', id: 1, role: 'Top', champions: []},
    showPlayerDetails: true
};

export const Empty = Template.bind({});
Empty.args = {
    player: {name: 'Roidrage', id: 1, role: 'Top', champions: []},
    playerDetails: {name: 'Roidrage', id: 1, role: 'Top', champions: []},
    showPlayerDetails: false
};
