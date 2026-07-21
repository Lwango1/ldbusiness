# Déploiement Supabase - LDBusiness Marketplace

## 1. Créer un projet Supabase

1. Va sur https://supabase.com et crée un compte
2. Clique "New Project"
3. Choisis un nom (ex: `ldbusiness-marketplace`)
4. Note le **URL** et la **anon key** dans la page Settings > API

## 2. Appliquer la migration

1. Va dans l'onglet **SQL Editor** de Supabase
2. Copie le contenu de `supabase/migration.sql`
3. Execute tout le script

## 3. Configurer l'authentification

Dans Supabase > Authentication > Settings :
- Active **Email/Password** (désactive "Confirm email" si tu veux)
- Active **Google** (configure OAuth avec Google Cloud Console)

## 4. Configurer le Storage (images)

Dans Supabase > Storage :
- Crée un bucket `product-images`
- Définis la politique RLS : `INSERT` pour les vendeurs, `SELECT` pour tout le monde

## 5. Variables d'environnement

Crée un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-supabase
```

## 6. Lancer l'application

```bash
npm run dev
```

## Architecture

```
Frontend (React + Vite + Capacitor)
    │
    ├── Supabase Client (SDK JS)
    │
    └── Supabase Cloud
        ├── PostgreSQL (données)
        ├── Auth (authentification)
        ├── Storage (images)
        └── Realtime (chat live, notifications)
```

## Tables principales

- `profiles` → utilisateurs (acheteurs, vendeurs, admin)
- `products` → produits avec seller_id
- `cart_items` → panier par utilisateur
- `transactions` + `transaction_items` → ventes et commissions
- `messages` → questions acheteur → vendeur
- `lives` + `live_chat_messages` → streaming live
