import { setCompodocJson } from "@storybook/addon-docs/angular";
import docJson from "../documentation.json";
import { themes } from '@storybook/theming';
setCompodocJson(docJson);

export const parameters = {
  darkMode: {
    dark: { ...themes.dark, appBg: 'black' },
    classTarget: 'html',
    stylePreview: true
  },
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: { inlineStories: true },
}

localStorage.setItem('leagueApiVersion', '12.14.1')