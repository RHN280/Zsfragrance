# ZS Fragrance — Backend API

## Stack
- Node.js + Express
- Supabase (base de données)
- Resend (emails)
- CallMeBot (WhatsApp gratuit)
- Stripe (paiements)

---

## Installation

```bash
npm install
cp .env.example .env
# Remplis le fichier .env avec tes clés
npm run dev
```

---

## Configuration étape par étape

### 1. Supabase (base de données)
1. Crée un compte sur https://supabase.com
2. Crée un nouveau projet
3. Va dans **SQL Editor** et colle le contenu de `supabase_setup.sql`
4. Va dans **Settings > API** et copie :
   - `Project URL` → `SUPABASE_URL`
   - `service_role key` → `SUPABASE_SERVICE_KEY`

### 2. Resend (emails)
1. Crée un compte sur https://resend.com (gratuit jusqu'à 3000 emails/mois)
2. Crée une clé API → `RESEND_API_KEY`
3. Vérifie ton domaine ou utilise leur domaine test

### 3. WhatsApp CallMeBot (gratuit)
1. Ajoute ce numéro dans tes contacts WhatsApp : +34 644 27 88 17
2. Envoie-lui le message : `I allow callmebot to send me messages`
3. Tu reçois ta clé API → `WHATSAPP_APIKEY`
4. `WHATSAPP_PHONE` = ton numéro au format international sans + (ex: 41791234567)

### 4. Stripe
1. Crée un compte sur https://stripe.com
2. Récupère ta clé secrète → `STRIPE_SECRET_KEY`

### 5. Mot de passe admin
- `ADMIN_PASSWORD` = le mot de passe pour accéder au dashboard

---

## Déploiement (Railway — recommandé)

1. Crée un compte sur https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Ajoute les variables d'environnement dans Railway
4. Ton API sera en ligne sur une URL du type `https://zsfragrance-api.railway.app`
5. Mets cette URL dans `FRONTEND_URL` du frontend (`.env`)

---

## Routes API

### Publiques (frontend)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /health | Vérifier que l'API tourne |
| GET | /products | Catalogue avec stock |
| POST | /orders | Créer une commande |

### Admin (header: x-admin-token)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /admin/orders | Toutes les commandes |
| GET | /admin/orders/:id | Détail commande |
| PATCH | /admin/orders/:id | Changer statut / suivi |
| GET | /admin/products | Tous les produits |
| PATCH | /admin/products/:id/stock | Mettre à jour le stock |
| PUT | /admin/products/:id | Modifier un produit |

---

## Dashboard Admin

Ouvre `admin/index.html` dans ton navigateur.
Entre ton `ADMIN_PASSWORD` pour accéder.

**Fonctionnalités :**
- Voir toutes les commandes en temps réel (refresh auto 30s)
- Filtrer par statut
- Changer le statut d'une commande
- Ajouter un numéro de suivi
- Gérer le stock produit par produit
- Activer / désactiver un produit
- Stats : CA total, commandes en attente, stock faible
