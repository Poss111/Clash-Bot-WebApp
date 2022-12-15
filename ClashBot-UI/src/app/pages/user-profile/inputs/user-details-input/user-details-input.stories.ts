// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Meta, Story} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {UserDetailsInputComponent} from "./user-details-input.component";

export default {
    title: "Shared/UserDetailsInputComponent",
    component: UserDetailsInputComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [],
            imports: [],
        })
    ]
} as Meta;

const Template: Story<UserDetailsInputComponent> = (args: UserDetailsInputComponent) => ({
    props: {
        ...args,
    },
});

export const Primary = Template.bind({});
Primary.args = {};
