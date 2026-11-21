import { LegalPage } from '../../features/legal';
import fr from '../../shared/i18n/fr.json';

export default function Page() {
  return <LegalPage doc={fr.legal.terms} />;
}
