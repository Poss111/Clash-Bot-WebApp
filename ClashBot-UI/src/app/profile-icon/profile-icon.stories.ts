// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1

import {ProfileIconComponent} from "./profile-icon.component";
import {moduleMetadata} from "@storybook/angular";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {Meta, Story} from "@storybook/angular/types-6-0";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatDialogModule} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../dialogs/confirmation-dialog/confirmation-dialog.component";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {action} from "@storybook/addon-actions";

export default {
    title: "Shared/ProfileIcon",
    component: ProfileIconComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [
              ConfirmationDialogComponent,
            ],
            imports: [
                MatButtonModule,
                MatIconModule,
                MatMenuModule,
                BrowserAnimationsModule,
                MatDialogModule,
                MatSlideToggleModule,
            ],
        })
    ]
} as Meta;

const Template: Story<ProfileIconComponent> = (args: ProfileIconComponent) => ({
    props: {
        ...args,
        goToSettingsEvent: action("goToSettingsEvent"),
        logOutEvent: action("logOutEvent"),
        toggleDarkModeEvent: action("toggleDarkModeEvent")
    },
});

export const LoggedIn = Template.bind({});
LoggedIn.args = {
    username: "Roidrage",
    loggedIn: true
};

export const LoggedOut = Template.bind({});
LoggedOut.args = {
    username: "",
    loggedIn: false
};