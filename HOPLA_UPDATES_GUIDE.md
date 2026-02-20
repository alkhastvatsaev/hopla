# 📘 Guide de Récupération et des Mises à Jours (Hopla)

Ce document t'explique comment récupérer la version exacte de ton ancien code (le commit `f899840`), et liste l'intégralité des améliorations que nous avons codées aujourd'hui, pour que tu saches exactement ce qui a changé.

## 1. Comment récupérer la version exacte du vieux commit (`f899840`)

Si tu veux jeter un oeil à cet ancien code ou le tester séparément.

### Option A : Juste extraire un ancien fichier (recommandé pour comparer)

Tu peux extraire n'importe quel vieux fichier pour le regarder sans casser ton projet actuel.

```bash
# Cela va créer un fichier 'vieux_page.tsx' à partir du commit de l'époque
git show f899840aa5dccd04b2c4e5bd5a5a7aea91a81225:app/create-list/page.tsx > vieux_page.tsx
```

### Option B : Créer une branche 100% ancienne pour la déployer sur Vercel

Si tu veux créer un **nouveau projet Vercel de test** totalement basé sur l'époque :

```bash
# 1. Tu crées une branche "test-vieux-projet" qui remonte dans le temps
git checkout -b test-vieux-projet f899840aa5dccd04b2c4e5bd5a5a7aea91a81225

# 2. Tu pousses cette branche sur GitHub
git push origin test-vieux-projet
```

_Ensuite, sur Vercel, tu pourras créer un nouveau projet et sélectionner la branche `test-vieux-projet` au moment de le lier à Github._

---

## 2. Le VRAI problème actuel sur Vercel : Les Clés Firebase !

**Important :** Notre dernier test vient de démontrer que le blocage sur la version Vercel actuelle n'est **PAS** un bug de code. C'est simplement parce que le projet Vercel actuel **n'a pas tes clés d'accès Firebase** dans ses "Environment Variables".
Sans ces clés temporelles cachées (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, etc.), le code n'a pas la permission de sauvegarder la mission sur Vercel (d'où le blocage mystérieux).

---

## 3. Liste des Mises à Jour et Améliorations Apportées Aujourd'hui

Si tu repars du commit `f899840` et que tu veux ré-appliquer nos nouveautés manuellement (ou juste pour avoir la liste des fonctionnalités ajoutées) :

### A. Interface Premium & PWA

- **Suppression du TabBar en bas de l'écran :** Pour rendre l'expérience plus fluide et plein écran (Style Apple).
- **Mode d'installation PWA :** Les utilisateurs iPhone/Android peuvent maintenant installer l'application sur leur page d'accueil.

### B. Stabilisation du Paiement (Stripe)

- **Filet de Sécurité LocalStorage (3D Secure) :**
  En milieu de paiement, l'application d'une banque éjecte souvent l'utilisateur de Safari. Nous avons ajouté une fonction `localStorage.setItem('hopla_pending_job', ...)` qui "sauvegarde" la commande virtuellement avant la redirection bancaire, puis l'aspire à son retour. C'est capital pour les paiements sur mobile.
- **Récupération des URL `stripe_redirect=true` :** Dans le composant `StripePayment.tsx`, validation ferme après paiement réussi avec renvoi local.
- **Capture automatique :** Le paiement Stripe débite ou enregistre les fonds immédiatement (capture_method: "automatic").

### C. Bypass de l'API Serverless (Vercel Timeout Fix)

- **Le problème de Vercel avec Firebase :** L'envoi via un `fetch('/api/jobs')` bloquait car Vercel (qui est en architecture _Serverless Edge_) tuait la connexion WebSocket de Firebase s'il y avait un délai d'attente (ce qui empêchait la redirection).
- **La solution implémentée :** Au lieu de passer par notre propre API, la page Web du téléphone connecte directement le Firebase SDK Client à la base de données.
  _C'est-à-dire : l'import direct de `import { createJob } from '../lib/firebaseService';` dans le fichier `app/create-list/page.tsx` et appel natif au clic sur Payer._

### D. Améliorations de la Page de Suivi (Tracking)

- L'heure d'arrivée estimée est désormais dynamique (`ETA`).
- Ajout de nouveaux états graphiques pour la confirmation de prise en charge et de livraison.
