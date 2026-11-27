import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { createMediaStores, deleteFiles, FakeMediaStore, S3MediaStore } from './media-store.js';

const config = {
  endpoint: 'https://s3.example.test',
  region: 'eu-central-003',
  bucket: 'medias',
  keyId: 'key-id',
  secret: 'tres-secret',
};
const put = { key: 'audio/u1/m1.webm', data: new Uint8Array([1, 2, 3]), contentType: 'audio/webm' };

function s3(status = 200) {
  const sent: Request[] = [];
  const store = new S3MediaStore(config, async (request) => {
    sent.push(request);
    return new Response(null, { status });
  });
  /** La seule requête envoyée au stockage. */
  const request = () => {
    const [first] = sent;
    if (!first) throw new Error('aucune requête envoyée');
    return first;
  };
  return { store, sent, request };
}

describe('FakeMediaStore', () => {
  it('garde le fichier, signe une URL prévisible et le supprime', async () => {
    const store = new FakeMediaStore();
    await store.put(put);
    expect(store.files.get(put.key)).toBe(put.data);
    expect(await store.signedUrl(put.key, 60)).toBe(
      'https://media.fake.test/audio/u1/m1.webm?expires=60',
    );
    await store.delete(put.key);
    await store.delete('absent');
    expect(store.files.size).toBe(0);
  });
});

describe('S3MediaStore', () => {
  it('envoie le fichier signé dans le bucket', async () => {
    const s = s3();
    await s.store.put(put);
    const request = s.request();
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('https://s3.example.test/medias/audio/u1/m1.webm');
    expect(request.headers.get('content-type')).toBe('audio/webm');
    expect(request.headers.get('authorization')).toContain('Credential=key-id/');
    expect(request.headers.get('authorization')).toContain('/eu-central-003/s3/aws4_request');
    expect(new Uint8Array(await request.arrayBuffer())).toEqual(put.data);
  });

  it('signale un envoi refusé sans nommer le fichier', async () => {
    const error = await s3(403)
      .store.put(put)
      .catch((e: Error) => e.message);
    expect(error).toBe('Stockage des médias : PUT refusé (403)');
  });

  it('signe une URL de lecture qui expire, sans exposer le secret', async () => {
    const { store, sent } = s3();
    const url = new URL(await store.signedUrl(put.key, 3600));
    expect(url.pathname).toBe('/medias/audio/u1/m1.webm');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('3600');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    expect(url.href).not.toContain(config.secret);
    expect(sent).toHaveLength(0);
  });

  it('supprime le fichier, même déjà absent', async () => {
    const s = s3(204);
    await s.store.delete(put.key);
    expect(s.request().method).toBe('DELETE');
    await expect(s3(404).store.delete(put.key)).resolves.toBeUndefined();
    await expect(s3(500).store.delete(put.key)).rejects.toThrow('DELETE refusé (500)');
  });
});

describe('createMediaStores', () => {
  const vars = (name: string) => ({
    [`MEDIA_${name}_ENDPOINT`]: config.endpoint,
    [`MEDIA_${name}_REGION`]: config.region,
    [`MEDIA_${name}_BUCKET`]: config.bucket,
    [`MEDIA_${name}_KEY_ID`]: config.keyId,
    [`MEDIA_${name}_SECRET`]: config.secret,
  });

  it('reste éteint sans variables', () => {
    expect(createMediaStores({})).toEqual({ active: null, stores: {} });
  });

  it('écrit chez le fournisseur choisi et garde les autres pour relire', () => {
    const { active, stores } = createMediaStores({
      MEDIA_PROVIDER: 'r2',
      ...vars('B2'),
      ...vars('R2'),
    });
    expect(active).toBe('r2');
    expect(stores.b2).toBeInstanceOf(S3MediaStore);
    expect(stores.r2).toBeInstanceOf(S3MediaStore);
  });

  it("n'active pas un fournisseur inconnu ou incomplet", () => {
    expect(createMediaStores({ MEDIA_PROVIDER: 'autre', ...vars('B2') }).active).toBeNull();
    const partial = { MEDIA_PROVIDER: 'b2', ...vars('B2'), MEDIA_B2_SECRET: '' };
    expect(createMediaStores(partial)).toEqual({ active: null, stores: {} });
  });
});

describe('deleteFiles', () => {
  const file = (key: string, provider = 'r2') => ({ key, provider });

  it('efface chaque fichier une fois, chez le fournisseur qui le détient', async () => {
    const [b2, r2] = [new FakeMediaStore(), new FakeMediaStore()];
    const removed = [vi.spyOn(b2, 'delete'), vi.spyOn(r2, 'delete')];
    await deleteFiles({ active: 'r2', stores: { b2, r2 } }, [
      file('image/u1/a.jpg', 'b2'),
      file('image/u1/b.jpg'),
      file('image/u1/b.jpg'),
    ]);
    expect(removed[0]?.mock.calls).toEqual([['image/u1/a.jpg']]);
    expect(removed[1]?.mock.calls).toEqual([['image/u1/b.jpg']]);
  });

  it('efface aussi au-delà d’un lot', async () => {
    const r2 = new FakeMediaStore();
    const removed = vi.spyOn(r2, 'delete');
    const files = Array.from({ length: 45 }, (_, i) => file(`image/u1/${i}.jpg`));
    await deleteFiles({ active: 'r2', stores: { r2 } }, files);
    expect(removed).toHaveBeenCalledTimes(45);
  });

  it('ne lève rien quand un fichier résiste, continue, et journalise sans le nommer', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const r2 = new FakeMediaStore();
    const removed = vi.spyOn(r2, 'delete').mockRejectedValueOnce(new Error('panne'));
    await deleteFiles({ active: 'r2', stores: { r2 } }, [
      file('image/u1/a.jpg'),
      file('image/u1/b.jpg'),
      file('image/u1/c.jpg', 'b2'),
    ]);
    expect(removed).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls).toEqual([['Stockage des médias : 2 fichier(s) non effacé(s).']]);
    warn.mockRestore();
  });

  it('ne journalise rien quand tout est effacé', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    await deleteFiles({ active: null, stores: {} }, []);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
