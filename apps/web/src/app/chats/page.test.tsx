import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import ChatsPage from './page';

it("invite à choisir une discussion quand aucune n'est ouverte", () => {
  expect(render(<ChatsPage />).getByText(fr.chats.pick)).toBeTruthy();
});
