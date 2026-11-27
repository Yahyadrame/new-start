import type { NestExpressApplication } from '@nestjs/platform-express';
import { describe, expect, it, vi } from 'vitest';
import { MEDIA_LIMIT, useMediaBody } from './media-body.js';

describe('useMediaBody', () => {
  it('lit les corps audio/* et image/* en octets bruts, limités à 4 Mo', () => {
    const useBodyParser = vi.fn();
    useMediaBody({ useBodyParser } as unknown as NestExpressApplication);
    expect(useBodyParser).toHaveBeenCalledWith('raw', {
      type: ['audio/*', 'image/*'],
      limit: MEDIA_LIMIT,
    });
    expect(MEDIA_LIMIT).toBe('4mb');
  });
});
