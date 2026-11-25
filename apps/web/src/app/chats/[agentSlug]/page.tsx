import { ConversationScreen } from '../../../features/chats';

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentSlug: string }>;
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const { agentSlug } = await params;
  const { message } = await searchParams;
  return (
    <ConversationScreen
      agentSlug={agentSlug}
      focusMessageId={Array.isArray(message) ? message[0] : message}
    />
  );
}
