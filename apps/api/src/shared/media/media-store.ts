import { Logger } from '@nestjs/common';
import { AwsClient } from 'aws4fetch';

/** Port de stockage des photos et des vocaux. Les fichiers sont privés : on les lit par URL signée. */
export interface MediaStore {
  put(input: { key: string; data: Uint8Array; contentType: string }): Promise<void>;
  /** URL de lecture qui expire au bout de `ttlSeconds` (7 jours au plus chez B2 et R2). */
  signedUrl(key: string, ttlSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

/** Adaptateur factice pour les tests : fichiers en mémoire, URL prévisibles. */
export class FakeMediaStore implements MediaStore {
  readonly files = new Map<string, Uint8Array>();

  async put(input: { key: string; data: Uint8Array }): Promise<void> {
    this.files.set(input.key, input.data);
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    return `https://media.fake.test/${key}?expires=${ttlSeconds}`;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
}

export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  keyId: string;
  secret: string;
};

/** Stockage compatible S3 (Backblaze B2, Cloudflare R2). Les clés viennent de l'API, jamais du client. */
export class S3MediaStore implements MediaStore {
  private readonly client: AwsClient;

  constructor(
    private readonly config: S3Config,
    private readonly fetcher: (request: Request) => Promise<Response> = fetch,
  ) {
    this.client = new AwsClient({
      accessKeyId: config.keyId,
      secretAccessKey: config.secret,
      region: config.region,
      service: 's3',
    });
  }

  async put(input: { key: string; data: Uint8Array; contentType: string }): Promise<void> {
    await this.send('PUT', input.key, {
      body: new Uint8Array(input.data),
      headers: { 'content-type': input.contentType },
    });
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    const url = new URL(this.url(key));
    url.searchParams.set('X-Amz-Expires', String(ttlSeconds));
    const request = await this.client.sign(url.href, { aws: { signQuery: true } });
    return request.url;
  }

  async delete(key: string): Promise<void> {
    await this.send('DELETE', key);
  }

  private url(key: string): string {
    return `${this.config.endpoint.replace(/\/$/, '')}/${this.config.bucket}/${key}`;
  }

  private async send(method: 'PUT' | 'DELETE', key: string, init: RequestInit = {}) {
    const request = await this.client.sign(this.url(key), { ...init, method });
    const response = await this.fetcher(request);
    // Supprimer un fichier déjà parti n'est pas une erreur. Le message ne nomme pas le fichier.
    if (response.ok || (method === 'DELETE' && response.status === 404)) return;
    throw new Error(`Stockage des médias : ${method} refusé (${response.status})`);
  }
}

const PROVIDERS = ['b2', 'r2'] as const;
export type MediaProvider = (typeof PROVIDERS)[number];

export type MediaStores = {
  /** Fournisseur des nouveaux fichiers ; null : l'envoi de médias est indisponible. */
  active: MediaProvider | null;
  /** Tous les fournisseurs configurés, pour relire les fichiers écrits avant un changement. */
  stores: Partial<Record<MediaProvider, MediaStore>>;
};

/** Un fournisseur est configuré quand ses cinq variables `MEDIA_<NOM>_*` sont remplies. */
export function createMediaStores(env: Record<string, string | undefined>): MediaStores {
  const stores: MediaStores['stores'] = {};
  for (const provider of PROVIDERS) {
    const read = (name: string) => env[`MEDIA_${provider.toUpperCase()}_${name}`] ?? '';
    const config: S3Config = {
      endpoint: read('ENDPOINT'),
      region: read('REGION'),
      bucket: read('BUCKET'),
      keyId: read('KEY_ID'),
      secret: read('SECRET'),
    };
    if (Object.values(config).every(Boolean)) stores[provider] = new S3MediaStore(config);
  }
  const active = PROVIDERS.find((p) => p === env.MEDIA_PROVIDER && stores[p]) ?? null;
  return { active, stores };
}

/** Un fichier rangé : sa clé et le fournisseur qui le détient. */
export type StoredFile = { key: string; provider: string };

const DELETE_BATCH = 20;
const log = new Logger('MediaStore');

/** Efface des fichiers devenus inutiles. Ne lève jamais : leur message ou leur compte est déjà effacé. */
export async function deleteFiles({ stores }: MediaStores, files: StoredFile[]): Promise<void> {
  const unique = [...new Map(files.map((file) => [file.key, file])).values()];
  let failed = 0;
  // ponytail: aucun nouvel essai ; un fichier refusé reste chez le stockage jusqu'à une tâche de reprise
  for (let start = 0; start < unique.length; start += DELETE_BATCH) {
    const results = await Promise.allSettled(
      unique.slice(start, start + DELETE_BATCH).map(async ({ key, provider }) => {
        const store = stores[provider as MediaProvider];
        if (!store) throw new Error('Stockage des médias : fournisseur non configuré');
        await store.delete(key);
      }),
    );
    failed += results.filter((result) => result.status === 'rejected').length;
  }
  if (failed) log.warn(`Stockage des médias : ${failed} fichier(s) non effacé(s).`);
}
