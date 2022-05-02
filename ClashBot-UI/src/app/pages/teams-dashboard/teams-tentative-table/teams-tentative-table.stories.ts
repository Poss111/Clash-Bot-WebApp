// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Story, Meta} from '@storybook/angular/types-6-0';
import {moduleMetadata} from '@storybook/angular';
import {TeamsTentativeTableComponent} from "./teams-tentative-table.component";
import {MatTableModule} from "@angular/material/table";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatDialogModule} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../../../dialogs/confirmation-dialog/confirmation-dialog.component";

export default {
    title: 'Shared/TeamsTentativeTable',
    component: TeamsTentativeTableComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [
                ConfirmationDialogComponent
            ],
            imports: [
                MatTableModule,
                MatButtonModule,
                MatIconModule,
                BrowserAnimationsModule,
                MatDialogModule
            ],
        })
    ]
} as Meta;

const Template: Story<TeamsTentativeTableComponent> = (args: TeamsTentativeTableComponent) => ({
    props: args,
});

export const Loading = Template.bind({});
Loading.args = {
    tentativeList: [],
    tentativeDataStatus: 'LOADING'
};

export const Failed = Template.bind({});
Failed.args = {
    tentativeList: [],
    tentativeDataStatus: 'FAILED'
};

export const Successful = Template.bind({});
Successful.args = {
    tentativeList: [
        {
            serverName: 'Goon Squad',
            tentativePlayers: ['Hehoo'],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            },
            isMember: true
        },
        {
            serverName: 'Goon Squad',
            tentativePlayers: [],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '2'
            },
            isMember: false
        },
        {
            serverName: 'Goon Squad',
            tentativePlayers: ['Hehoo'],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '3'
            },
            isMember: true
        },
        {
            serverName: 'Goon Squad',
            tentativePlayers: [],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '4'
            },
            isMember: false
        }
    ],
    tentativeDataStatus: 'SUCCESSFUL'
};