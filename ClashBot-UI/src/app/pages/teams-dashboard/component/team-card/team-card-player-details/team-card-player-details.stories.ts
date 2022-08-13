// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Story, Meta} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {TeamCardPlayerDetailsComponent} from "./team-card-player-details.component";
import {SharedModule} from "../../../../../shared/shared.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatIconRegisteryModule} from "../../mat-icon-registery.module";
import {action} from "@storybook/addon-actions";
import {RiotDdragonService} from "../../../../../services/riot-ddragon.service";

export default {
    title: "CardItems/PlayerDetails",
    component: TeamCardPlayerDetailsComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [],
            imports: [
                MatCardModule,
                SharedModule,
                MatIconModule,
                MatButtonModule,
                MatExpansionModule,
                BrowserAnimationsModule,
                MatIconRegisteryModule
            ],
            providers: [
                RiotDdragonService
            ]
        })
    ]
} as Meta;

const Template: Story<TeamCardPlayerDetailsComponent> = (args: TeamCardPlayerDetailsComponent) => ({
    props: {
        ...args,
        apiVersion: "12.8.1",
        registerUserForRole: action("registerUserForRole"),
        unregisterUserForRole: action("unregisterUserForRole")
    },
});

export const PrimaryWithChampions = Template.bind({});
PrimaryWithChampions.args = {
    player: {name: "Roidrage", id: "1", role: "Top", champions: ["Camille", "Volibear", "Ornn"], isUser: false},
    showPlayerDetails: true
};

export const PrimaryWithoutChampions = Template.bind({});
PrimaryWithoutChampions.args = {
    player: {name: "Roidrage", id: "1", role: "Top", champions: [], isUser: false},
    showPlayerDetails: true
};

export const CurrentPlayerWithChampions = Template.bind({});
CurrentPlayerWithChampions.args = {
    player: {name: "Roidrage", id: "1", role: "Top", champions: ["Camille", "Volibear", "Ornn"], isUser: true},
    showPlayerDetails: true
};

export const TopWithDetails = Template.bind({});
TopWithDetails.args = {
    player: {name: "Roidrage", id: "1", role: "Top", champions: [], isUser: false},
    showPlayerDetails: true
};

export const MidWithDetails = Template.bind({});
MidWithDetails.args = {
    player: {name: "Roidrage", id: "1", role: "Mid", champions: [], isUser: false},
    showPlayerDetails: true
};

export const JgWithDetails = Template.bind({});
JgWithDetails.args = {
    player: {name: "Roidrage", id: "1", role: "Jg", champions: [], isUser: false},
    showPlayerDetails: true
};

export const BotWithDetails = Template.bind({});
BotWithDetails.args = {
    player: {name: "Roidrage", id: "1", role: "Bot", champions: [], isUser: false},
    showPlayerDetails: true
};

export const SuppWithDetails = Template.bind({});
SuppWithDetails.args = {
    player: {name: "Roidrage", id: "1", role: "Supp", champions: [], isUser: false},
    showPlayerDetails: true
};

export const EmptyTop = Template.bind({});
EmptyTop.args = {
    player: {name: "", id: "1", role: "Top", champions: [], isUser: false},
    showPlayerDetails: false
};

export const EmptyMid = Template.bind({});
EmptyMid.args = {
    player: {name: "", id: "1", role: "Mid", champions: [], isUser: false},
    showPlayerDetails: false
};

export const EmptyJg = Template.bind({});
EmptyJg.args = {
    player: {name: "", id: "1", role: "Jg", champions: [], isUser: false},
    showPlayerDetails: false
};

export const EmptyBot = Template.bind({});
EmptyBot.args = {
    player: {name: "", id: "1", role: "Bot", champions: [], isUser: false},
    showPlayerDetails: false
};

export const EmptySupp = Template.bind({});
EmptySupp.args = {
    player: {name: "", id: "1", role: "Supp", champions: [], isUser: false},
    showPlayerDetails: false
};
