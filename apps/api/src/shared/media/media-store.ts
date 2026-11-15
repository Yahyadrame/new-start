export type MediaKind = 'image' | 'audio';

export type StoredMedia = { key: string; url: string };

/** Paramètres d'un téléversement direct du client, signés côté serveur. */
export type UploadSignature = {
  url: string;
  fields: Record<string, string>;
  expiresAt: Date;
};

/** Port de stockage des médias. Cloudinary en ligne, FakeMediaStore sans clé. */
export interface MediaStore {
  upload(input: { kind: MediaKind; key: string; data: Uint8Array }): Promise<StoredMedia>;
  signUpload(input: { kind: MediaKind; key: string }): Promise<UploadSignature>;
  delete(key: string): Promise<void>;
}

const FAKE_ORIGIN = 'https://media.fake.test';
const SIGNATURE_LIFETIME_MS = 10 * 60 * 1000;

/** Adaptateur factice : fichiers en mémoire, URL prévisibles. */
export class FakeMediaStore implements MediaStore {
  readonly files = new Map<string, Uint8Array>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async upload(input: { kind: MediaKind; key: string; data: Uint8Array }): Promise<StoredMedia> {
    this.files.set(input.key, input.data);
    return { key: input.key, url: `${FAKE_ORIGIN}/${input.kind}/${input.key}` };
  }

  async signUpload(input: { kind: MediaKind; key: string }): Promise<UploadSignature> {
    return {
      url: `${FAKE_ORIGIN}/upload/${input.kind}`,
      fields: { key: input.key, signature: 'fake-signature' },
      expiresAt: new Date(this.now().getTime() + SIGNATURE_LIFETIME_MS),
    };
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
}
