'use client';

import fr from '../../shared/i18n/fr.json';

const c = fr.conversation;

/** Les émojis du quotidien, sans bibliothèque : de quoi réagir et se détendre en anglais comme en français. */
export const EMOJIS = [
  '😀',
  '😂',
  '🥹',
  '😊',
  '😍',
  '🥰',
  '😎',
  '🤔',
  '😅',
  '😭',
  '😮',
  '😴',
  '🙄',
  '😬',
  '🤝',
  '🙏',
  '👍',
  '👎',
  '👏',
  '🙌',
  '💪',
  '👋',
  '✌️',
  '🤞',
  '❤️',
  '🔥',
  '✨',
  '🎉',
  '🎶',
  '☕',
  '🍕',
  '🌍',
  '✈️',
  '📚',
  '💡',
  '✅',
  '❌',
  '❓',
  '💬',
  '🎧',
];

/** Les émojis, pour l'ordinateur : sur téléphone, le clavier les propose déjà. Un toucher en ajoute un au message. */
export function EmojiPanel({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <ul className="grid h-full grid-cols-8 content-start gap-1 overflow-y-auto overscroll-contain">
      {EMOJIS.map((emoji) => (
        <li key={emoji}>
          <button
            type="button"
            aria-label={c.emojiInsert.replace('{emoji}', emoji)}
            onClick={() => onPick(emoji)}
            className="grid size-11 w-full place-items-center rounded-xl text-2xl hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-text"
          >
            {emoji}
          </button>
        </li>
      ))}
    </ul>
  );
}
