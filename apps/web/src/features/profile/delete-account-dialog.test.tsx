import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { DeleteAccountDialog } from './delete-account-dialog';

afterEach(cleanup);
const t = fr.profile.deleteDialog;

describe('DeleteAccountDialog', () => {
  it('prévient que la suppression est immédiate et laisse confirmer', () => {
    const onConfirm = vi.fn();
    render(<DeleteAccountDialog open busy={false} onConfirm={onConfirm} onCancel={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: t.title })).toBeTruthy();
    expect(screen.getByText(t.body)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.confirm }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('garder le compte ou fermer annule', () => {
    const onCancel = vi.fn();
    render(<DeleteAccountDialog open busy={false} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: t.cancel }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('bloque les boutons et la fermeture pendant la suppression', () => {
    const onCancel = vi.fn();
    render(<DeleteAccountDialog open busy onConfirm={vi.fn()} onCancel={onCancel} />);
    expect((screen.getByRole('button', { name: t.confirm }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole('button', { name: t.cancel }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('reste fermée tant qu’on ne la demande pas', () => {
    render(
      <DeleteAccountDialog open={false} busy={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
