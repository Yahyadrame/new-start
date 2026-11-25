import { HttpException } from '@nestjs/common';
import type { ContactVariant, ContactVariants } from '@newstart/shared';

export const CONTACT_VARIANTS_STORE = Symbol('CONTACT_VARIANTS_STORE');

export interface ContactVariantsStore {
  list(userId: string): Promise<ContactVariants>;
  /** Enregistre les réglages (ils remplacent les précédents) ; false si le contact n'existe pas. */
  set(userId: string, slug: string, variant: ContactVariant): Promise<boolean>;
  /** Revient au ton et à la difficulté d'origine du contact. */
  clear(userId: string, slug: string): Promise<void>;
}

export class ContactVariantsService {
  constructor(private readonly store: ContactVariantsStore) {}

  list(userId: string) {
    return this.store.list(userId);
  }

  async set(userId: string, slug: string, variant: ContactVariant) {
    if (!(await this.store.set(userId, slug, variant))) {
      throw new HttpException(
        { code: 'AGENT_NOT_FOUND', message: "Ce contact n'existe pas." },
        404,
      );
    }
    return variant;
  }

  clear(userId: string, slug: string) {
    return this.store.clear(userId, slug);
  }
}
