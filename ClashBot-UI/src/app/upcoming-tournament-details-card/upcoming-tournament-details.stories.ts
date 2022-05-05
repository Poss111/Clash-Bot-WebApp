import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {UpcomingTournamentDetailsCardComponent} from "./upcoming-tournament-details-card.component";
import {ClashTournaments} from "../interfaces/clash-tournaments";
import {TournamentNameTransformerPipe} from "../tournament-name-transformer.pipe";
import {MatListModule} from "@angular/material/list";

// @ts-ignore
export default {
    title: 'Cards/UpcomingTournamentDetailsCard',
    component: UpcomingTournamentDetailsCardComponent,
    // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [TournamentNameTransformerPipe],
            imports: [MatCardModule, MatIconModule, MatListModule],
        })
    ]
} as Meta;

const Template: Story<UpcomingTournamentDetailsCardComponent> = (args: UpcomingTournamentDetailsCardComponent) => ({
    props: args,
});

export const Primary = Template.bind({});
Primary.args = {
    tournaments: [
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '2',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '3',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '4',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        }
    ]
};