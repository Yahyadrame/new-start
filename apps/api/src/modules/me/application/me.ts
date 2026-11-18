import { HttpException } from '@nestjs/common';
import type { Me, MePatch } from '@newstart/shared';

export const ME_STORE = Symbol('ME_STORE');

export interface MeStore {
  find(userId: string): Promise<Me | null>;
  /** Applique les modifications et renvoie le profil à jour, ou null si le compte n'existe plus. */
  update(userId: string, patch: MePatch): Promise<Me | null>;
}

const notFound = () =>
  new HttpException({ code: 'ACCOUNT_NOT_FOUND', message: "Ce compte n'existe plus." }, 404);

export class MeService {
  constructor(private readonly store: MeStore) {}

  async get(userId: string) {
    return (await this.store.find(userId)) ?? Promise.reject(notFound());
  }

  async update(userId: string, patch: MePatch) {
    return (await this.store.update(userId, patch)) ?? Promise.reject(notFound());
  }
}
