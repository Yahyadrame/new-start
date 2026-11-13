import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { Input } from './input';
import { Skeleton } from './skeleton';
import { Switch } from './switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = { title: 'Primitives/Aperçu', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Champ: Story = {
  render: () => <Input aria-label="Message" placeholder="Écris en anglais…" />,
};
export const Bascule: Story = {
  render: () => <Switch aria-label="Rappels quotidiens" defaultChecked />,
};
export const Onglets: Story = {
  render: () => (
    <Tabs defaultValue="a">
      <TabsList aria-label="Sections">
        <TabsTrigger value="a">Discussions</TabsTrigger>
        <TabsTrigger value="b">Série</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Tes conversations.</TabsContent>
      <TabsContent value="b">L’épisode du jour.</TabsContent>
    </Tabs>
  ),
};
export const Avatars: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>AD</AvatarFallback>
    </Avatar>
  ),
};
export const Badges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge>Nouveau</Badge>
      <Badge variant="neutral">Lu</Badge>
    </div>
  ),
};
export const Chargement: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-11 rounded-full" />
      <Skeleton className="h-4 w-40" />
    </div>
  ),
};
