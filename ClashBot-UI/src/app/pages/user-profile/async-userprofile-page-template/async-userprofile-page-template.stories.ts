// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Meta, Story} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {FilterType} from "../../../interfaces/filter-type";
import {AsyncUserprofilePageTemplateComponent} from "./async-userprofile-page-template.component";
import {LoginStatus} from "../../../login-status";
import {ChampionListInputComponent} from "../inputs/champion-list-input/champion-list-input.component";
import {UserDetailsInputComponent} from "../inputs/user-details-input/user-details-input.component";

export default {
    title: "Pages/AsyncUserProfile",
    component: AsyncUserprofilePageTemplateComponent,
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [
                ChampionListInputComponent,
                UserDetailsInputComponent
            ],
            imports: [],
        })
    ]
} as Meta;

const Template: Story<AsyncUserprofilePageTemplateComponent> = (args: AsyncUserprofilePageTemplateComponent) => ({
    props: {
        ...args,
    },
});

const createMockGuild = (name: string, id: string) => {
    return {
        features: [],
        icon: "",
        id,
        name,
        owner: false,
        permissions: 0,
        permissions_new: ""
    }
};

const createMockFilter = (name: string, id: string, numberOfTeams: number = 0) => {
    return {
        value: createMockGuild(name, id),
        type: FilterType.SERVER,
        state: false,
        id: id,
        numberOfTeams
    }
};

export const Primary = Template.bind({});
Primary.args = {
    applicationDetails:  {loggedIn: false, loginStatus: LoginStatus.NOT_LOGGED_IN}
};
