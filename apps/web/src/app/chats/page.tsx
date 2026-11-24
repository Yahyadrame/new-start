import fr from '../../shared/i18n/fr.json';

/** La liste est affichée par le layout ; ici, le volet de droite quand aucune conversation n'est ouverte. */
export default function ChatsPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-text-muted">
      <p>{fr.chats.pick}</p>
    </div>
  );
}
