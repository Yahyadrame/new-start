import { HttpException } from '@nestjs/common';
import type { Me, MePatch } from '@newstart/shared';
import {
  deleteFiles,
  type MediaStores,
  type StoredFile,
} from '../../../shared/media/media-store.js';

export const ME_STORE = Symbol('ME_STORE');

export interface MeStore {
  find(userId: string): Promise<Me | null>;
  /** Applique les modifications et renvoie le profil à jour, ou null si le compte n'existe plus. */
  update(userId: string, patch: MePatch): Promise<Me | null>;
  /** Toutes les données personnelles du compte, ou null si le compte n'existe plus. */
  exportData(userId: string): Promise<Record<string, unknown> | null>;
  /**
   * Supprime le compte et tout ce qui s'y rattache en base, et rend ses fichiers (vocaux, photos)
   * à effacer ; null si le compte n'existait plus.
   */
  remove(userId: string): Promise<StoredFile[] | null>;
}

const notFound = () =>
  new HttpException({ code: 'ACCOUNT_NOT_FOUND', message: "Ce compte n'existe plus." }, 404);

export class MeService {
  constructor(
    private readonly store: MeStore,
    private readonly media: MediaStores,
  ) {}

  async get(userId: string) {
    return (await this.store.find(userId)) ?? Promise.reject(notFound());
  }

  async update(userId: string, patch: MePatch) {
    return (await this.store.update(userId, patch)) ?? Promise.reject(notFound());
  }

  async export(userId: string) {
    const data = (await this.store.exportData(userId)) ?? (await Promise.reject(notFound()));
    return { exportedAt: new Date().toISOString(), ...data };
  }

  async remove(userId: string) {
    const files = await this.store.remove(userId);
    if (!files) throw notFound();
    // Sans attendre : un compte peut avoir des milliers de photos. `deleteFiles` ne rejette jamais.
    // ponytail: un redémarrage pendant l'effacement laisse des fichiers sous `image/<compte>/` ; file de tâches si ça arrive
    void deleteFiles(this.media, files);
  }
}
