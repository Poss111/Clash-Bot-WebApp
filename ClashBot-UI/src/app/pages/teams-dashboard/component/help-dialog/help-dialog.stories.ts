// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Story, Meta} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {HelpDialogComponent} from "./help-dialog.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {TeamsDashboardHelpDialogComponent} from "../teams-dashboard-help-dialog/teams-dashboard-help-dialog.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

export default {
    title: "Shared/TeamDashboardHelpDialog",
    component: HelpDialogComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [TeamsDashboardHelpDialogComponent],
            imports: [MatDialogModule, MatButtonModule, MatIconModule, BrowserAnimationsModule],
        })
    ]
} as Meta;

const Template: Story<HelpDialogComponent> = (args: HelpDialogComponent) => ({
    props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
