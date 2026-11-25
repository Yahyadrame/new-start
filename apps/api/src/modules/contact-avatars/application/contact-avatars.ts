import { HttpException } from '@nestjs/common';
import type { AvatarChoice, ContactAvatars } from '@newstart/shared';

export const CONTACT_AVATARS_STORE = Symbol('CONTACT_AVATARS_STORE');

export interface ContactAvatarsStore {
  list(userId: string): Promise<ContactAvatars>;
  /** Enregistre le choix ; false si le contact n'existe pas. */
  set(userId: string, slug: string, choice: AvatarChoice): Promise<boolean>;
  /** Revient à la silhouette d'origine du contact. */
  clear(userId: string, slug: string): Promise<void>;
}

export class ContactAvatarsService {
  constructor(private readonly store: ContactAvatarsStore) {}

  list(userId: string) {
    return this.store.list(userId);
  }

  async set(userId: string, slug: string, choice: AvatarChoice) {
    if (!(await this.store.set(userId, slug, choice))) {
      throw new HttpException(
        { code: 'AGENT_NOT_FOUND', message: "Ce contact n'existe pas." },
        404,
      );
    }
    return choice;
  }

  clear(userId: string, slug: string) {
    return this.store.clear(userId, slug);
  }
}
