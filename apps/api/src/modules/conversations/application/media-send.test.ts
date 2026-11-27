import type { SttProvider } from '@newstart/ai';
import { describe, expect, it, vi } from 'vitest';
import { FakeMediaStore } from '../../../shared/media/media-store.js';
import { MediaSend, type MediaLimits } from './media-send.js';
import type { MediaMessagesStore, NewMediaMessage } from './media-messages-store.js';

const CONV = '0198f0a0-0000-7000-8000-000000000001';
const CLIENT = '0198f0a0-0000-4000-8000-000000000002';
const photo = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]);
const voice = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1]);

const rowOf = (media: Partial<NewMediaMessage>) => ({
  id: 'm1',
  author: 'USER' as const,
  translationFr: null,
  correction: null,
  replyTo: null,
  forwarded: false,
  sticker: null,
  reaction: null,
  createdAt: new Date(),
  editedAt: null,
  deletedAt: null,
  text: '',
  ...media,
});

function setup(
  options: { limits?: Partial<MediaLimits>; stt?: Partial<SttProvider>; storage?: boolean } = {},
) {
  const store: MediaMessagesStore = {
    check: vi.fn().mockResolvedValue({ ready: true }),
    sentToday: vi.fn().mockResolvedValue(0),
    hasVoiceConsent: vi.fn().mockResolvedValue(true),
    create: vi.fn(async (_u: string, _c: string, media: NewMediaMessage) => ({
      row: rowOf(media),
      created: true,
    })),
  };
  const stt = {
    name: 'groq',
    transcribe: vi.fn().mockResolvedValue({ text: ' Hello there ' }),
    ...options.stt,
  } as SttProvider;
  const files = new FakeMediaStore();
  const media =
    options.storage === false
      ? { active: null, stores: {} }
      : { active: 'b2' as const, stores: { b2: files } };
  const limits = { voiceEnabled: true, voicePerDay: 30, photosPerDay: 10, ...options.limits };
  const replies = { schedule: vi.fn() };
  const service = new MediaSend(store, stt, media, limits, replies);
  const send = (data: Uint8Array, seconds?: number) =>
    service.send('u1', CONV, { clientId: CLIENT, data, seconds });
  return { store, stt, files, service, send, replies };
}

const refusal = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e: { getStatus(): number; getResponse(): { code: string; message: string } }) => ({
      status: e.getStatus(),
      ...e.getResponse(),
    }),
  );

describe('MediaSend : photo', () => {
  it('range le fichier, enregistre le message et rend son lien de lecture', async () => {
    const { store, stt, files, send } = setup();
    const { message, created } = await send(photo);
    const [key] = [...files.files.keys()];
    expect(key).toMatch(/^image\/u1\/[0-9a-f-]{36}\.jpg$/);
    expect(store.check).toHaveBeenCalledWith('u1', CONV, CLIENT, 'IMAGE', 10);
    expect(store.create).toHaveBeenCalledWith('u1', CONV, {
      clientId: CLIENT,
      kind: 'IMAGE',
      text: '',
      mediaKey: key,
      mediaProvider: 'b2',
      mediaSeconds: null,
    });
    expect(created).toBe(true);
    expect(message.media).toEqual({
      kind: 'IMAGE',
      url: `https://media.fake.test/${key}?expires=3600`,
      seconds: null,
    });
    expect(message).not.toHaveProperty('mediaKey');
    expect(stt.transcribe).not.toHaveBeenCalled();
    expect(store.hasVoiceConsent).not.toHaveBeenCalled();
  });

  it('passe quand les vocaux sont éteints ou la transcription absente', async () => {
    const { send } = setup({ limits: { voiceEnabled: false }, stt: { name: 'fake' } });
    expect((await send(photo)).created).toBe(true);
  });
});

describe('MediaSend : vocal', () => {
  it('transcrit puis enregistre le vocal avec sa durée', async () => {
    const { store, stt, files, send } = setup();
    const { message } = await send(voice, 4);
    const [key] = [...files.files.keys()];
    expect(key).toMatch(/^audio\/u1\/[0-9a-f-]{36}\.webm$/);
    expect(stt.transcribe).toHaveBeenCalledWith({ audio: voice, mimeType: 'audio/webm' });
    expect(store.check).toHaveBeenCalledWith('u1', CONV, CLIENT, 'AUDIO', 30);
    expect(store.create).toHaveBeenCalledWith(
      'u1',
      CONV,
      expect.objectContaining({ kind: 'AUDIO', text: 'Hello there', mediaSeconds: 4 }),
    );
    expect(message.media).toMatchObject({ kind: 'AUDIO', seconds: 4 });
  });

  it.each([undefined, 0, 121, 2.5, Number.NaN])('refuse la durée %s (400)', async (seconds) => {
    const { store, send } = setup();
    expect(await refusal(send(voice, seconds))).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
    });
    expect(store.check).not.toHaveBeenCalled();
  });

  it.each([
    ['éteint par réglage', { limits: { voiceEnabled: false } }],
    ['sans transcription branchée', { stt: { name: 'fake' } }],
    ['si la transcription échoue', { stt: { transcribe: vi.fn().mockRejectedValue(new Error()) } }],
    [
      'si la transcription est celle du repli factice',
      { stt: { transcribe: vi.fn().mockResolvedValue({ text: 'x', fake: true }) } },
    ],
  ])('répond 503 VOICE_UNAVAILABLE %s, sans rien garder', async (_cas, options) => {
    const { store, files, send } = setup(options);
    expect(await refusal(send(voice, 4))).toMatchObject({
      status: 503,
      code: 'VOICE_UNAVAILABLE',
    });
    expect(files.files.size).toBe(0);
    expect(store.create).not.toHaveBeenCalled();
  });

  it('exige l’accord pour les enregistrements (403)', async () => {
    const { store, stt, send } = setup();
    vi.mocked(store.hasVoiceConsent).mockResolvedValue(false);
    expect(await refusal(send(voice, 4))).toMatchObject({
      status: 403,
      code: 'VOICE_CONSENT_REQUIRED',
    });
    expect(stt.transcribe).not.toHaveBeenCalled();
  });
});

describe('MediaSend : refus et renvois', () => {
  it.each([
    ['vocal', voice, 'Tu as envoyé tes 30 vocaux du jour.'],
    ['photo', photo, 'Tu as envoyé tes 10 photos du jour.'],
  ])('répond 429 à la limite du jour (%s)', async (_cas, data, debut) => {
    const { store, stt, files, send } = setup();
    vi.mocked(store.check).mockResolvedValue({ limited: true });
    const error = await refusal(send(data, 4));
    expect(error).toMatchObject({ status: 429, code: 'USAGE_LIMIT' });
    expect(error?.message).toContain(debut);
    expect(stt.transcribe).not.toHaveBeenCalled();
    expect(files.files.size).toBe(0);
  });

  it('rend le message déjà enregistré, même si les vocaux ont été éteints depuis', async () => {
    const { store, stt, files, send } = setup({ limits: { voiceEnabled: false }, storage: false });
    vi.mocked(store.check).mockResolvedValue({ row: rowOf({ text: 'Hi' }), created: false });
    const { message, created } = await send(voice, 4);
    expect(created).toBe(false);
    expect(message.text).toBe('Hi');
    expect(stt.transcribe).not.toHaveBeenCalled();
    expect(files.files.size).toBe(0);
  });

  it('répond 404 pour la conversation d’une autre personne, sans rien ranger', async () => {
    const { store, files, send } = setup();
    vi.mocked(store.check).mockResolvedValue(null);
    expect(await refusal(send(photo))).toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(files.files.size).toBe(0);
  });

  it('répond 503 MEDIA_UNAVAILABLE sans stockage configuré', async () => {
    const { store, send } = setup({ storage: false });
    expect(await refusal(send(photo))).toMatchObject({ status: 503, code: 'MEDIA_UNAVAILABLE' });
    expect(store.create).not.toHaveBeenCalled();
  });

  it.each([
    ['un fichier vide', new Uint8Array(0)],
    ['un autre type de fichier', new Uint8Array([0x25, 0x50, 0x44, 0x46])],
  ])('refuse %s (400)', async (_cas, data) => {
    const { store, send } = setup();
    expect(await refusal(send(data, 4))).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(store.check).not.toHaveBeenCalled();
  });

  it.each([
    ['la conversation', 'zzz', CLIENT, 404],
    ['le clientId', CONV, 'zzz', 400],
  ])('refuse un identifiant mal formé pour %s', async (_cas, conversation, clientId, status) => {
    const { store, service } = setup();
    const sent = service.send('u1', conversation, { clientId, data: photo });
    expect(await refusal(sent)).toMatchObject({ status });
    expect(store.check).not.toHaveBeenCalled();
  });

  it('tient la limite du jour quand les envois partent en même temps', async () => {
    const { store, stt, service } = setup({ limits: { voicePerDay: 1 } });
    let recorded = 0;
    vi.mocked(store.check).mockImplementation(async (_u, _c, _id, _kind, limit) =>
      recorded >= limit ? { limited: true } : { ready: true },
    );
    vi.mocked(store.create).mockImplementation(async (_u, _c, media) => {
      recorded += 1;
      return { row: rowOf(media), created: true };
    });
    const send = (n: number) =>
      service.send('u1', CONV, {
        clientId: `0198f0a0-0000-4000-8000-00000000001${n}`,
        data: voice,
        seconds: 4,
      });
    const [first, second] = await Promise.allSettled([send(1), send(2)]);
    expect(first.status).toBe('fulfilled');
    expect(second).toMatchObject({ status: 'rejected', reason: { status: 429 } });
    expect(stt.transcribe).toHaveBeenCalledTimes(1);
  });

  it('laisse passer l’envoi suivant après un envoi en échec', async () => {
    const { store, send } = setup();
    vi.mocked(store.create).mockRejectedValueOnce(new Error('base indisponible'));
    const [first, second] = await Promise.allSettled([send(photo), send(photo)]);
    expect(first.status).toBe('rejected');
    expect(second.status).toBe('fulfilled');
  });

  it('efface le fichier en trop quand un envoi simultané a gagné', async () => {
    const { store, files, send } = setup();
    vi.mocked(store.create).mockResolvedValue({ row: rowOf({}), created: false });
    expect((await send(photo)).created).toBe(false);
    expect(files.files.size).toBe(0);
  });

  it('efface le fichier quand le message ne peut pas être enregistré', async () => {
    const { store, files, send } = setup();
    vi.mocked(store.create).mockRejectedValue(new Error('base indisponible'));
    await expect(send(photo)).rejects.toThrow('base indisponible');
    expect(files.files.size).toBe(0);
  });
});

describe('MediaSend.voiceAvailability', () => {
  it('annonce le vocal disponible sous la limite du jour', async () => {
    const { store, service } = setup();
    vi.mocked(store.sentToday).mockResolvedValue(29);
    expect(await service.voiceAvailability('u1')).toEqual({ available: true });
    expect(store.sentToday).toHaveBeenCalledWith('u1', 'AUDIO');
  });

  it.each([
    ['disabled', 'quand le réglage coupe les vocaux', { limits: { voiceEnabled: false } }],
    ['unconfigured', 'sans transcription branchée', { stt: { name: 'fake' } }],
    ['unconfigured', 'sans stockage', { storage: false }],
    [
      'disabled',
      'd’abord le réglage, quand tout manque',
      { limits: { voiceEnabled: false }, stt: { name: 'fake' }, storage: false },
    ],
  ])('donne la raison %s %s', async (reason, _cas, options) => {
    const { store, service } = setup(options);
    vi.mocked(store.sentToday).mockResolvedValue(30);
    expect(await service.voiceAvailability('u1')).toEqual({ available: false, reason });
  });

  it('donne la raison quota à la limite du jour', async () => {
    const { store, service } = setup();
    vi.mocked(store.sentToday).mockResolvedValue(30);
    expect(await service.voiceAvailability('u1')).toEqual({ available: false, reason: 'quota' });
  });
});

describe('MediaSend : réponse du contact', () => {
  it.each([
    ['un vocal', voice],
    ['une photo', photo],
  ])('demande une réponse après %s', async (_cas, data) => {
    const { replies, send } = setup();
    await send(data, 4);
    expect(replies.schedule).toHaveBeenCalledExactlyOnceWith(CONV, 'm1');
  });

  it('ne relance pas le contact pour un message déjà enregistré', async () => {
    const { store, replies, send } = setup();
    vi.mocked(store.check).mockResolvedValue({ row: rowOf({}), created: false });
    await send(photo);
    vi.mocked(store.check).mockResolvedValue({ ready: true });
    vi.mocked(store.create).mockResolvedValue({ row: rowOf({}), created: false });
    await send(photo);
    expect(replies.schedule).not.toHaveBeenCalled();
  });
});
