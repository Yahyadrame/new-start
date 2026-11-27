import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalPhoto } from './local-photo';

afterEach(cleanup);

describe('LocalPhoto', () => {
  it('montre le fichier en mémoire et libère son URL en partant', () => {
    URL.createObjectURL = vi.fn(() => 'blob:photo');
    URL.revokeObjectURL = vi.fn();
    const blob = new Blob(['x']);
    const { unmount } = render(<LocalPhoto blob={blob} alt="Photo" className="size-11" />);
    expect(screen.getByRole('img', { name: 'Photo' }).getAttribute('src')).toBe('blob:photo');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
  });
});
