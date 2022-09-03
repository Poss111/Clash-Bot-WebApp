import {moduleMetadata} from "@storybook/angular";
import {ClashbotWalkthroughComponent} from "./clashbot-walkthrough.component";
import {CommonModule} from "@angular/common";
import {MatStepperModule} from "@angular/material/stepper";
import {Meta, Story} from "@storybook/angular/types-6-0";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {TeamsModule} from "../teams-dashboard/teams.module";
import {ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatIconRegisteryModule} from "../teams-dashboard/component/mat-icon-registery.module";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {ApplicationDetailsService} from "../../services/application-details.service";
import {ApplicationDetails} from "../../interfaces/application-details";
import {LoginStatus} from "../../login-status";
import {BehaviorSubject} from "rxjs";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {ClashbotWalkthroughRoutingModule} from "./clashbot-walkthrough-routing.module";
import {MatExpansionModule} from "@angular/material/expansion";

const createGuild = (name: string, id: string) => {
    return {
        features: [],
        icon: "",
        id,
        name,
        owner: false,
        permissions: 0,
        permissions_new: ""
    };
}
const guildMap = new Map<string, DiscordGuild>();
guildMap.set("1", createGuild("Clash Bot", "1"));
guildMap.set("2", createGuild("LoL-ClashBotSupport", "2"));
guildMap.set("3", createGuild("Goon Squad", "3"));
guildMap.set("4", createGuild("Dizzy", "4"));
guildMap.set("5", createGuild("Wow", "5"));


class MockApplicationDetailsService implements Partial<ApplicationDetailsService> {

    private defaultStatus: ApplicationDetails = {
        loggedIn: true,
        loginStatus: LoginStatus.LOGGED_IN,
        userGuilds: guildMap
    };
    applicationDetails: BehaviorSubject<ApplicationDetails> = new BehaviorSubject<ApplicationDetails>(this.defaultStatus);

    constructor() {
    }

    getApplicationDetails(): BehaviorSubject<ApplicationDetails> {
        return this.applicationDetails;
    }
}

export default {
    title: "Pages/ClashBotWalkthrough",
    component: ClashbotWalkthroughComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [],
            imports: [
                CommonModule,
                MatStepperModule,
                ClashbotWalkthroughRoutingModule,
                MatButtonModule,
                MatIconModule,
                BrowserAnimationsModule,
                TeamsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatAutocompleteModule,
                MatIconRegisteryModule,
                MatExpansionModule,
            ],
            providers: [{
                provide: ApplicationDetailsService, useClass: MockApplicationDetailsService
            }]
        })
    ]
} as Meta;

const Template: Story<ClashbotWalkthroughComponent> = (args: ClashbotWalkthroughComponent) => ({
    props: {
        ...args
    },
});

export const Primary = Template.bind({});
Primary.args = {
    mockTeam: {
        name: "abra",
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
        server: {
            features: [],
            icon: "",
            id: "0",
            name: "Clash Bot",
            owner: false,
            permissions: 0,
            permissions_new: ""
        },
        id: "1"
    }
};

