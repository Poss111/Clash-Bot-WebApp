// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Story, Meta} from "@storybook/angular/types-6-0";
import {moduleMetadata} from "@storybook/angular";
import {MatCardModule} from "@angular/material/card";
import {ClashTournamentCalendarComponent} from "./clash-tournament-calendar.component";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatButtonModule} from "@angular/material/button";
import {
    ClashTournamentCalendarHeaderComponent
} from "../clash-tournament-calendar-header/clash-tournament-calendar-header.component";
import {MatIconModule} from "@angular/material/icon";

export default {
    title: "Cards/ClashTournamentCalendarCard",
    component: ClashTournamentCalendarComponent,
    // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
    argTypes: {},
    decorators: [
        moduleMetadata({
            declarations: [ClashTournamentCalendarHeaderComponent],
            imports: [MatCardModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatIconModule],
        })
    ]
} as Meta;

const Template: Story<ClashTournamentCalendarComponent> = (args: ClashTournamentCalendarComponent) => ({
    props: args,
});

export const NoDates = Template.bind({});
NoDates.args = {
    daysSelected: []
};
