export type SniffedMedia = { kind: 'AUDIO' | 'IMAGE'; contentType: string; ext: string };

/** Photos HEIC et AVIF : même conteneur que le MP4, mais ce ne sont pas des sons. */
const IMAGE_BRANDS = new Set(['heic', 'heix', 'hevc', 'mif1', 'msf1', 'avif', 'avis']);

/**
 * Type réel d'un fichier reçu, lu dans ses premiers octets ; le `Content-Type` annoncé ne fait pas foi.
 * Rend null pour tout ce qui n'est pas une photo JPEG, PNG, WebP ou un son WebM, Ogg, MP4.
 * ponytail: une vidéo WebM ou MP4 passe pour un son (elle sera seulement transcrite) ; lire les pistes si ça gêne.
 */
export function sniffMedia(bytes: Uint8Array): SniffedMedia | null {
  const at = (offset: number, ascii: string) =>
    Buffer.from(bytes.subarray(offset, offset + ascii.length)).toString('latin1') === ascii;
  const image = (ext: string, contentType = `image/${ext}`): SniffedMedia => ({
    kind: 'IMAGE',
    contentType,
    ext,
  });
  const audio = (ext: string): SniffedMedia => ({
    kind: 'AUDIO',
    contentType: `audio/${ext}`,
    ext,
  });

  if (at(0, '\xff\xd8\xff')) return image('jpg', 'image/jpeg');
  if (at(0, '\x89PNG\r\n\x1a\n')) return image('png');
  if (at(0, 'RIFF') && at(8, 'WEBP')) return image('webp');
  if (at(0, '\x1a\x45\xdf\xa3')) return audio('webm');
  if (at(0, 'OggS')) return audio('ogg');
  const brand = Buffer.from(bytes.subarray(8, 12)).toString('latin1');
  return at(4, 'ftyp') && !IMAGE_BRANDS.has(brand) ? audio('mp4') : null;
}
