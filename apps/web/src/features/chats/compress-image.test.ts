import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressImage } from './compress-image';

const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
const jpeg = new Blob(['j'], { type: 'image/jpeg' });
const close = vi.fn();
const decode = (width: number, height: number) =>
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width, height, close }));
const getContext = () => vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
const toBlob = () => vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');

beforeEach(() => {
  vi.clearAllMocks();
  getContext().mockReturnValue(context as unknown as CanvasRenderingContext2D);
  toBlob().mockImplementation((done) => done(jpeg));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('compressImage', () => {
  it('réduit le grand côté à 1600 px, garde les proportions et rend un JPEG', async () => {
    decode(3200, 1600);
    expect(await compressImage(new Blob(['x']))).toBe(jpeg);
    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 800);
    expect(toBlob()).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.82);
    expect(close).toHaveBeenCalled();
  });

  it("n'agrandit pas une petite photo", async () => {
    decode(400, 600);
    await compressImage(new Blob(['x']));
    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 400, 600);
  });

  it('rend null quand le navigateur ne sait pas lire l’image', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('format')));
    expect(await compressImage(new Blob(['x']))).toBeNull();
  });

  it('rend null sans contexte de dessin ou quand l’export échoue', async () => {
    decode(10, 10);
    getContext().mockReturnValue(null);
    expect(await compressImage(new Blob(['x']))).toBeNull();
    getContext().mockReturnValue(context as unknown as CanvasRenderingContext2D);
    toBlob().mockImplementation((done) => done(null));
    expect(await compressImage(new Blob(['x']))).toBeNull();
  });
});
