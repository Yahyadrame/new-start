import { ContactAvatarScreen } from '../../../../features/chats';

export default async function ContactAvatarPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  return <ContactAvatarScreen agentSlug={agentSlug} />;
}
