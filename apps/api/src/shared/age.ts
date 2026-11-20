/**
 * Seule l'année de naissance est connue : on ne compte comme majeure que la personne qui l'est
 * à coup sûr, soit 19 ans d'écart d'année ou plus. Née il y a 18 ans, elle peut avoir 17 ans : elle attend l'an prochain.
 */
export const isAdult = (birthYear: number | null | undefined, year: number) =>
  birthYear != null && year - birthYear > 18;
