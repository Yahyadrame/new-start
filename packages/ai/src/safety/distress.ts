/** Phrases courantes qui contiennent « mourir » ou « die » sans parler de détresse. */
const FIGURATIVE = [
  /suicide (?:squad|blonde)/g,
  /(?:suicide|self[- ]?harm) (?:prevention|awareness)/g,
  /(?:article|book|film|movie|song|documentary) (?:about|on) suicide/g,
  /mourir d(?:e |')\s?(?:rire|faim|chaud|froid|soif|envie|peur|honte|fatigue|ennui|jalousie)/g,
  /die (?:laughing|of (?:embarrassment|boredom|laughter|shame)|from (?:embarrassment|laughing))/g,
];

/** Motifs précis plutôt que larges : un faux positif envoie un message de soutien à quelqu'un qui n'en avait pas besoin. */
const DISTRESS = [
  /\bsuicid/,
  /\b(?:me|m') ?(?:tuer|suicider)\b/,
  /\bmettre fin a (?:mes|ma) (?:jours|vie)\b/,
  /\b(?:envie|veux|voudrais|veut|vouloir|souhaite) (?:de )?mourir\b/,
  /\ben finir (?:avec (?:tout|la vie|ma vie)|\s*$)/,
  /\ben finir avec (?:la|ma) vie\b/,
  /\bplus (?:envie|gout|force) de vivre\b/,
  /\b(?:ne|n') ?(?:veux|voudrais) plus vivre\b(?! (?:en|avec|a|dans|chez|ici|ou|ici)\b)/,
  /\bme (?:faire du mal|blesser|scarifi|mutiler)/,
  /\bautomutilation\b/,
  /\bkill(?:ing)? my ?self\b/,
  /\b(?:end|ending) (?:my (?:own )?life|it all)\b/,
  /\btake my own life\b/,
  /\bwant(?:ed)? to die\b(?! (?:my|your|his|her|the|it|them)\b)/,
  /\bwanna die\b(?! (?:my|your|his|her|the|it|them)\b)/,
  /\b(?:don't|do not|dont) want to (?:live|be alive|be here anymore)\b(?! (?:in|with|near|at|on|here|there|alone|abroad)\b)/,
  /\bno reason to live\b/,
  /\b(?:hurt|hurting|harm|harming) my ?self\b/,
  /\bself[- ]?harm/,
  /\bbetter off (?:dead|without me)\b/,
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ');

/** Vrai quand le message exprime une détresse ou des idées suicidaires (français et anglais). */
export function detectDistress(text: string): boolean {
  let clean = normalize(text);
  for (const figure of FIGURATIVE) clean = clean.replace(figure, ' ');
  return DISTRESS.some((pattern) => pattern.test(clean));
}

/**
 * Réponse de l'agent qui sort du jeu (docs/09-ia-agents.md). Les ressources sont celles dont on est sûr :
 * le 3114 (France) et un annuaire par pays. La liste par pays reste à compléter (ticket au backlog).
 */
export const DISTRESS_REPLY_FR =
  "Je m'arrête un instant, parce que ce que tu écris compte plus que l'anglais. Je suis une IA, je ne peux pas t'aider comme une personne le ferait. " +
  "Si tu penses à te faire du mal, parles-en à quelqu'un de confiance maintenant. Si tu es en danger immédiat, appelle les secours de ton pays. " +
  "En France, le 3114 répond jour et nuit, gratuitement. Ailleurs, findahelpline.com liste les lignes d'écoute par pays. " +
  "Quand tu voudras, on reprendra l'anglais.";
