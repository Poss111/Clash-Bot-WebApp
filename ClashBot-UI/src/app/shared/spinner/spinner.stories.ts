import {moduleMetadata} from "@storybook/angular";
import {Meta, Story} from "@storybook/angular/types-6-0";
import {SpinnerComponent} from "./spinner.component";

export default {
    title: 'Shared/Spinner',
    component: SpinnerComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [],
            imports: [],
        })
    ]
} as Meta;

const Template: Story<SpinnerComponent> = (args: SpinnerComponent) => ({
    props: args,
});

export const On = Template.bind({});
On.args = {
    showSpinner: true
};

export const Off = Template.bind({});
Off.args = {
    showSpinner: false
};