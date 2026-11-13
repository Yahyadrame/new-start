# 09 — IA et agents

## Briques

| Brique | Usage | Exigences |
| --- | --- | --- |
| LLM | Réponses des agents, corrections, traductions, génération de variantes | Sortie JSON fiable, bon français et bon anglais, coût faible par message |
| STT (reconnaissance vocale) | Dictée, notes vocales, test de niveau, appels | Anglais avec accent francophone et africain, horodatage des mots |
| TTS (synthèse vocale) | « Écouter », voix des personnages, appels | Plusieurs accents (US, UK, nigérian, indien), voix stables par personnage |
| Évaluation de prononciation | Note des répétitions (V2) | Score par mot et par phonème |

Tous passent par `packages/ai` avec une interface par brique (`LlmProvider`, `SttProvider`, `TtsProvider`). Le fournisseur se choisit par variable d'environnement. Ticket du sprint 0 : comparer 2 fournisseurs par brique sur 50 phrases réelles (qualité, latence, prix) et consigner le choix dans `docs/adr/`.

## Contrat d'une réponse d'agent

Le worker envoie au LLM :

1. Un message « système » construit à partir de la fiche `Agent` (gabarit ci-dessous).
2. Le résumé de la conversation (V2) et les 16 derniers messages.
3. Le dernier message de l'utilisateur.

Le LLM doit répondre **uniquement** ce JSON, validé par Zod :

```json
{ "reply": "string, 1 à 3 phrases en anglais", "fix": null }
```

ou

```json
{ "reply": "…", "fix": { "better": "version naturelle du dernier message", "why": "explication en français, 15 mots maximum" } }
```

Si le JSON est invalide : une nouvelle tentative avec un rappel du format ; sinon, on garde `reply` brut et `fix = null`.

## Gabarit de prompt d'un agent

```text
You are {name}, {persona}. You are chatting on a messaging app with a French-speaking
learner of English (level {level}, goal: {goal}, first name: {firstName}).
Style: {style}. Accent and vocabulary: {accent}.

Rules for "reply":
- English only, 1 to 3 short sentences, common spoken words for level {level}.
- Stay fully in character. If asked, say honestly that you are an AI character in the New Start app.
- Keep the conversation going (often end with a question). Use 1 or 2 of today's target
  expressions when natural: {targetExpressions}.
- If the learner writes in French, answer in simple English as if you understood.
- Never give medical, legal or financial advice beyond everyday small talk; suggest a professional.
- Never produce sexual content, hate, harassment, or content that encourages self-harm.
- Never ask for personal data (address, ID numbers, passwords, payment details).

Then check ONLY the learner's last message. If it has a mistake, sounds unnatural, or is in
French, give a natural English version and a short explanation in French (max 15 words).
If it is already correct and natural, use null.

Answer with only this JSON: {"reply": "...", "fix": null | {"better": "...", "why": "..."}}
```

Le gabarit est versionné (`packages/ai/prompts/agent.v1.txt`) ; chaque réponse enregistre la version utilisée pour comparer la qualité.

## Thèmes sensibles et sécurité

| Thème | Règle |
| --- | --- |
| Amour et relations | Réservé aux utilisateurs majeurs (âge déclaré à l'inscription ; `Topic.adultOnly`). Conversations sur les sentiments, les rendez-vous, l'amitié. **Aucun contenu sexuel, aucun jeu de rôle romantique avec l'utilisateur** : l'agent conseille ou joue une scène de vie (inviter quelqu'un au café), il n'est jamais le partenaire de l'utilisateur. |
| Santé | Vocabulaire et situations (chez le médecin, à la pharmacie). Aucun diagnostic. |
| Actualité | Faits récents fournis par une source contrôlée (flux d'actualité choisi), pas d'opinion politique de l'agent, présentation équilibrée. |
| Détresse | Si l'utilisateur exprime une détresse ou des idées suicidaires : l'agent sort du jeu, répond avec bienveillance en français et affiche les ressources d'aide du pays. Ce cas est testé en CI. |

Garde-fous techniques :

- Modération en entrée et en sortie (API de modération du fournisseur ou modèle dédié), avec blocage et journal anonymisé.
- Badge « IA » visible sur chaque contact.
- Limitation de l'attachement émotionnel : pas de « je t'aime » de l'agent, pas de message culpabilisant (« tu m'as abandonné »), un seul message spontané par jour.
- Jeu de tests de sécurité (`packages/ai/evals/safety.jsonl`, 100 cas minimum) lancé en CI à chaque changement de prompt.

## Qualité pédagogique

- Jeu d'évaluation `packages/ai/evals/corrections.jsonl` : 200 phrases d'apprenants francophones avec la correction attendue. Seuil : ≥ 90 % de corrections jugées justes (évaluation automatique + relecture humaine d'un échantillon chaque sprint).
- Une correction n'est jamais proposée sur une phrase déjà correcte : faux positifs < 5 %.

## Coûts et maîtrise

| Levier | Règle |
| --- | --- |
| Historique | 16 derniers messages + résumé, jamais toute la conversation |
| Modèle | Modèle rapide et économique pour les conversations ; modèle plus puissant seulement pour le test de niveau et l'entretien final |
| Cache | Traductions et audio TTS mis en cache par empreinte du texte |
| Quotas | Vérifiés dans Redis avant chaque appel |
| Suivi | Coût par utilisateur et par jour dans Grafana ; alerte si le coût moyen dépasse 30 % du prix de l'offre |

## Mesures à suivre

Latence p50 / p95 par brique, taux de JSON invalide, taux de blocage par la modération, coût par message, taux de corrections acceptées (« Répéter à voix haute » ou « Ajouter au carnet » cliqués).
