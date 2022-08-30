// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Meta, Story} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {TeamsDashboardViewComponent} from "./teams-dashboard-view.component";
import {TeamCardComponent} from "../../component/team-card/team-card.component";
import {NewTeamCardComponent} from "../../component/new-team-card/new-team-card.component";
import {TeamsTentativeTableComponent} from "../../component/teams-tentative-table/teams-tentative-table.component";
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
                TeamsDashboardHelpDialogComponent,
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

const createMockGuild = (name: string, id: string) => {
    return {
        features: [],
        icon: "",
        id,
        name,
        owner: false,
        permissions: 0,
        permissions_new: ""
    }
};

const createMockFilter = (name: string, id: string, numberOfTeams: number = 0) => {
    return {
        value: createMockGuild(name, id),
        type: FilterType.SERVER,
        state: false,
        id: id,
        numberOfTeams
    }
};

export const TwentyServers = Template.bind({});
TwentyServers.args = {
    selectedServer: createMockGuild("Clash Bot", "0"),
    eligibleTournaments: [],
    defaultServer: createMockGuild("Clash Bot", "0"),
    tentativeDataStatus: "SUCCESSFUL",
    tentativeList: [
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            }
        },
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            }
        },
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            }
        },
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            }
        }
    ],
    teamFilters: [
        createMockFilter("Clash Bot", "0", 10),
        createMockFilter("Clash Bot Two", "1", 2),
        createMockFilter("Extro", "3", 0),
        createMockFilter("Extro1", "4", 0),
        createMockFilter("Extro2", "5", 0),
        createMockFilter("ReallyLongNameForServer", "6", 0),
        createMockFilter("123 AbC", "7", 0),
        createMockFilter("Heheh", "8", 0),
        createMockFilter("I really do not know", "9", 0),
        createMockFilter("Boom Boom", "10", 0),
        createMockFilter("Not My Server", "11", 0),
        createMockFilter("I am special!", "12", 0),
        createMockFilter("Kerissa", "13", 0),
        createMockFilter("Micah-chan", "14", 0),
        createMockFilter("Jumanji", "15", 0),
        createMockFilter("Leaguy", "16", 0),
        createMockFilter("IDK", "17", 0),
        createMockFilter("Woah", "18", 0),
        createMockFilter("Miso", "19", 0),
        createMockFilter("This is a sentence", "20", 0),
        createMockFilter("This is a sentence too", "21", 0),
        createMockFilter("This is a sente", "22", 0),
        createMockFilter("This is a", "23", 0),
        createMockFilter("This is a sentence toosdf", "24", 0),
        createMockFilter("This is a senten", "25", 0),
        createMockFilter("This is a sentenc", "26", 0),
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
            server: createMockGuild("Clash Bot", "0"),
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
            server: createMockGuild("Clash Bot", "0"),
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
            server: createMockGuild("Clash Bot", "0"),
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
            server: createMockGuild("Clash Bot", "0"),
            id: "4"
        }
    ]
};

export const CreateNewTeam = Template.bind({});
CreateNewTeam.args = {
    selectedServer: createMockGuild("Clash Bot", "0"),
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
    defaultServer: createMockGuild("Clash Bot", "0"),
    tentativeDataStatus: "SUCCESSFUL",
    canCreateNewTeam: true,
    tentativeList: [
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "1"
            }
        },
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "2"
            }
        },
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "3"
            }
        },
        {
            serverId: "0",
            tentativePlayers: [],
            isMember: false,
            tournamentDetails: {
                tournamentName: "awesome_sauce",
                tournamentDay: "4"
            }
        }
    ],
    teamFilters: [
        createMockFilter("Goon Squad", "0", 0),
        createMockFilter("Clash Bot", "1", 0),
        createMockFilter("Extro", "2", 0)
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
            server: createMockGuild("Clash Bot", "0"),
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
            id: "1",
            numberOfTeams: 0
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2",
            numberOfTeams: 0
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3",
            numberOfTeams: 0
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
            id: "1",
            numberOfTeams: 0
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2",
            numberOfTeams: 0
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3",
            numberOfTeams: 0
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
            id: "1",
            numberOfTeams: 0
        },
        {
            value: "Clash Bot",
            type: FilterType.SERVER,
            state: false,
            id: "2",
            numberOfTeams: 0
        },
        {
            value: "Extro",
            type: FilterType.SERVER,
            state: false,
            id: "3",
            numberOfTeams: 0
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
