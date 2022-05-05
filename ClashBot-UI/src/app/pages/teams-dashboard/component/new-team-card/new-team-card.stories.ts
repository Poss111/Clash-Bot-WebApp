// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import {NewTeamCardComponent} from "./new-team-card.component";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatIconModule} from "@angular/material/icon";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {KebabCasePipe} from "../../../../shared/kebab-case.pipe";
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {action} from "@storybook/addon-actions";

export default {
    title: 'Cards/NewTeamCard',
    component: NewTeamCardComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [ KebabCasePipe ],
            imports: [
                CommonModule,
                MatCardModule,
                MatButtonModule,
                MatIconModule,
                MatFormFieldModule,
                FormsModule,
                ReactiveFormsModule,
                MatSelectModule,
                BrowserAnimationsModule
            ],
        })
    ]
} as Meta;

const Template: Story<NewTeamCardComponent> = (args: NewTeamCardComponent) => ({
    props: {
      eligibleTournaments: args.eligibleTournaments,
      tournamentControl: new FormControl('', Validators.required),
      roleControl: new FormControl('', Validators.required),
      rolesAsString: ['Top', 'Mid', 'Jg', 'Bot', 'Supp'],
      createNewTeamEvent: action('createNewTeamEvent')
    },
});

export const Primary = Template.bind({});
Primary.args = {
    eligibleTournaments: [
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '2',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '3',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        },
        {
            tournamentName: 'awesome_sauce',
            tournamentDay: '4',
            startTime: new Date().toISOString(),
            registrationTime: new Date().toISOString()
        }
    ]
};
