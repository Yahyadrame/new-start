import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import './storybook.css';

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: { Clair: 'light', Sombre: 'dark' },
      defaultTheme: 'Clair',
      attributeName: 'data-theme',
    }),
  ],
  parameters: { layout: 'centered' },
};
export default preview;
