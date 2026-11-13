# Journal des décisions

Tenu par Claude Code. Une ligne par décision du porteur du projet. À relire avant chaque ticket.

| Date | Sujet | Décision | Raison |
| --- | --- | --- | --- |
| 2026-11-12 | Nom de l'appli | New Start | Choix du porteur du projet |
| 2026-11-12 | Logo | Piste 1, « la bulle N » | Choix du porteur du projet |
| 2026-11-12 | Palette | #CCFF00, #000000, #999999, #F2F2F2, thèmes clair et sombre | Choix du porteur du projet |
| 2026-11-12 | Mode de travail | Claude Code fait tout (code, infrastructure, déploiement) ; le porteur du projet supervise, choisit et valide | Choix du porteur du projet |
| 2026-11-12 | Git et GitHub | Toute action sur GitHub (pousser, PR, fusion, issues, réglages, secrets, tags) demande l'accord du porteur du projet ; commits locaux libres | Choix du porteur du projet |
| 2026-11-12 | Déploiement | Staging en ligne dès le sprint 0, aperçu par PR dès le sprint 1 | Tester en temps réel |
| 2026-11-12 | Qualité dès le début | CI/CD complète au sprint 0 avant toute fonctionnalité ; architecture en composants et en couches vérifiée en CI | Choix du porteur du projet |
| 2026-11-12 | Interfaces | Bibliothèques pro (shadcn/ui, Radix, Lucide…) et interfaces humanisées, sans aspect « généré par IA » | Choix du porteur du projet |
| 2026-11-12 | E-mails et SMS | Brevo (SMS seulement sur accord budgétaire) | Choix du porteur du projet |
| 2026-11-12 | Médias | Cloudinary | Choix du porteur du projet |
| 2026-11-12 | Déploiement | Outils gratuits uniquement pour l'instant ; option d'hébergement à choisir en NS-000 | Choix du porteur du projet |
| 2026-11-12 | Paiement et prix | Module de paiement développé mais désactivé ; toute l'appli gratuite au lancement, avec limites d'usage raisonnables | Choix du porteur du projet |
| 2026-11-12 | Outils gratuits | Les plus généreux (limites à revérifier en NS-000) | Choix du porteur du projet |
| 2026-11-12 | Numéro de téléphone | Obligatoire à l'inscription, enregistré pour les SMS futurs, vérifié quand les SMS seront activés, consentement SMS séparé | Choix du porteur du projet |
| 2026-11-12 | Local et en ligne | Le porteur du projet développe et teste en local, tout conteneurisé avec Docker (installé sur sa machine), réglé léger ; le déploiement, les builds d'images, SonarQube et les tests lourds tournent en ligne | Machine peu puissante, habitude de tester en local |
| 2026-11-12 | Phase 1 : aperçu en ligne | Services gérés gratuits : Vercel Hobby (front), Render Free (API + jobs dans le même processus), Neon (base + files pg-boss), Upstash facultatif, SonarQube Cloud, Sentry, Brevo (API HTTP), Cloudinary, UptimeRobot. Pas de serveur à administrer | Voir l'appli marcher vite, sans coût |
| 2026-11-12 | Phase 2 : hébergement durable | VPS ou AWS (crédits du porteur du projet) à décider plus tard sur comparatif de coûts préparé par Claude Code ; fichiers Docker, Helm et Kubernetes préparés dès le sprint 0 | Choix reporté par le porteur du projet |
| 2026-11-13 | Dépôt GitHub | `new-start`, **public** | Actions et SonarQube Cloud illimités ; aucun secret dans le code |
| 2026-11-13 | Région Render | Francfort (proposition du doc, latence Dakar), sauf avis contraire | Valeur par défaut non contestée |
| 2026-11-13 | Domaines | Sous-domaines gratuits `*.vercel.app` et `*.onrender.com`, pas d'achat de domaine | Gratuit uniquement |
| 2026-11-13 | API Render | **Gardée éveillée** par une sonde. Conséquence : les 750 h/mois sont consommées par ce seul service, donc pas d'aperçu d'API par PR sur Render (l'aperçu front appelle l'API de staging) | Choix du porteur du projet ; voir risque Neon ci-dessous |
| 2026-11-13 | Budget IA | 0 €/mois : crédits d'essai seulement ; plafond codé, bascule sur l'adaptateur factice à l'épuisement | Choix du porteur du projet |
| 2026-11-13 | Autorisation permanente | Claude Code **pousse les branches et ouvre les PR sans demander**. Il demande toujours pour fusionner, créer un tag ou une release, créer le dépôt, changer un réglage, une protection ou un secret, créer des issues | Choix du porteur du projet |
| 2026-11-13 | Limites gratuites revérifiées (NS-000) | Render : 750 h/espace, veille 15 min, 512 Mo, 1 instance, SMTP sortant bloqué. Neon : 100 CU-heures/projet/mois, 10 branches/projet, suspension de la base à l'épuisement (données conservées), stockage 1 Go selon neon.com (certains comparatifs disent 0,5 Go : à mesurer). Vercel Hobby : usage non commercial, 100 déploiements/jour, 1 build à la fois, 45 min de build. SonarQube Cloud Free : privé jusqu'à 50 000 lignes, public illimité | Sources officielles consultées le 2026-11-13 |

## Risques ouverts

- **Neon et API éveillée** : une API toujours allumée qui interroge la base (pg-boss interroge toutes les 2 s par défaut, `/health/ready` teste la base) empêche Neon de s'endormir. 0,25 CU × 730 h = 182 CU-heures, au-dessus des 100 gratuites : la base serait suspendue vers le 16 du mois. Parade prévue en NS-002 : la sonde ne touche que `/health/live` (sans base), intervalle pg-boss long (≥ 30 s) ou file en mémoire en phase 1, mesure des CU-heures consommées. À revalider avec le porteur du projet si la mesure dépasse 80 CU-heures.
- **Vercel Hobby** : usage personnel et non commercial. À revoir avant d'activer le paiement.

| 2026-11-13 | Tests unitaires | Obligatoires dans chaque PR pour tout code nouveau ou modifié, sans exception non justifiée ; ajoutés à `CLAUDE.md` (règle 4), au modèle de PR et à la définition de « terminé » | Demande du porteur du projet : ne jamais oublier |
| 2026-11-13 | Humaniser | Chaque texte rédigé (interface, PR, commits, docs, rapports) passe par le skill `humanizer` avant livraison ; ajouté à `CLAUDE.md` (règle 14) | Demande du porteur du projet : ne pas l'oublier |
| 2026-11-13 | Attribution | Aucune mention ni logo de Claude sur GitHub (commits, PR, issues) ; réglage `attribution` vide dans `.claude/settings.json` et règle 15 de `CLAUDE.md` | Demande du porteur du projet |
