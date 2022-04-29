// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/angular/types-6-0';
import {TeamCardComponent} from "./team-card.component";
import { moduleMetadata } from '@storybook/angular';
import {MatDialogModule} from "@angular/material/dialog";
import {MatCardModule} from "@angular/material/card";
import {SharedModule} from "../../../shared/shared.module";
import {TeamCardPlayerDetailsComponent} from "./team-card-player-details/team-card-player-details.component";
import {TournamentNameTransformerPipe} from "../../../tournament-name-transformer.pipe";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatExpansionModule} from "@angular/material/expansion";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

export default {
    title: 'TeamCard/TeamCard',
    component: TeamCardComponent,
    // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
    argTypes: {
        team: { control: { type: null } },
    },
    decorators: [
        moduleMetadata({
            declarations: [ TeamCardPlayerDetailsComponent, TournamentNameTransformerPipe],
            imports: [MatDialogModule, MatCardModule, SharedModule, MatIconModule, MatButtonModule, MatExpansionModule, BrowserAnimationsModule],
        })
    ]
} as Meta;

const Template: Story<TeamCardComponent> = (args: TeamCardComponent) => ({
    props: args,
});

export const Primary = Template.bind({});
Primary.args = {
    team: {
        teamName: 'Team Charizard',
        playersDetails: [
            {
                name: 'Roidrage',
                id: 1,
                role: 'Top',
                champions: ['Sett', 'Volibear', 'Ornn'],
                isUser: true
            },
            {
                name: 'TheIncentive',
                id: 1,
                role: 'Bot',
                champions: ['Lucian', 'Senna', 'Jhin']
            },
            {
                name: 'TheIncentive',
                id: 1,
                role: 'Mid',
                champions: ['Lucian', 'Senna', 'Jhin']
            },
            {
                name: 'TheIncentive',
                id: 1,
                role: 'Jg',
                champions: ['Lucian', 'Senna', 'Jhin']
            },
            {
                name: 'TheIncentive',
                id: 1,
                role: 'Supp',
                champions: ['Lucian', 'Senna', 'Jhin']
            }
        ],
        tournamentDetails: {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        },
        serverName: 'Goon Squad',
        startTime: new Date().toISOString(),
        id: 'charizard'
    }
};
