# 02 — Fonctionnalités

Légende : **MVP** = première version web ; **V2** = applis mobiles et voix temps réel ; **V3** = expansion mondiale.

## 1. Messagerie

| Fonctionnalité | Ce que fait l'utilisateur | Version |
| --- | --- | --- |
| Contacts IA | Discute avec des contacts (coloc, barista, recruteuse, vendeur, agent d'aéroport, rival…) | MVP |
| Filtres | Tous, Non lus, Quotidien, Pro, Business, Voyage | MVP |
| Explorer les thèmes | Ajoute des contacts par thème : Amour, Études, Actualité, Sport, Travail, Voyage, Santé, Tech et IA, Cinéma et musique | MVP |
| Correction en direct | Sous chaque message : version « Plus naturel » + explication en français (≤ 15 mots), ou « Parfait » | MVP |
| Écouter et traduire | Fait lire une réponse à voix haute ou la traduit en français | MVP |
| Réponses suggérées | Choisit une phrase proposée quand il bloque | MVP |
| Dictée | Parle au lieu d'écrire, le message s'écrit tout seul | MVP |
| Carnet | Ajoute une correction ou une expression à son carnet personnel | MVP |
| Statuts | Voit la phrase du jour de ses contacts et y répond | V2 (maquette prête) |
| Notes vocales | Envoie et reçoit des messages vocaux, avec note de prononciation | V2 |
| Appel vocal | Parle en temps réel avec un contact, sous-titres EN/FR, astuces | V2 (maquette prête) |
| Appel vidéo | Parle face à un avatar animé, sous-titres, expression du moment | V3 (maquette prête) |
| Groupes | Discussion à plusieurs agents (colocation, réunion d'équipe) | V2 |
| Contacts qui écrivent en premier | Un message spontané par jour au maximum | V2 |
| Mémoire des contacts | Les agents se souviennent du prénom, du pays, des échanges passés | V2 |

## 2. Série interactive « New Start »

| Fonctionnalité | Ce que fait l'utilisateur | Version |
| --- | --- | --- |
| Épisode du jour | Regarde une scène animée originale (sous-titres EN, EN+FR, aucun ; vitesse 0,75×) | MVP |
| 5 étapes | Regarder, Décortiquer, Répéter, Jouer la scène, Variante libre | MVP |
| Suspense | Doit finir l'épisode pour débloquer le suivant | MVP |
| Avatar personnel | Son personnage apparaît dans les scènes | V2 |
| Choix d'histoire | Ses réponses changent la suite | V2 |
| Plusieurs séries et saisons | Romance, enquête, sport, business | V3 |

## 3. Jeux

| Jeu | Principe | Version |
| --- | --- | --- |
| Vrai ou faux | Une expression, une traduction : juste ou pas ? | MVP |
| Mot manquant | Compléter une réplique | MVP |
| Associer | Relier expressions et sens | MVP |
| Contre-la-montre | Un maximum de bonnes réponses en 60 s, combo | MVP |
| Quelle réplique ? | Une scène s'arrête, choisir ou dire la réponse | V2 |
| Dictée express | Écouter une phrase à vitesse réelle et l'écrire | V2 |
| Accents du monde | Reconnaître une phrase dite avec plusieurs accents | V2 |
| Karaoké réplique | Doubler un personnage, voix notée | V2 |
| L'enquête | Interroger des suspects IA pour trouver le coupable | V2 |
| Le négociateur | Obtenir le meilleur prix face à un vendeur IA | V2 |
| Survie à l'aéroport | Douane, porte, valise, en temps limité | V2 |
| L'entretien final | Jury IA chronométré, note sur 100 | V2 |
| Duel et tournoi | Affronter des amis, défi hebdomadaire | V3 |

## 4. Parcours d'apprentissage

| Fonctionnalité | Détail | Version |
| --- | --- | --- |
| Test de niveau | 5 questions orales avec Jade, niveau estimé A1 à C1 | MVP |
| Parcours 30 jours | Chaque jour : un épisode, une discussion, un jeu | MVP |
| Expressions du jour | 5 expressions chaque matin | MVP |
| Révisions espacées | Algorithme FSRS sur les expressions ratées | MVP |
| Préparation IELTS / TOEFL | Oraux simulés et notés | V2 |
| Parcours bourses | Entretiens de bourse, lettres en anglais | V2 |
| Autres langues | Espagnol, allemand, chinois | V3 |

## 5. Progrès, motivation, communauté

| Fonctionnalité | Détail | Version |
| --- | --- | --- |
| XP, niveau CECR, série de jours | Gagnés à chaque message et bonne réponse | MVP |
| Tableau de bord | Minutes parlées, expressions maîtrisées, corrections, réussite | MVP |
| Notifications | Un rappel par jour maximum, à l'heure choisie | MVP |
| Mode pause | Garde la série pendant un examen ou un voyage | MVP |
| Amis et classement | Classement hebdomadaire entre amis, sans paliers inventés | V2 |
| Partage | Score ou scène partagés sur TikTok, Instagram, WhatsApp | V2 |
| Salons entre humains | Pratique avec de vrais utilisateurs | V3 |

## 6. Compte et abonnement

| Fonctionnalité | Détail | Version |
| --- | --- | --- |
| Inscription | Prénom, **numéro de téléphone (obligatoire)**, objectif, puis Google ou code par e-mail (Brevo). Le numéro est enregistré dès maintenant pour les SMS futurs, vérifié par SMS quand ils seront activés | MVP |
| Thème | Système, Clair, Sombre | MVP |
| Économie de données | Images légères, audio compressé, préchargement désactivé | MVP |
| Hors connexion | Jeux et révisions disponibles sans réseau (PWA) | MVP |
| Offres | Gratuit, Pass semaine, Plus, Pro (voir `14-paiements.md`) | MVP |
| Paiement | Wave, Orange Money, carte bancaire | MVP |
| Applis Android et iOS | Même compte, progression synchronisée | V2 |
| Offre écoles | Licences avec suivi des élèves | V3 |

## Au lancement : tout est gratuit

Décision du porteur du projet : **toutes les fonctionnalités sont gratuites au début**. Le paiement est développé et testé, mais **désactivé** (drapeau `payments.enabled = false`) : l'écran Abonnement affiche « Bientôt » et aucun prix n'est demandé.

Pour protéger le budget d'IA (qui, lui, n'est pas gratuit), une **limite d'usage raisonnable** s'applique à tous, réglable sans redéploiement (table `FeatureFlag` / configuration) :

| Ressource | Limite au lancement |
| --- | --- |
| Messages IA par jour | 60 |
| Écouter (synthèse vocale) par jour | 60 |
| Dictée et notes vocales par jour | 30 |
| Épisodes, jeux, révisions | Illimités |

Quand la limite est atteinte : message doux (« Tu as bien pratiqué aujourd'hui. Reviens demain, Jade t'attend. »), jamais de mention d'un abonnement tant que le paiement est désactivé.

## Limites prévues quand le paiement sera activé

| Ressource | Gratuit | Plus | Pro |
| --- | --- | --- | --- |
| Messages IA par jour | 10 | illimités (usage raisonnable : 300/jour) | illimités (300/jour) |
| Épisodes | 1 par jour | tous | tous |
| Jeux | Vrai ou faux, Mot manquant, Associer | tous | tous |
| Écouter (synthèse vocale) | 10 par jour | illimité | illimité |
| Appels vocaux (V2) | non | non | 60 min/jour |
