import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { Select } from './select';

afterEach(cleanup);

describe('Select', () => {
  it('propose ses options, renvoie le choix et reste accessible', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <>
        <label htmlFor="year">Année</label>
        <Select id="year" onChange={onChange}>
          <option value="">Choisis</option>
          <option value="2000">2000</option>
        </Select>
      </>,
    );
    await expectNoA11yViolations(container);
    fireEvent.change(screen.getByLabelText('Année'), { target: { value: '2000' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
