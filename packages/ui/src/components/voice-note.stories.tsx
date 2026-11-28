import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoiceNote } from './voice-note';

/** 40 barres, comme celles que le web calcule : avec moins de barres que de place, l'onde a des trous. */
const PEAKS = Array.from({ length: 40 }, (_, i) => 20 + ((i * 37) % 81));

const meta = {
  title: 'Composants/Message vocal',
  component: VoiceNote,
  args: {
    // Aucun fichier derrière ce lien : les histoires montrent l'apparence, avant la lecture.
    src: '/vocal-exemple.webm',
    seconds: 6,
    peaks: PEAKS,
    labels: { play: 'Écouter le vocal', pause: 'Mettre en pause' },
    unavailableLabel: 'Vocal indisponible',
  },
} satisfies Meta<typeof VoiceNote>;
export default meta;
type Story = StoryObj<typeof meta>;

const bubble = (look: string): NonNullable<Story['decorators']> => [
  (Story) => (
    <div className={`rounded-[18px] px-3 py-2.5 ${look}`}>
      <Story />
    </div>
  ),
];
export const Recu: Story = { decorators: bubble('rounded-bl-[6px] bg-surface-1') };
export const Envoye: Story = {
  args: { tone: 'mine' },
  decorators: bubble('rounded-br-[6px] bg-accent text-on-accent'),
};
export const Expire: Story = { args: { src: null, unavailableLabel: 'Vocal expiré' } };
