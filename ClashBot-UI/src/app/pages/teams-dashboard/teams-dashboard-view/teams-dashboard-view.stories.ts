// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Meta, Story} from '@storybook/angular/types-6-0';
import {moduleMetadata} from '@storybook/angular';
import {TeamsDashboardViewComponent} from "./teams-dashboard-view.component";
import {TeamCardComponent} from "../team-card/team-card.component";
import {NewTeamCardComponent} from "../new-team-card/new-team-card.component";
import {TeamsTentativeTableComponent} from "../teams-tentative-table/teams-tentative-table.component";
import {HelpDialogComponent} from "../help-dialog/help-dialog.component";
import {TeamsDashboardHelpDialogComponent} from "../teams-dashboard-help-dialog/teams-dashboard-help-dialog.component";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatTableModule} from "@angular/material/table";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FilterType} from "../../../interfaces/filter-type";
import {MatChipsModule} from "@angular/material/chips";
import {GuildFilterListComponent} from "../guild-filter-list/guild-filter-list.component";
import {TournamentNameTransformerPipe} from "../../../tournament-name-transformer.pipe";
import {TeamCardPlayerDetailsComponent} from "../team-card/team-card-player-details/team-card-player-details.component";
import {KebabCasePipe} from "../../../shared/kebab-case.pipe";
import {MatExpansionModule} from "@angular/material/expansion";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ConfirmationDialogComponent} from "../../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {SpinnerComponent} from "../../../shared/spinner/spinner.component";
import {HttpClientModule} from "@angular/common/http";
import {AppModule} from "../../../app.module";
import {MatIconRegisteryModule} from "../teams-module/mat-icon-registery.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

export default {
    title: 'Pages/TeamsDashboard',
    component: TeamsDashboardViewComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [
                TeamCardComponent,
                NewTeamCardComponent,
                TeamsTentativeTableComponent,
                HelpDialogComponent,
                TeamsDashboardHelpDialogComponent,
                GuildFilterListComponent,
                TournamentNameTransformerPipe,
                TeamCardPlayerDetailsComponent,
                KebabCasePipe,
                ConfirmationDialogComponent,
                SpinnerComponent
            ],
            imports: [
                MatCardModule,
                MatDialogModule,
                MatButtonModule,
                MatIconModule,
                MatTableModule,
                MatProgressSpinnerModule,
                MatChipsModule,
                MatExpansionModule,
                BrowserAnimationsModule,
                MatIconRegisteryModule,
                FormsModule,
                ReactiveFormsModule
            ],
        })
    ]
} as Meta;

const Template: Story<TeamsDashboardViewComponent> = (args: TeamsDashboardViewComponent) => ({
    props: args,
});

export const Primary = Template.bind({});
Primary.args = {
    eligibleTournaments: [],
    defaultServer: 'Clash Bot',
    tentativeDataStatus: 'SUCCESSFUL',
    tentativeList: [
        {
            serverName: 'Clash Bot',
            tentativePlayers: [],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            }
        },
        {
            serverName: 'Clash Bot',
            tentativePlayers: [],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '2'
            }
        },
        {
            serverName: 'Clash Bot',
            tentativePlayers: [],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '3'
            }
        },
        {
            serverName: 'Clash Bot',
            tentativePlayers: [],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '4'
            }
        }
    ],
    teamFilters: [
        {
            value: 'Goon Squad',
            type: FilterType.SERVER,
            state: false,
            id: '1'
        },
        {
            value: 'Clash Bot',
            type: FilterType.SERVER,
            state: false,
            id: '2'
        },
        {
            value: 'Extro',
            type: FilterType.SERVER,
            state: false,
            id: '3'
        }
    ],
    teams: [
        {
            teamName: 'Team Abra',
            playersDetails: [
                {
                    name: 'Roidrage',
                    id: 1,
                    role: 'Top',
                    champions: ['Sett'],
                    isUser: true
                },
                {
                    name: '',
                    id: 0,
                    role: 'Mid',
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Jg',
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Bot',
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Supp',
                    isUser: false
                },
            ],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            },
            serverName: 'Clash Bot',
            startTime: new Date().toISOString(),
            id: '1'
        },
        {
            teamName: 'Team Blastoise',
            playersDetails: [
                {
                    name: 'Roidrage',
                    id: 1,
                    role: 'Top',
                    champions: ['Sett'],
                    isUser: true
                },
                {
                    name: '',
                    id: 0,
                    role: 'Mid',
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Jg',
                    isUser: false
                },
                {
                    name: 'PepeConrad',
                    id: 2,
                    role: 'Bot',
                    champions: ['Aphelios', 'Xayah', 'Kaisa'],
                    isUser: false
                },
                {
                    name: 'Shiragaku',
                    id: 3,
                    role: 'Supp',
                    champions: ['Nami', 'Lulu', 'Leona'],
                    isUser: false
                },
            ],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '2'
            },
            serverName: 'Clash Bot',
            startTime: new Date().toISOString(),
            id: '2'
        },
        {
            teamName: 'Team Charizard',
            playersDetails: [
                {
                    name: 'Roidrage',
                    id: 1,
                    role: 'Top',
                    champions: ['Sett'],
                    isUser: true
                },
                {
                    name: 'Coair',
                    id: 2,
                    role: 'Mid',
                    champions: ['Malzahar', 'Kassadin', 'Viktor'],
                    isUser: false
                },
                {
                    name: 'Drone123',
                    id: 3,
                    role: 'Jg',
                    champions: ['Lillia', 'Nidalee', 'Hecarim'],
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Bot',
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Supp',
                    isUser: false
                }
            ],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '3'
            },
            serverName: 'Clash Bot',
            startTime: new Date().toISOString(),
            id: '3'
        },
        {
            teamName: 'Team Venusaur',
            playersDetails: [
                {
                    name: 'Roidrage',
                    id: 1,
                    role: 'Top',
                    champions: ['Sett'],
                    isUser: true
                },
                {
                    name: '',
                    id: 0,
                    role: 'Mid',
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Jg',
                    isUser: false
                },
                {
                    name: 'TheIncentive',
                    id: 2,
                    role: 'Bot',
                    champions: ['Xayah', 'Tristana', 'Draven'],
                    isUser: false
                },
                {
                    name: '',
                    id: 0,
                    role: 'Supp',
                    isUser: false
                }
            ],
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '4'
            },
            serverName: 'Clash Bot',
            startTime: new Date().toISOString(),
            id: '4'
        }
    ]
};
