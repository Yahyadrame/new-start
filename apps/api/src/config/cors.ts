// Une entrée de CORS_ORIGINS peut contenir `*` : il remplace un seul morceau d'adresse
// (lettres, chiffres, tirets), jamais un point. Utile pour les aperçus Vercel de chaque PR.
export function originMatchers(origins: string[]): (string | RegExp)[] {
  return origins.map((o) => {
    if (!o.includes('*')) return o;
    const escaped = o.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`^${escaped.join('[a-z0-9-]+')}$`);
  });
}
