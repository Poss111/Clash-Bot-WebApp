import {moduleMetadata} from "@storybook/angular";
import {Meta, Story} from "@storybook/angular/types-6-0";
import {ServerFormComponent} from "./server-form.component";
import {DiscordGuild} from "../../interfaces/discord-guild";
import {ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatInputModule} from "@angular/material/input";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatFormFieldModule} from "@angular/material/form-field";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

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

export default {
    title: "Shared/ServerForm",
    component: ServerFormComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [],
            imports: [
                MatFormFieldModule,
                ReactiveFormsModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatInputModule,
                BrowserAnimationsModule
            ],
        })
    ]
} as Meta;

const Template: Story<ServerFormComponent> = (args: ServerFormComponent) => ({
    props: args,
});

export const Primary = Template.bind({});
Primary.args = {
    serverNames: guildMap
};