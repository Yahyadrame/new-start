import { z } from 'zod';

/**
 * Les stickers de New Start : des visages composés de pièces (yeux, sourcils, bouche, accessoire).
 * Le dessin est rendu côté web à partir de `parts` ; la maquette est `design/stickers/`.
 */
export const STICKER_GROUPS = ['Politesse', 'Accord', 'Joie', 'Émotions', 'Quotidien'] as const;
export type StickerGroup = (typeof STICKER_GROUPS)[number];

export interface Sticker {
  id: string;
  /** La légende en anglais : c'est aussi le texte du message, que le contact lit. */
  text: string;
  group: StickerGroup;
  /** Yeux, sourcils, bouche, accessoire. */
  parts: readonly [string, string, string, string];
}

const ROWS: readonly [string, string, StickerGroup, string, string, string, string][] = [
  ['thanks', 'Thanks!', 'Politesse', 'happy', 'none', 'smile', 'hearts'],
  ['please', 'Please!', 'Politesse', 'wide', 'sad', 'smile', 'none'],
  ['sorry', 'Sorry!', 'Politesse', 'dot', 'sad', 'frown', 'sweat'],
  ['excuse-me', 'Excuse me', 'Politesse', 'side', 'one', 'flat', 'none'],
  ['welcome', "You're welcome", 'Politesse', 'happy', 'none', 'grin', 'none'],
  ['hello', 'Hello!', 'Politesse', 'dot', 'none', 'smile', 'wave'],
  ['good-morning', 'Good morning!', 'Politesse', 'happy', 'none', 'grin', 'cup'],
  ['good-night', 'Good night!', 'Politesse', 'sleepy', 'none', 'smile', 'zzz'],
  ['bye', 'Bye!', 'Politesse', 'wink', 'none', 'smile', 'wave'],
  ['see-you', 'See you!', 'Politesse', 'dot', 'none', 'smile', 'wave'],
  ['cheers', 'Cheers!', 'Politesse', 'wink', 'none', 'laugh', 'clap'],
  ['take-care', 'Take care', 'Politesse', 'happy', 'none', 'smile', 'blush'],
  ['got-it', 'Got it!', 'Accord', 'wink', 'none', 'smile', 'check'],
  ['yes', 'Yes!', 'Accord', 'dot', 'none', 'grin', 'thumb'],
  ['no', 'No!', 'Accord', 'dot', 'angry', 'flat', 'cross'],
  ['sure', 'Sure!', 'Accord', 'wink', 'none', 'smirk', 'none'],
  ['maybe', 'Maybe', 'Accord', 'side', 'one', 'wavy', 'none'],
  ['of-course', 'Of course!', 'Accord', 'shades', 'none', 'smirk', 'none'],
  ['agreed', 'Agreed', 'Accord', 'closed', 'none', 'smile', 'check'],
  ['dont-know', "I don't know", 'Accord', 'side', 'sad', 'wavy', 'q'],
  ['never-mind', 'Never mind', 'Accord', 'closed', 'none', 'flat', 'none'],
  ['no-problem', 'No problem', 'Accord', 'happy', 'none', 'smile', 'thumb'],
  ['really', 'Really?', 'Accord', 'wide', 'one', 'flat', 'q'],
  ['what', 'What?', 'Accord', 'wide', 'up', 'o', 'q'],
  ['well-done', 'Well done!', 'Joie', 'dot', 'up', 'grin', 'clap'],
  ['congrats', 'Congrats!', 'Joie', 'happy', 'none', 'laugh', 'party'],
  ['love-it', 'Love it!', 'Joie', 'heart', 'none', 'smile', 'blush'],
  ['haha', 'Haha!', 'Joie', 'happy', 'none', 'laugh', 'none'],
  ['lol', 'LOL', 'Joie', 'cross', 'none', 'big', 'none'],
  ['yay', 'Yay!', 'Joie', 'happy', 'up', 'grin', 'clap'],
  ['cool', 'Cool!', 'Joie', 'shades', 'none', 'smile', 'none'],
  ['awesome', 'Awesome!', 'Joie', 'wide', 'up', 'grin', 'thumb'],
  ['good-luck', 'Good luck!', 'Joie', 'wink', 'none', 'smile', 'thumb'],
  ['happy-birthday', 'Happy birthday!', 'Joie', 'happy', 'none', 'laugh', 'party'],
  ['have-fun', 'Have fun!', 'Joie', 'wink', 'none', 'tongue', 'none'],
  ['miss-you', 'Miss you', 'Joie', 'sleepy', 'sad', 'smile', 'hearts'],
  ['wow', 'Wow!', 'Émotions', 'wide', 'up', 'o', 'excl'],
  ['no-way', 'No way!', 'Émotions', 'wide', 'up', 'o', 'none'],
  ['oops', 'Oops!', 'Émotions', 'wide', 'none', 'wavy', 'sweat'],
  ['hmm', 'Hmm…', 'Émotions', 'dot', 'one', 'flat', 'dots'],
  ['ouch', 'Ouch!', 'Émotions', 'cross', 'sad', 'teeth', 'none'],
  ['so-sad', 'So sad', 'Émotions', 'tear', 'sad', 'frown', 'none'],
  ['tired', "I'm tired", 'Émotions', 'sleepy', 'none', 'yawn', 'zzz'],
  ['hungry', "I'm hungry", 'Émotions', 'wide', 'sad', 'o', 'fork'],
  ['angry', "I'm angry", 'Émotions', 'dot', 'angry', 'teeth', 'mad'],
  ['bored', "I'm bored", 'Émotions', 'side', 'none', 'flat', 'dots'],
  ['nervous', "I'm nervous", 'Émotions', 'wide', 'sad', 'wavy', 'sweat'],
  ['help', 'Help!', 'Émotions', 'wide', 'sad', 'big', 'excl'],
  ['relax', 'Relax', 'Émotions', 'closed', 'none', 'smile', 'none'],
  ['silly', 'Silly you!', 'Émotions', 'wink', 'none', 'tongue', 'none'],
  ['kiss', 'Kiss!', 'Émotions', 'wink', 'none', 'kiss', 'hearts'],
  ['dizzy', 'I feel dizzy', 'Émotions', 'cross', 'none', 'wavy', 'none'],
  ['lets-go', "Let's go!", 'Quotidien', 'dot', 'angry', 'grin', 'none'],
  ['wait', 'Wait a sec', 'Quotidien', 'side', 'one', 'flat', 'clock'],
  ['on-my-way', 'On my way', 'Quotidien', 'dot', 'none', 'smile', 'check'],
  ['be-right-back', 'Be right back', 'Quotidien', 'wink', 'none', 'smirk', 'clock'],
  ['call-me', 'Call me', 'Quotidien', 'wink', 'none', 'smile', 'phone'],
  ['coffee', 'Coffee time!', 'Quotidien', 'sleepy', 'none', 'smile', 'cup'],
  ['lunch', 'Lunch time!', 'Quotidien', 'happy', 'none', 'laugh', 'fork'],
  ['busy', "I'm busy", 'Quotidien', 'side', 'angry', 'flat', 'clock'],
  ['on-it', "I'm on it", 'Quotidien', 'dot', 'angry', 'smirk', 'check'],
  ['almost', 'Almost there', 'Quotidien', 'dot', 'none', 'wavy', 'dots'],
  ['good-job-me', 'I did it!', 'Quotidien', 'happy', 'up', 'grin', 'thumb'],
];

export const STICKERS: readonly Sticker[] = ROWS.map(([id, text, group, ...parts]) => ({
  id,
  text,
  group,
  parts: parts as unknown as Sticker['parts'],
}));

export const STICKER_IDS = STICKERS.map((s) => s.id) as [string, ...string[]];

/** L'identifiant d'un sticker de la liste. */
export const StickerId = z.enum(STICKER_IDS);

/** La légende d'un sticker, ou undefined si l'identifiant est inconnu. */
export function stickerText(id: string): string | undefined {
  return STICKERS.find((s) => s.id === id)?.text;
}
