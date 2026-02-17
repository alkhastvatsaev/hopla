# 🚀 Guide de Déploiement Vercel - Hopla

## ✅ Prérequis

- ✅ Code pushé sur GitHub: https://github.com/alkhastvatsaev/hopla.git
- ✅ Build validé localement (sans erreurs)
- ✅ Variables d'environnement identifiées

## 📋 Étapes de Déploiement

### 1. Connectez-vous à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"** ou **"Log In"**
3. Connectez-vous avec votre compte GitHub

### 2. Importez votre Projet

1. Cliquez sur **"Add New..."** → **"Project"**
2. Sélectionnez le repository **"hopla"** dans la liste
3. Cliquez sur **"Import"**

### 3. Configurez le Projet

Vercel détectera automatiquement que c'est un projet Next.js.

**Framework Preset:** Next.js (détecté automatiquement)
**Root Directory:** `./` (par défaut)
**Build Command:** `npm run build` (par défaut)
**Output Directory:** `.next` (par défaut)

### 4. Ajoutez les Variables d'Environnement

⚠️ **IMPORTANT:** Ajoutez ces variables avant de déployer:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRASBOURG_CENTER=48.5734,7.7521
```

**Comment ajouter:**

1. Dans la section **"Environment Variables"**
2. Pour chaque variable:
   - Collez le **nom** (ex: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
   - Collez la **valeur** correspondante
   - Cliquez sur **"Add"**

### 5. Déployez

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes que le build se termine
3. 🎉 Votre site sera accessible à une URL comme: `hopla-xxx.vercel.app`

## 🔄 Déploiements Futurs

Une fois configuré, **chaque push sur la branche `main`** déclenchera automatiquement un nouveau déploiement!

```bash
git add .
git commit -m "votre message"
git push origin main
```

## 🌐 Configuration du Domaine (Optionnel)

Pour utiliser un domaine personnalisé:

1. Allez dans **Settings** → **Domains**
2. Ajoutez votre domaine
3. Suivez les instructions pour configurer les DNS

## 🔍 Vérifications Post-Déploiement

Après le déploiement, vérifiez:

- ✅ La page d'accueil s'affiche correctement
- ✅ Les paiements Stripe fonctionnent
- ✅ Firebase Firestore est accessible
- ✅ Les images se chargent correctement
- ✅ La carte Leaflet s'affiche

## 🐛 Dépannage

### Erreur de Build

- Vérifiez les logs dans l'onglet **"Deployments"**
- Assurez-vous que `npm run build` fonctionne localement

### Variables d'environnement manquantes

- Allez dans **Settings** → **Environment Variables**
- Ajoutez les variables manquantes
- Redéployez depuis l'onglet **"Deployments"** → **"Redeploy"**

### Problèmes Firebase

- Vérifiez que les règles Firestore autorisent l'accès depuis le domaine Vercel
- Ajoutez le domaine Vercel dans la console Firebase (Authentication → Settings → Authorized domains)

## 📱 Ajout du Domaine Vercel à Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet **hopla-7bfe3**
3. Allez dans **Authentication** → **Settings** → **Authorized domains**
4. Ajoutez votre domaine Vercel (ex: `hopla-xxx.vercel.app`)

---

**Besoin d'aide?** Consultez la [documentation Vercel](https://vercel.com/docs)
