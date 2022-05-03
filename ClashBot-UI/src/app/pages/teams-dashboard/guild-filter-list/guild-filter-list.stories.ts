// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Story, Meta} from '@storybook/angular/types-6-0';
import {moduleMetadata} from '@storybook/angular';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {GuildFilterListComponent} from "./guild-filter-list.component";
import {MatChipsModule} from "@angular/material/chips";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";

export default {
    title: 'Shared/GuildFilterList',
    component: GuildFilterListComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [GuildFilterListComponent],
            imports: [
                MatChipsModule,
                MatButtonModule,
                MatIconModule,
                BrowserAnimationsModule,
                FormsModule,
                ReactiveFormsModule
            ],
        })
    ]
} as Meta;

const Template: Story<GuildFilterListComponent> = (args: GuildFilterListComponent) => ({
    props: args,
});

export const Primary = Template.bind({});
Primary.args = {
    teamFilters: [
        {
            value: 'Goon Squad',
            type: 0,
            state: true,
            id: '1'
        },
        {
            value: 'Clash Bot',
            type: 0,
            state: false,
            id: '2'
        },
        {
            value: 'Extraordinary',
            type: 0,
            state: false,
            id: '3'
        },
        {
            value: 'I really do not know',
            type: 0,
            state: false,
            id: '4'
        },
        {
            value: 'Hehhhehehehhehehe',
            type: 0,
            state: false,
            id: '5'
        },
        {
            value: 'HuahUahuaaslf',
            type: 0,
            state: false,
            id: '6'
        },
        {
            value: 'I really do not know what to say',
            type: 0,
            state: false,
            id: '7'
        },
        {
            value: 'The Server',
            type: 0,
            state: false,
            id: '8'
        }
    ]
};

export const DefaultGiven = Template.bind({});
DefaultGiven.args = {
    defaultSelection: 'Clash Bot',
    teamFilters: [
        {
            value: 'Goon Squad',
            type: 0,
            state: false,
            id: '1'
        },
        {
            value: 'Clash Bot',
            type: 0,
            state: false,
            id: '2'
        },
        {
            value: 'Extraordinary',
            type: 0,
            state: false,
            id: '3'
        },
        {
            value: 'I really do not know',
            type: 0,
            state: false,
            id: '4'
        },
        {
            value: 'Hehhhehehehhehehe',
            type: 0,
            state: false,
            id: '5'
        },
        {
            value: 'HuahUahuaaslf',
            type: 0,
            state: false,
            id: '6'
        },
        {
            value: 'I really do not know what to say',
            type: 0,
            state: false,
            id: '7'
        },
        {
            value: 'The Server',
            type: 0,
            state: false,
            id: '8'
        }
    ]
};