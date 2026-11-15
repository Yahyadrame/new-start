# ADR 0001 : fournisseurs IA pour le texte, la reconnaissance vocale et la voix

- Statut : accepté par le porteur du projet le 2026-11-15 (LLM et STT chez Groq, TTS Gemini provisoire)
- Date des mesures : 2026-11-15
- Ticket : NS-010

## Contexte

New Start a besoin de trois briques IA : un LLM pour les contacts et les corrections, un STT (voix vers texte) pour les appels et la prononciation, un TTS (texte vers voix) pour les réponses parlées. Le budget IA décidé le 2026-11-13 est de 0 € par mois, avec des crédits d'essai seulement, un plafond codé et un repli sur l'adaptateur factice quand le quota est épuisé. Aucune carte bancaire n'est liée à un compte.

Les interfaces `LlmProvider`, `SttProvider` et `TtsProvider` existent déjà dans `packages/ai` (PR #101). Changer de fournisseur coûte donc un adaptateur, pas une réécriture. Cet ADR choisit le point de départ.

## Ce qui a été mesuré

Le script `packages/ai/scripts/compare.ts` (commande `pnpm --filter @newstart/ai compare`) envoie 50 phrases d'apprenants francophones, niveaux A1 à B2, avec leurs erreurs typiques. Les phrases sont dans `packages/ai/evals/sentences.json`, les résultats bruts dans `packages/ai/evals/results.json`. Sept phrases sont déjà correctes, pour vérifier que le modèle ne corrige pas à tort.

Le LLM doit répondre en JSON `{ reply, fix }`. Une correction compte comme exacte quand `fix` est identique à la phrase attendue, mot pour mot.

### LLM (50 appels chacun)

| | Gemini `gemini-3.5-flash-lite` | Groq `openai/gpt-oss-20b` |
| --- | --- | --- |
| Appels en erreur | 13 (HTTP 429, quota gratuit) | 0 |
| JSON valide | 37 sur 37 réponses reçues | 47 sur 50 |
| Corrections exactes | 34 | 45 |
| Fausses alertes | 0 | 0 |
| Erreurs non repérées | 0 | 3 |
| Latence p50 / p95 | 739 / 1 858 ms | 460 / 663 ms |

Gemini a repéré toutes les erreurs sur les 37 appels réussis, mais 13 appels sur 50 ont dépassé le quota gratuit. Les appels partaient à 1,5 s d'écart, un rythme que le chat réel atteindra facilement. Groq n'a eu aucune erreur d'appel. Il a laissé passer trois fautes (`We went at the beach`, `asked me to not be late`, `give me an advice`) en renvoyant `fix: null`, ce qui laisse croire à l'apprenant que sa phrase est juste.

Une partie des écarts restants sont des variantes acceptables (`suggest that you take`, `realize` pour `realise`, `weren't` pour `were not`). Le score en correspondance exacte est donc sévère. Une relecture humaine des réponses reste nécessaire avant de s'y fier.

### STT (11 audios chacun)

| | Taux d'erreur de mots moyen | Latence p50 / p95 |
| --- | --- | --- |
| Groq `whisper-large-v3` | 0 % | 522 / 637 ms |
| Groq `whisper-large-v3-turbo` | 1 % | 590 / 682 ms |
| Gemini `gemini-3.5-flash-lite` (audio) | 1 % | 1 542 / 2 177 ms |

Les audios viennent de la voix de synthèse Gemini : sans accent, sans bruit, sans hésitation. Les trois fournisseurs approchent donc 0 %, et seule la latence les départage. Cette mesure ne dit rien de la tenue face à un accent français ou africain. Il faut des enregistrements humains pour conclure sur la précision.

### TTS (15 phrases chacun)

| | Résultat |
| --- | --- |
| Gemini `gemini-2.5-flash-preview-tts`, voix Kore | 11 audios sur 15, p50 2 632 ms, p95 3 341 ms. Les 4 échecs sont des HTTP 400 : le modèle a répondu en texte au lieu de produire de l'audio |
| Groq `canopylabs/orpheus-v1-english` | 15 échecs sur 15 : HTTP 400, conditions d'utilisation non acceptées par l'administrateur de l'organisation |

Orpheus n'a donc pas été écouté ni comparé. Seule Gemini a produit des voix.

## Prix

Relevés sur les pages officielles le 2026-11-15. Ils changent vite, à revérifier avant toute montée en charge.

- Groq `openai/gpt-oss-20b` : 0,075 $ par million de tokens en entrée, 0,30 $ en sortie.
- Groq `whisper-large-v3-turbo` : 0,04 $ par heure d'audio.
- Gemini : le palier gratuit existe pour les modèles Flash-Lite et TTS, et le palier payant se compte en tokens. Le tarif de `gemini-3.5-flash-lite` n'apparaît pas dans ce que j'ai relevé. Je ne le cite pas.
- Les plafonds exacts du palier gratuit de Groq et de Gemini n'ont pas été confirmés. Les 429 de Gemini montrent que celui de Gemini est bas pour notre usage.

Ces tarifs servent à estimer le coût si le projet quitte le palier gratuit. Ils ne changent pas le budget actuel de 0 €.

## Décision

1. **LLM principal : Groq `openai/gpt-oss-20b`.** Il est le plus rapide, n'a pas atteint de plafond pendant la mesure et corrige le mieux. Le code valide le JSON et relance une fois en cas de réponse invalide, comme le prévoit `docs/09-ia-agents.md` (une nouvelle tentative, puis `reply` brut et `fix = null`).  Sur 50 phrases, 45 corrections exactes font 90 %, pile le seuil de `docs/09-ia-agents.md` (≥ 90 %, mesuré là sur 200 phrases avec relecture humaine). La marge est nulle, donc le jeu de 200 phrases reste à faire.
2. **LLM de secours : Gemini `gemini-3.5-flash-lite`.** Il repère bien les erreurs, mais son quota gratuit est trop juste pour être le choix par défaut.
3. **STT : Groq `whisper-large-v3-turbo`.** L'écart de précision avec `large-v3` ne se voit pas dans nos mesures, et le tarif horaire relevé est celui de ce modèle.
4. **TTS : Gemini, à titre provisoire.** Il est le seul à avoir produit de l'audio. Le code réessaie une fois sur l'erreur 400, puis retombe sur l'adaptateur factice.
5. Tout reste derrière les interfaces de `packages/ai`, et les clés restent dans les variables d'environnement.

## Limites de cette mesure

- 50 phrases, et seulement 11 audios pour le STT : assez pour écarter un fournisseur qui échoue, pas pour mesurer de petits écarts.
- Audio synthétique, donc STT optimiste.
- Score exact-match strict, sans relecture humaine.
- Gemini a été appelé séquentiellement à 1,5 s d'intervalle. Avec des pauses plus longues, il aurait peut-être eu moins de 429.
- Les noms de modèles changent vite : `gemini-2.5-flash-lite` était déjà fermé aux nouveaux comptes le jour de la mesure. Les chiffres valent pour cette date.

## Suites

- Voix de test pour le STT : le porteur du projet n'enregistrera pas sa voix et cherche une autre source fiable (voix humaines variées, accents francophones). La mesure STT reste à refaire avec elle.
- TTS : le porteur du projet cherche une solution de voix plus fiable que Gemini (4 échecs sur 15). Orpheus reste écarté tant que ses conditions ne sont pas acceptées sur Groq. Le choix sera consigné ici quand il sera fait.
- Relire à la main les réponses du LLM, surtout les 3 fautes non repérées par Groq, et constituer le jeu de 200 phrases de `docs/09-ia-agents.md`.
- Revérifier les prix et les plafonds gratuits avant le lancement.
- Écrire les adaptateurs réels (Groq LLM et STT, Gemini TTS et LLM de secours) : ticket NS-024.
