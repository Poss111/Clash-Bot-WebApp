// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Meta, Story} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {TeamsDashboardViewComponent} from "./teams-dashboard-view.component";
import {TeamCardComponent} from "../../component/team-card/team-card.component";
import {NewTeamCardComponent} from "../../component/new-team-card/new-team-card.component";
import {TeamsTentativeTableComponent} from "../../component/teams-tentative-table/teams-tentative-table.component";
import {HelpDialogComponent} from "../../component/help-dialog/help-dialog.component";
import {
    TeamsDashboardHelpDialogComponent
} from "../../component/teams-dashboard-help-dialog/teams-dashboard-help-dialog.component";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatTableModule} from "@angular/material/table";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FilterType} from "../../../../interfaces/filter-type";
import {MatChipsModule} from "@angular/material/chips";
import {GuildFilterListComponent} from "../../component/guild-filter-list/guild-filter-list.component";
import {
    TeamCardPlayerDetailsComponent
} from "../../component/team-card/team-card-player-details/team-card-player-details.component";
import {MatExpansionModule} from "@angular/material/expansion";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ConfirmationDialogComponent} from "../../../../dialogs/confirmation-dialog/confirmation-dialog.component";
import {MatIconRegisteryModule} from "../../component/mat-icon-registery.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {action} from "@storybook/addon-actions";
import {MatSelectModule} from "@angular/material/select";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {SharedModule} from "../../../../shared/shared.module";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import {MatBadgeModule} from "@angular/material/badge";
import {MatTooltipModule} from "@angular/material/tooltip";

export default {
    title: "Pages/TeamsDashboard",
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
                TeamCardPlayerDetailsComponent,
                ConfirmationDialogComponent,
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
                MatSelectModule,
                BrowserAnimationsModule,
                MatIconRegisteryModule,
                FormsModule,
                ReactiveFormsModule,
                MatProgressBarModule,
                SharedModule,
                MatSidenavModule,
                MatListModule,
                MatBadgeModule,
                MatTooltipModule
            ],
        })
    ]
} as Meta;

const Template: Story<TeamsDashboardViewComponent> = (args: TeamsDashboardViewComponent) => ({
    props: {
        ...args,
        createTeamEvent: action("createTeamEvent"),
        unregisterFromTeamEvent: action("unregisterFromTeamEvent"),
        registerForTeamEvent: action("registerForTeamEvent"),
        tentativeRegisterEvent: action("tentativeRegisterEvent"),
        filterTeamEvent: action("filterTeamEvent"),
    },
});

export const TwentyServers = Template.bind({});
TwentyServers.args = {
    selectedServer: "Clash Bot",
    eligibleTournaments: [],
    defaultServer: "Clash Bot",
    tentativeDataStatus: "SUCCESSFUL",
    tentativeList: [
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            }
        }
    ],
    teamFilters: [
        {
            value: "Goon Squad",
            type: FilterType.SERVER,
            state: false,
            id: "1"
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2"
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3"
        },
        {
            value: "Extro1",
            type: FilterType.SERVER,
            state: false,
            id: "4"
        },
        {
            value: "Extro2",
            type: FilterType.SERVER,
            state: false,
            id: "5"
        },
        {
            value: "ReallyLongNameForServer",
            type: FilterType.SERVER,
            state: false,
            id: "6"
        },
        {
            value: "123 AbC",
            type: FilterType.SERVER,
            state: false,
            id: "7"
        },
        {
            value: "Heheh",
            type: FilterType.SERVER,
            state: false,
            id: "8"
        },
        {
            value: "I really do not know",
            type: FilterType.SERVER,
            state: false,
            id: "9"
        },
        {
            value: "Boom Boom",
            type: FilterType.SERVER,
            state: false,
            id: "10"
        },
        {
            value: "Not My Server",
            type: FilterType.SERVER,
            state: false,
            id: "11"
        },
        {
            value: "I am special!",
            type: FilterType.SERVER,
            state: false,
            id: "12"
        },
        {
            value: "Kerissa",
            type: FilterType.SERVER,
            state: false,
            id: "13"
        },
        {
            value: "Micah-chan",
            type: FilterType.SERVER,
            state: false,
            id: "14"
        },
        {
            value: "Jumanji",
            type: FilterType.SERVER,
            state: false,
            id: "15"
        },
        {
            value: "Leaguy",
            type: FilterType.SERVER,
            state: false,
            id: "16"
        },
        {
            value: "IDK",
            type: FilterType.SERVER,
            state: false,
            id: "17"
        },
        {
            value: "Woah",
            type: FilterType.SERVER,
            state: false,
            id: "18"
        },
        {
            value: "Miso",
            type: FilterType.SERVER,
            state: false,
            id: "19"
        },
        {
            value: "This is a sentence",
            type: FilterType.SERVER,
            state: false,
            id: "20"
        },
        {
            value: "This is a sentence",
            type: FilterType.SERVER,
            state: false,
            id: "20"
        },
        {
            value: "This is a sentence",
            type: FilterType.SERVER,
            state: false,
            id: "20"
        },
        {
            value: "This is a sentence",
            type: FilterType.SERVER,
            state: false,
            id: "20"
        },
        {
            value: "This is a sentence",
            type: FilterType.SERVER,
            state: false,
            id: "20"
        },
        {
            value: "This is a sentence",
            type: FilterType.SERVER,
            state: false,
            id: "20"
        },
        {
            value: "This is a sentence",
            type: FilterType.SERVER,
            state: false,
            id: "20"
        },
    ],
    teams: [
        {
            name: "Abra",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "",
                    id: "0",
                    role: "Mid",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Jg",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Bot",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Supp",
                    isUser: false
                },
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            },
            serverName: "Clash Bot",
            id: "1"
        },
        {
            name: "Blastoise",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "",
                    id: "0",
                    role: "Mid",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Jg",
                    isUser: false
                },
                {
                    name: "PepeConrad",
                    id: "2",
                    role: "Bot",
                    champions: ["Aphelios", "Xayah", "Kaisa"],
                    isUser: false
                },
                {
                    name: "Shiragaku",
                    id: "3",
                    role: "Supp",
                    champions: ["Nami", "Lulu", "Leona"],
                    isUser: false
                },
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            },
            serverName: "Clash Bot",
            id: "2"
        },
        {
            name: "Charizard",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "Coair",
                    id: "2",
                    role: "Mid",
                    champions: ["Malzahar", "Kassadin", "Viktor"],
                    isUser: false
                },
                {
                    name: "Drone123",
                    id: "3",
                    role: "Jg",
                    champions: ["Lillia", "Nidalee", "Hecarim"],
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Bot",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Supp",
                    isUser: false
                }
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            },
            serverName: "Clash Bot",
            id: "3"
        },
        {
            name: "Venusaur",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "",
                    id: "0",
                    role: "Mid",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Jg",
                    isUser: false
                },
                {
                    name: "TheIncentive",
                    id: "2",
                    role: "Bot",
                    champions: ["Xayah", "Tristana", "Draven"],
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Supp",
                    isUser: false
                }
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            },
            serverName: "Clash Bot",
            id: "4"
        }
    ]
};

export const CreateNewTeam = Template.bind({});
CreateNewTeam.args = {
    selectedServer: "Clash Bot",
    eligibleTournaments: [
        {
            tournamentName: "awesome_sauce",
            tournamentDay: "1",
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: "awesome_sauce",
            tournamentDay: "2",
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: "awesome_sauce",
            tournamentDay: "3",
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: "awesome_sauce",
            tournamentDay: "4",
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        }
    ],
    defaultServer: "Clash Bot",
    tentativeDataStatus: "SUCCESSFUL",
    canCreateNewTeam: true,
    tentativeList: [
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            }
        }
    ],
    teamFilters: [
        {
            value: "Goon Squad",
            type: FilterType.SERVER,
            state: false,
            id: "1"
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2"
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3"
        }
    ],
    teams: [
        {
            name: "Abra",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "",
                    id: "0",
                    role: "Mid",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Jg",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Bot",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Supp",
                    isUser: false
                },
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            },
            serverName: "Clash Bot",
            id: "1"
        }
    ]
};

export const NoData = Template.bind({});
NoData.args = {
    selectedServer: "Clash Bot",
    eligibleTournaments: [],
    defaultServer: "Clash Bot",
    tentativeDataStatus: "SUCCESSFUL",
    tentativeList: [
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            }
        }
    ],
    teamFilters: [
        {
            value: "Goon Squad",
            type: FilterType.SERVER,
            state: false,
            id: "1"
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2"
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3"
        }
    ],
    teams: [{
        error: "Failed to load"
    }]
};

export const Loading = Template.bind({});
Loading.args = {
    selectedServer: "Clash Bot",
    eligibleTournaments: [],
    defaultServer: "Clash Bot",
    tentativeDataStatus: "SUCCESSFUL",
    showSpinner: true,
    tentativeList: [
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            },
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            }
        }
    ],
    teamFilters: [
        {
            value: "Goon Squad",
            type: FilterType.SERVER,
            state: false,
            id: "1"
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2"
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3"
        }
    ],
    teams: [{
        error: "Failed to load"
    }]
};


export const Primary = Template.bind({});
Primary.args = {
    selectedServer: "Clash Bot",
    eligibleTournaments: [],
    defaultServer: "Clash Bot",
    tentativeDataStatus: "SUCCESSFUL",
    tentativeList: [
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            }
        },
        {
            serverName: "Clash Bot",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            }
        }
    ],
    teamFilters: [
        {
            value: "Goon Squad",
            type: FilterType.SERVER,
            state: false,
            id: "1"
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2"
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3"
        }
    ],
    teams: [
        {
            name: "Abra",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "",
                    id: "0",
                    role: "Mid",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Jg",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Bot",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Supp",
                    isUser: false
                },
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            },
            serverName: "Clash Bot",
            id: "1"
        },
        {
            name: "Blastoise",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "",
                    id: "0",
                    role: "Mid",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Jg",
                    isUser: false
                },
                {
                    name: "PepeConrad",
                    id: "2",
                    role: "Bot",
                    champions: ["Aphelios", "Xayah", "Kaisa"],
                    isUser: false
                },
                {
                    name: "Shiragaku",
                    id: "3",
                    role: "Supp",
                    champions: ["Nami", "Lulu", "Leona"],
                    isUser: false
                },
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            },
            serverName: "Clash Bot",
            id: "2"
        },
        {
            name: "Charizard",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "Coair",
                    id: "2",
                    role: "Mid",
                    champions: ["Malzahar", "Kassadin", "Viktor"],
                    isUser: false
                },
                {
                    name: "Drone123",
                    id: "3",
                    role: "Jg",
                    champions: ["Lillia", "Nidalee", "Hecarim"],
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Bot",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Supp",
                    isUser: false
                }
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            },
            serverName: "Clash Bot",
            id: "3"
        },
        {
            name: "Venusaur",
            teamDetails: [
                {
                    name: "Roidrage",
                    id: "1",
                    role: "Top",
                    champions: ["Sett"],
                    isUser: true
                },
                {
                    name: "",
                    id: "0",
                    role: "Mid",
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Jg",
                    isUser: false
                },
                {
                    name: "TheIncentive",
                    id: "2",
                    role: "Bot",
                    champions: ["Xayah", "Tristana", "Draven"],
                    isUser: false
                },
                {
                    name: "",
                    id: "0",
                    role: "Supp",
                    isUser: false
                }
            ],
            tournament: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            },
            serverName: "Clash Bot",
            id: "4"
        }
    ]
};
