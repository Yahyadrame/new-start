import { ConversationScreen } from '../../../features/chats';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  return <ConversationScreen agentSlug={agentSlug} />;
}
