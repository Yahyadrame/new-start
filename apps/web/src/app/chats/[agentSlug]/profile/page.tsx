import { ContactProfileScreen } from '../../../../features/chats';

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  return <ContactProfileScreen agentSlug={agentSlug} />;
}
