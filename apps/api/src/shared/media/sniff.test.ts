import { describe, expect, it } from 'vitest';
import { sniffMedia } from './sniff.js';

/** Des octets de début de fichier : texte ASCII et valeurs, complétés par des zéros. */
const head = (...parts: (string | number)[]) => {
  const bytes = parts.flatMap((p) => (typeof p === 'string' ? [...Buffer.from(p, 'latin1')] : [p]));
  return new Uint8Array([...bytes, ...new Array<number>(16).fill(0)]);
};

describe('sniffMedia', () => {
  it.each([
    ['JPEG', head(0xff, 0xd8, 0xff), 'IMAGE', 'image/jpeg', 'jpg'],
    ['PNG', head(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a), 'IMAGE', 'image/png', 'png'],
    ['WebP', head('RIFF', 0, 0, 0, 0, 'WEBP'), 'IMAGE', 'image/webp', 'webp'],
    ['WebM', head(0x1a, 0x45, 0xdf, 0xa3), 'AUDIO', 'audio/webm', 'webm'],
    ['Ogg', head('OggS'), 'AUDIO', 'audio/ogg', 'ogg'],
    ['MP4 de Safari', head(0, 0, 0, 24, 'ftypiso5'), 'AUDIO', 'audio/mp4', 'mp4'],
    ['M4A', head(0, 0, 0, 24, 'ftypM4A '), 'AUDIO', 'audio/mp4', 'mp4'],
  ])('reconnaît un fichier %s à ses premiers octets', (_, bytes, kind, contentType, ext) => {
    expect(sniffMedia(bytes)).toEqual({ kind, contentType, ext });
  });

  it.each([
    ['un fichier vide', new Uint8Array(0)],
    ['un PDF', head('%PDF-1.7')],
    ['une page HTML', head('<!doctype html>')],
    ['un SVG', head('<svg xmlns=')],
    ['un son WAV', head('RIFF', 0, 0, 0, 0, 'WAVE')],
    ['une photo HEIC', head(0, 0, 0, 24, 'ftypheic')],
    ['une image AVIF', head(0, 0, 0, 24, 'ftypavif')],
    ['un PNG tronqué', new Uint8Array([0x89, 0x50])],
  ])('refuse %s', (_, bytes) => {
    expect(sniffMedia(bytes)).toBeNull();
  });
});
