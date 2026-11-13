# 05 — Écrans du MVP

Maquettes complètes, en sombre et en clair : <https://claude.ai/artifact/7WBnVmUHi25D7ttJimWESu> (17 écrans + planche logo). Format de référence : 390 × 844 px (téléphone). Sur ordinateur, l'appli s'affiche en deux colonnes (liste à gauche, contenu à droite) au-delà de 1024 px de large.

| # | Écran | Route | Éléments clés | Notes |
| --- | --- | --- | --- | --- |
| 1 | Bienvenue | `/` (déconnecté) | Logo, bulles empilées, « Parle anglais. Pour de vrai. », « Commencer gratuitement », « J'ai déjà un compte » | |
| 11 | Inscription | `/signup` | Prénom, numéro de téléphone (indicatif +221 par défaut, liste des pays), objectif, puis Google ou e-mail | Numéro obligatoire, non vérifié tant que les SMS sont désactivés ; case séparée « J'accepte de recevoir des SMS de New Start » |
| 2 | Test de niveau | `/onboarding/level` | Conversation avec Jade, 5 questions, micro, « Écrire plutôt » | Résultat : niveau CECR estimé |
| 3 | Discussions | `/chats` | Statuts, filtres, liste des contacts, bouton « + » vers Explorer | Onglet par défaut une fois connecté |
| 12 | Explorer les thèmes | `/explore` | Recherche, 9 thèmes, contacts du thème avec « Écrire » et « Appel vidéo » | |
| 4 | Conversation | `/chats/[agentSlug]` | Bulles, correction « Plus naturel », Écouter, Traduire, note vocale, suggestions, micro | Temps réel (WebSocket) |
| 5 | Appel vocal | `/call/[agentSlug]` | Minuteur, avatar, sous-titres en direct EN/FR, astuce, micro, FR, haut-parleur, raccrocher | V2 (offre Pro) |
| 13 | Appel vidéo | `/video/[agentSlug]` | Avatar plein écran, vignette « Toi », sous-titres, expression du moment | V3 |
| 6 | Série | `/series` | Épisode du jour, liste des 7 épisodes de la semaine (fait, en cours, verrouillé) | |
| 14 | Lecteur d'épisode | `/series/[episodeId]` | Scène, sous-titres EN+FR, vitesse 0,75×, revoir, barre des 5 étapes | |
| 7 | Jeux | `/games` | Série de jours, défi du jour, grille de jeux | |
| 8 | Jeu en cours | `/games/[gameId]` | Anneau minuteur, score, record, combo, question, 4 réponses, retour immédiat | |
| 9 | Progrès | `/progress` | Niveau et XP, 4 chiffres clés, minutes parlées par jour, classement entre amis | Amis en V2 : masquer le bloc au MVP |
| 15 | Notifications | `/notifications` | Aujourd'hui / Cette semaine, réglage du rappel unique | |
| 16 | Profil et réglages | `/profile` | Abonnement, thème Système/Clair/Sombre, rappel, objectif quotidien, accent, économie de données, mode pause | |
| 10 | Abonnement | `/plans` | Avantages, 4 offres, Wave / Orange Money / Carte, « Continuer » | |
| 17 | Hors connexion | état global | Bandeau « Pas de connexion », révisions et jeux hors ligne | Service worker (PWA) |

## États à prévoir pour chaque écran

- **Chargement** : squelettes gris (surface-1), jamais d'écran blanc.
- **Vide** : composant `EmptyState` avec une action.
- **Erreur** : message clair (« Le message n'est pas parti. Touche pour réessayer. »), jamais de code technique.
- **Hors ligne** : écran 17 ou bandeau en haut des listes.
- **Limite gratuite atteinte** : carte douce dans la conversation, lien vers `/plans`, jamais de blocage brutal en plein message.

## Parcours principal du MVP

1. Bienvenue → Inscription → Test de niveau (3 minutes).
2. Résultat → Discussions, où Jade a déjà écrit.
3. Chaque jour : notification → conversation ou épisode → jeu → progrès.
