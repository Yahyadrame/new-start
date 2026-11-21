# Sprint 3 — Noyau, jeux et révisions (E3, E4)

## NS-301 — Générateur de questions · M
*Fonctions pures dans `packages/shared/src/game-questions.ts` (faites, 2026-11-20). Reste : stocker les phrases d'exemple (colonne ou table, génération LLM relue) et la route qui sert les questions.*
- [ ] Questions générées depuis `Expression` : Vrai ou faux (traduction juste ou celle d'une autre expression), Mot manquant (phrase d'exemple + 3 leurres de la même semaine), Associer (4 paires).
- [ ] Les phrases d'exemple sont générées une fois par le LLM, relues, et stockées (pas de génération à chaque partie).

## NS-302 — Écran Jeux (7) · S
- [ ] Défi du jour, série de jours, grille ; les jeux V2 affichés comme « Bientôt ».

## NS-303 — Jeu en cours (8) · L
*Découpé le 2026-11-20 : (1) API `GET /games/:type/questions` pour Vrai ou faux et Associer (faite ; Mot manquant attend les phrases d'exemple de NS-301), (2) écran de jeu (Vrai ou faux fait ; Associer reste à brancher), (3) contre-la-montre et record, (4) écran de fin et XP, (5) envoi des résultats et des expressions ratées (crée les cartes NS-304).*
- [ ] Les 4 jeux du MVP, retour immédiat avec sens et exemple, bouton écouter.
- [ ] Contre-la-montre : 60 s, combo x2/x3, record personnel.
- [ ] Écran de fin : score, XP gagnés, Rejouer.

## NS-304 — Révisions espacées · M
*Découpé le 2026-11-20 : (1) ordonnanceur `ts-fsrs` dans `modules/reviews/domain` (fait), (2) modèle `ReviewCard`, migration, stockage et service (fait), (3) routes `GET /reviews/due` et `POST /reviews/:id/grade` (faites), (4) cartes créées depuis le carnet et les jeux.*
*Décidé le 2026-11-20 : les cartes ne viennent que des expressions ratées dans les jeux ; le carnet n'en crée pas (voir `docs/decisions.md`). La tranche 4 attend donc NS-303.*
- [ ] Algorithme FSRS (librairie `ts-fsrs`) ; une carte est créée pour chaque expression ratée dans un jeu (faite : l'écran envoie les expressions ratées à `POST /reviews/missed`).
- [ ] `GET /reviews/due`, `POST /reviews/:id/grade`.

## NS-305 — Hors connexion (17) · L
- [ ] PWA (Serwist) : interface, jeux de base et 200 prochaines cartes en cache.
- [ ] File d'attente IndexedDB des réponses, synchronisée au retour du réseau.
- [ ] Écran et bandeau « Pas de connexion ».

## NS-306 — Argot récent · M
- [ ] Ajouter 60 expressions récentes (réseaux, séries et animés récents) relues à la main, au même format que `data/expressions.csv`.
