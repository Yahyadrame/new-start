# 13 — Roadmap et sprints

Sprints d'une semaine. Le MVP web vise 7 sprints (0 à 6), puis une bêta fermée de 2 semaines.

| Sprint | Objectif | Épopées | Critère de sortie |
| --- | --- | --- | --- |
| 0 | Socle technique et chaîne de livraison | E0 | Une page « Bonjour » déployée sur staging par la CI, quality gate vert, sondes de santé OK |
| 1 | Compte et premier contact | E1 | Inscription par e-mail (code Brevo) ou Google, test de niveau, Jade écrit le premier message |
| 2 | Messagerie avec corrections | E2 | Conversation temps réel avec 7 contacts, corrections, écouter, traduire, suggestions, dictée |
| 3 | Noyau, jeux, révisions | E3, E4 | 4 jeux jouables, révisions FSRS, mode hors ligne pour jeux et révisions |
| 4 | Série semaine 1 et thèmes | E5, E2 | 7 épisodes jouables (5 étapes), écran Explorer avec 9 thèmes |
| 5 | Progrès, notifications, abonnements | E6, E7 | Tableau de bord, rappel quotidien, limites d'usage ; paiement Wave / Orange Money / carte développé en bac à sable mais **désactivé** |
| 6 | Finition et préparation du lancement | E8 | Tests de charge, accessibilité, sécurité, supervision, sauvegardes testées, contenu relu |
| Bêta | 20 à 50 testeurs | — | Rétention J1 ≥ 40 %, J7 ≥ 20 %, coût IA mesuré, bugs critiques à zéro |

Ensuite :

- **V2 (environ 3 mois)** : applis Android et iOS (Expo), notes vocales, appels vocaux (LiveKit), groupes, statuts, mémoire des contacts, 8 nouveaux jeux, IELTS/TOEFL, amis et classements, déploiement canary.
- **V3** : appels vidéo avec avatars, plusieurs séries, duels et tournois, salons entre humains, autres langues, offre écoles.

## Épopées

| Code | Épopée |
| --- | --- |
| E0 | Socle : monorepo, CI/CD, Docker, Kubernetes, SonarQube, supervision |
| E1 | Compte : inscription, connexion, profil, test de niveau |
| E2 | Messagerie : contacts, conversations, IA, corrections, voix |
| E3 | Noyau et révisions |
| E4 | Jeux |
| E5 | Série |
| E6 | Progrès et notifications |
| E7 | Abonnements et paiements |
| E8 | Qualité, sécurité, lancement |

Le détail des tickets est dans `backlog/`.
