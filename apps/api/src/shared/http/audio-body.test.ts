import type { NestExpressApplication } from '@nestjs/platform-express';
import { describe, expect, it, vi } from 'vitest';
import { AUDIO_LIMIT, useAudioBody } from './audio-body.js';

describe('useAudioBody', () => {
  it('lit les corps audio/* en octets bruts, limités à 1 Mo', () => {
    const useBodyParser = vi.fn();
    useAudioBody({ useBodyParser } as unknown as NestExpressApplication);
    expect(useBodyParser).toHaveBeenCalledWith('raw', { type: 'audio/*', limit: AUDIO_LIMIT });
    expect(AUDIO_LIMIT).toBe('1mb');
  });
});
