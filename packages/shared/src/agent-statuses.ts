/**
 * Le statut affiché sous chaque contact dans Discussions : une courte phrase, dans la voix du contact.
 * Constante partagée, sans base de données (décision du 2026-11-18).
 */
export const AGENT_STATUSES: Readonly<Record<string, string>> = {
  jade: 'Cooking dinner, come say hi',
  sam: 'Fresh coffee, quiet morning',
  leo: 'Ready to argue about anything',
  carter: 'Watching the markets',
  emma: 'Between two interviews',
  daniel: 'On a call, back in five',
  grant: 'At the gate, passport please',
  maya: 'Here if you need to talk',
  kofi: 'Always up for a chat',
  marcus: 'Match day, obviously',
  nina: 'Reading the headlines',
  'prof-ade': 'Office hours are open',
};
