'use client';

import type { AvatarChoice, ContactAvatars } from '@newstart/shared';
import { useSyncExternalStore } from 'react';
import { getContactAvatars, saveContactAvatar } from './contact-avatars-api';

/** Les choix de la personne, gardés en mémoire pour que toutes les listes montrent la même silhouette. */
let choices: ContactAvatars = {};
const listeners = new Set<() => void>();
const publish = (next: ContactAvatars) => {
  choices = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

/** Le choix de la personne pour ce contact, ou null : il garde alors sa silhouette d'origine. */
export function useContactChoice(slug: string): AvatarChoice | null {
  return useSyncExternalStore(
    subscribe,
    () => choices[slug] ?? null,
    () => null,
  );
}

/** Charge les choix ; un échec laisse les silhouettes d'origine, l'écran reste utilisable. */
export async function loadContactAvatars(token: string): Promise<void> {
  try {
    publish(await getContactAvatars(token));
  } catch {
    /* rien : les silhouettes d'origine suffisent */
  }
}

export async function chooseContactAvatar(
  token: string,
  slug: string,
  choice: AvatarChoice | null,
): Promise<void> {
  await saveContactAvatar(token, slug, choice);
  const others = Object.entries(choices).filter(([key]) => key !== slug);
  publish(Object.fromEntries(choice ? [...others, [slug, choice]] : others));
}

/** Pour les tests : repart d'une mémoire vide. */
export const resetContactAvatars = () => publish({});
