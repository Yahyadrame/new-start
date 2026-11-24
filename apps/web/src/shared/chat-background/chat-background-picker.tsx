import { CHAT_BACKGROUNDS, type ChatBackground } from '@newstart/shared';
import fr from '../i18n/fr.json';
import { ChatBackdrop } from './chat-backdrop';

const t = fr.chatBackground;

/** Dix pastilles : un aperçu et le nom du fond ; celle du fond choisi est enfoncée. */
export function ChatBackgroundPicker({
  value,
  onChange,
}: {
  value: ChatBackground;
  onChange: (next: ChatBackground) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {CHAT_BACKGROUNDS.map((key) => (
        <li key={key}>
          <button
            type="button"
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className="flex min-h-11 w-full flex-col gap-2 rounded-2xl border border-line p-2 text-left text-[13px] font-semibold aria-pressed:border-accent aria-pressed:ring-2 aria-pressed:ring-accent"
          >
            <span className="relative isolate block h-14 overflow-hidden rounded-xl bg-surface-1">
              <ChatBackdrop value={key} />
            </span>
            <span>{t.names[key]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
