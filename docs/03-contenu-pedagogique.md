# 03 — Contenu pédagogique

## Le noyau d'anglais parlé

Tout le contenu (leçons, scènes, jeux, consignes des agents) s'appuie sur le noyau, fourni dans `data/` :

| Fichier | Contenu | Colonnes |
| --- | --- | --- |
| `data/expressions.csv` | 339 expressions de 2 à 6 mots, triées par fréquence à l'oral | Rang, Expression, Sens en français, Situation, Registre, Scène-type, Semaine, Fréquence |
| `data/mots.csv` | 1 000 mots les plus fréquents à l'oral | Rang, Mot, Traduction, Semaine, Fréquence |

**Sources du calcul** : Cornell Movie-Dialogs (617 films, 304 713 répliques), transcriptions de *Friends* (10 saisons), listes de fréquence OpenSubtitles 2018, bibliothèque `wordfreq`. Les textes sources ont servi uniquement à compter : ils ne sont ni copiés ni distribués. Avant tout usage commercial d'un corpus dans le produit, vérifier sa licence.

**Limite connue** : corpus surtout américains et antérieurs à 2010. L'argot récent (« no cap », « lowkey ») est à ajouter dans un ticket dédié (`backlog/`).

**Import** : un script `apps/api/prisma/seed.ts` importe les deux CSV dans les tables `Expression` et `Word`. La colonne « Semaine » (valeurs « Semaine 1 » à « Semaine 4 », à convertir en entier à l'import) place chaque élément dans le parcours de 30 jours (1 = bases et réactions, 2 = questions et conversation, 3 = avis et émotions, 4 = nuances et persuasion).

## Droits d'auteur : règle absolue

- Aucun extrait, personnage, réplique ou image d'un film, d'une série ou d'un manga existant.
- Les scènes s'inspirent de **scènes-types** universelles (le rival, la déclaration, l'entretien…), avec des personnages et des dialogues originaux.
- Les expressions courantes (« Let's go », « No way ») sont libres d'usage.

## La série « New Start », saison 1, semaine 1

Le héros (« Toi », l'avatar de l'utilisateur) arrive dans une ville anglophone pour une bourse d'études.

| Personnage | Rôle | Voix |
| --- | --- | --- |
| Jade | Colocataire drôle et directe | Américaine, rapide |
| Sam | Barista du café | Britannique, chaleureux |
| Leo | Autre boursier, rival arrogant | Américain, sûr de lui |
| Mrs. Carter | Responsable du programme de bourses | Neutre, posée |

| Jour | Épisode | Scène-type | Expressions clés |
| --- | --- | --- | --- |
| 1 | L'arrivée | Rencontre et présentations | Nice to meet you, What's your name?, How are you?, What about you?, Thank you so much, No problem, It's okay, Oh my god |
| 2 | Le café | Café et resto | Can I help you?, I'd like…, Of course, Anything else?, How much?, Here you go, I don't understand, Have fun |
| 3 | La coloc | Coloc et amis | What's up?, You know, I mean, I don't know, I see, Don't worry, Oh no, Come on |
| 4 | Le rival | Le rival | Excuse me, What do you mean?, Good luck, Are you ready?, See you later, I'm late |
| 5 | La fête | Fête | You look great, I think so, You can do it, How's it going?, Pretty good, I love it, Let's go |
| 6 | Le sac perdu | Aventure | What happened?, I need your help, Hurry up, Come with me, Look at that, Are you sure?, Thank god |
| 7 | L'entretien | Bureau et entretien | Sorry I'm late, Have a seat, Tell me, I want to, I'm sorry, I'll try, That's a good idea, Well done |

Les dialogues complets des 7 épisodes sont dans le document « Semaine 1 — Scripts des scènes » (lien dans `README.md`). Un ticket du backlog les convertit en fichiers `content/series/s1/e01.json` … `e07.json`.

**Format d'un épisode** (`content/series/s1/eNN.json`) :

```json
{
  "id": "s1e04",
  "title": "Le rival",
  "sceneType": "rival",
  "durationSec": 58,
  "lines": [
    { "speaker": "leo", "en": "Hey. You're the new guy, right?", "fr": "Hé. C'est toi le nouveau, non ?", "startMs": 0, "endMs": 2400 }
  ],
  "expressions": ["Excuse me", "What do you mean?", "Good luck"],
  "roleplay": { "userRole": "toi", "aiRoles": ["leo"], "goal": "Rester poli sans se laisser faire et partir avec « See you later »." },
  "variant": { "prompt": "Leo se moque de ton accent. Réponds avec calme." },
  "teaser": "Mrs. Carter annonce qu'un boursier présentera le programme à la fête de vendredi."
}
```

## Catalogue des contacts IA (MVP)

Chaque contact est une fiche en base (`Agent`), modifiable sans redéploiement.

| Slug | Nom | Catégorie / thème | Registre | Premier message |
| --- | --- | --- | --- | --- |
| jade | Jade | Quotidien · Coloc | Familier, américain | Heyyy! Are you home tonight? I'm making my famous pasta. |
| sam | Sam | Quotidien · Café | Poli, britannique | Morning! The usual, or something new today? |
| leo | Leo | Quotidien · Débat | Ironique, compétitif | So, new guy. You really think you can beat me at Friday's presentation? |
| carter | Mrs. Carter | Pro · Bourse | Formel | Good morning, and thank you for applying to our scholarship program. Could you briefly introduce yourself? |
| emma | Emma Lin | Pro · Recrutement | Professionnel | Hi, thanks for joining the call! Can you tell me a little about your experience? |
| daniel | Daniel Ross | Business · Vente | Persuasif | Hi there! Looking for a new laptop? We have a great deal today. |
| grant | Officer Grant | Voyage · Aéroport | Officiel, bref | Good afternoon. Passport, please. What's the purpose of your visit? |
| maya | Maya Reed | Amour · Conseil de couple | Bienveillant | Hi! What would you like to talk about today: dating, friendship, or feelings? |
| kofi | Kofi Owusu | Amour · Ami confident | Chaleureux | Hey friend! How was your day, really? |
| marcus | Marcus | Sport · Football | Enthousiaste | Did you watch the game last night? What a nail-biter! |
| nina | Nina Shah | Actualité | Journalistique, clair | Big news today. Want me to explain it in simple English? |
| prof-ade | Prof. Adeyemi | Études | Pédagogue | Welcome to class! What are you studying these days? |

Objectif de catalogue au lancement : 5 à 9 contacts par thème (voir l'écran « Explorer les thèmes »). Les fiches suivantes sont créées par un ticket de contenu, sur le même modèle.

## Parcours 30 jours

| Semaine | Objectif oral | Contenu |
| --- | --- | --- |
| 1 | Se présenter, réagir, commander | Série épisodes 1 à 7, expressions « Semaine 1 », jeux de base |
| 2 | Poser des questions, tenir 2 minutes | Série épisodes 8 à 14, contacts Quotidien et Voyage |
| 3 | Donner son avis, parler de ses émotions | Série épisodes 15 à 21, thèmes Amour, Sport, Actualité |
| 4 | Nuancer, convaincre, passer un entretien | Série épisodes 22 à 28, contacts Pro et Business, entretien final |
