import fr from '../../shared/i18n/fr.json';

/** Le contact prépare sa réponse. */
export function TypingBubble({ name }: { name: string }) {
  return (
    <li className="self-start">
      <p
        role="status"
        className="rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5 text-[15px] text-text-muted motion-safe:animate-pulse"
      >
        {fr.conversation.typing.replace('{name}', name)}
      </p>
    </li>
  );
}
