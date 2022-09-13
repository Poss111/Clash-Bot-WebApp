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
import {BehaviorSubject, Observable, of} from "rxjs";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {ClashbotWalkthroughRoutingModule} from "./clashbot-walkthrough-routing.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatCardModule} from "@angular/material/card";
import {MatDividerModule} from "@angular/material/divider";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {SharedModule} from "../../shared/shared.module";
import {UserService} from "clash-bot-service-api";
import {Player} from "clash-bot-service-api/model/player";
import {HttpContext, HttpEvent, HttpResponse} from "@angular/common/http";

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
        clashBotUserDetails: {
          id: "1"
        },
        userDetails: {
            id: 1,
            username: "Test User",
            discriminator: "sdf"
        },
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

class MockUserService implements Partial<UserService> {

    getUser(id: string, observe?: "body", reportProgress?: boolean, options?: { httpHeaderAccept?: "application/json"; context?: HttpContext }): Observable<Player>;
    getUser(id: string, observe?: "response", reportProgress?: boolean, options?: { httpHeaderAccept?: "application/json"; context?: HttpContext }): Observable<HttpResponse<Player>>;
    getUser(id: string, observe?: "events", reportProgress?: boolean, options?: { httpHeaderAccept?: "application/json"; context?: HttpContext }): Observable<HttpEvent<Player>>;
    getUser(id: string, observe?: "body" | "response" | "events", reportProgress?: boolean, options?: { httpHeaderAccept?: "application/json"; context?: HttpContext }): Observable<Player> | Observable<HttpResponse<Player>> | Observable<HttpEvent<Player>> {
        const player: Player = {
            id: "0",
            name: "Test User",
            serverId: "0",
            selectedServers: [
                "1",
                "2",
                "3"
            ]
        };
        return of(player);
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
                MatCardModule,
                MatDividerModule,
                MatSnackBarModule,
                MatAutocompleteModule,
                SharedModule
            ],
            providers: [{
                provide: ApplicationDetailsService, useClass: MockApplicationDetailsService,
            }, {
                provide: UserService, userClass: MockUserService
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
Primary.args = {};

