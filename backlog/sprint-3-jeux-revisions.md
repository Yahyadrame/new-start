# Sprint 3 — Noyau, jeux et révisions (E3, E4)

## NS-301 — Générateur de questions · M
- [ ] Questions générées depuis `Expression` : Vrai ou faux (traduction juste ou celle d'une autre expression), Mot manquant (phrase d'exemple + 3 leurres de la même semaine), Associer (4 paires).
- [ ] Les phrases d'exemple sont générées une fois par le LLM, relues, et stockées (pas de génération à chaque partie).

## NS-302 — Écran Jeux (7) · S
- [ ] Défi du jour, série de jours, grille ; les jeux V2 affichés comme « Bientôt ».

## NS-303 — Jeu en cours (8) · L
- [ ] Les 4 jeux du MVP, retour immédiat avec sens et exemple, bouton écouter.
- [ ] Contre-la-montre : 60 s, combo x2/x3, record personnel.
- [ ] Écran de fin : score, XP gagnés, Rejouer.

## NS-304 — Révisions espacées · M
- [ ] Algorithme FSRS (librairie `ts-fsrs`) ; une carte est créée pour chaque expression ratée ou ajoutée au carnet.
- [ ] `GET /reviews/due`, `POST /reviews/:id/grade`.

## NS-305 — Hors connexion (17) · L
- [ ] PWA (Serwist) : interface, jeux de base et 200 prochaines cartes en cache.
- [ ] File d'attente IndexedDB des réponses, synchronisée au retour du réseau.
- [ ] Écran et bandeau « Pas de connexion ».

## NS-306 — Argot récent · M
- [ ] Ajouter 60 expressions récentes (réseaux, séries et animés récents) relues à la main, au même format que `data/expressions.csv`.
