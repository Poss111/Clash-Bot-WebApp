// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import {Story, Meta} from '@storybook/angular/types-6-0';
import {TeamCardComponent} from "./team-card.component";
import {moduleMetadata} from '@storybook/angular';
import {MatDialogModule} from "@angular/material/dialog";
import {MatCardModule} from "@angular/material/card";
import {SharedModule} from "../../../../shared/shared.module";
import {TeamCardPlayerDetailsComponent} from "./team-card-player-details/team-card-player-details.component";
import {TournamentNameTransformerPipe} from "../../../../tournament-name-transformer.pipe";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatExpansionModule} from "@angular/material/expansion";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatIconRegisteryModule} from "../mat-icon-registery.module";

export default {
  title: 'Cards/TeamCard',
  component: TeamCardComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {},
  decorators: [
    moduleMetadata({
      declarations: [TeamCardPlayerDetailsComponent, TournamentNameTransformerPipe],
      imports: [
        MatDialogModule,
        MatCardModule,
        SharedModule,
        MatIconModule,
        MatButtonModule,
        MatExpansionModule,
        BrowserAnimationsModule,
        MatIconRegisteryModule
      ],
    })
  ]
} as Meta;

const Template: Story<TeamCardComponent> = (args: TeamCardComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  team: {
    teamName: 'Team Charizard',
    playersDetails: [
      {
        name: 'Roidrage',
        id: 1,
        role: 'Top',
        champions: ['Sett', 'Volibear', 'Ornn'],
        isUser: true
      },
      {
        name: 'Shiragaku',
        id: 1,
        role: 'Mid',
        champions: ['Ahri', 'Seraphine', 'Nami']
      },
      {
        name: 'Sirpryse',
        id: 1,
        role: 'Jg',
        champions: ['Zac', 'Ekko', 'Taric']
      },
      {
        name: 'TheIncentive',
        id: 1,
        role: 'Bot',
        champions: ['Lucian', 'Senna', 'Jhin']
      },
      {
        name: 'PepeConrad',
        id: 1,
        role: 'Supp',
        champions: ['Thresh', 'Bard', 'Lulu']
      }
    ],
    tournamentDetails: {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1'
    },
    serverName: 'Goon Squad',
    startTime: new Date().toISOString(),
    id: 'charizard'
  }
};

export const Bot = Template.bind({});
Bot.args = {
  team: {
    teamName: 'Team Charizard',
    playersDetails: [
      {
        name: '',
        id: 1,
        role: 'Top',
        champions: [],
        isUser: false
      },
      {
        name: '',
        id: 1,
        role: 'Mid',
        champions: [],
      },
      {
        name: '',
        id: 1,
        role: 'Jg',
        champions: [],
      },
      {
        name: 'TheIncentive',
        id: 1,
        role: 'Bot',
        champions: ['Lucian', 'Senna', 'Jhin']
      },
      {
        name: '',
        id: 1,
        role: 'Supp',
        champions: [],
      }
    ],
    tournamentDetails: {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1'
    },
    serverName: 'Goon Squad',
    startTime: new Date().toISOString(),
    id: 'charizard'
  }
};

export const Mid = Template.bind({});
Mid.args = {
  team: {
    teamName: 'Team Charizard',
    playersDetails: [
      {
        name: '',
        id: 1,
        role: 'Top',
        champions: [],
        isUser: false
      },
      {
        name: '',
        id: 1,
        role: 'Bot',
        champions: []
      },
      {
        name: 'TheIncentive',
        id: 1,
        role: 'Mid',
        champions: ['Lucian', 'Senna', 'Jhin']
      },
      {
        name: '',
        id: 1,
        role: 'Jg',
        champions: [],
      },
      {
        name: '',
        id: 1,
        role: 'Supp',
        champions: [],
      }
    ],
    tournamentDetails: {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1'
    },
    serverName: 'Goon Squad',
    startTime: new Date().toISOString(),
    id: 'charizard'
  }
};

export const Jg = Template.bind({});
Jg.args = {
  team: {
    teamName: 'Team Charizard',
    playersDetails: [
      {
        name: '',
        id: 1,
        role: 'Top',
        champions: [],
        isUser: false
      },
      {
        name: '',
        id: 1,
        role: 'Bot',
        champions: []
      },
      {
        name: '',
        id: 1,
        role: 'Mid',
        champions: []
      },
      {
        name: 'TheIncentive',
        id: 1,
        role: 'Jg',
        champions: ['Lucian', 'Senna', 'Jhin'],
      },
      {
        name: '',
        id: 1,
        role: 'Supp',
        champions: [],
      }
    ],
    tournamentDetails: {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1'
    },
    serverName: 'Goon Squad',
    startTime: new Date().toISOString(),
    id: 'charizard'
  }
};

export const Supp = Template.bind({});
Supp.args = {
  team: {
    teamName: 'Team Charizard',
    playersDetails: [
      {
        name: '',
        id: 1,
        role: 'Top',
        champions: [],
        isUser: false
      },
      {
        name: '',
        id: 1,
        role: 'Bot',
        champions: []
      },
      {
        name: '',
        id: 1,
        role: 'Mid',
        champions: []
      },
      {
        name: '',
        id: 1,
        role: 'Jg',
        champions: [],
      },
      {
        name: 'TheIncentive',
        id: 1,
        role: 'Supp',
        champions: ['Lucian', 'Senna', 'Jhin'],
      }
    ],
    tournamentDetails: {
      tournamentName: 'awesome_sauce',
      tournamentDay: '1'
    },
    serverName: 'Goon Squad',
    startTime: new Date().toISOString(),
    id: 'charizard'
  }
};
