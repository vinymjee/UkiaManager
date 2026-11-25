# Ukia Manager - Gestion de caisse

Application de gestion de caisse (factures, devis, pro forma, reçus, bordereaux de dépense, journal comptable, compte d'exploitation) hébergée sur un **Cloudflare Worker**, avec les données stockées en JSON dans **Cloudflare KV**.

## Architecture

```
UkiaManager/
├── src/                 # Cloudflare Worker (API + données KV)
│   ├── index.ts         # Point d'entrée du worker (auth + routes métier)
│   ├── types.ts         # Types TypeScript partagés
│   └── auth.ts          # Hachage des mots de passe + JWT (HS256)
├── wrangler.toml        # Configuration du worker
├── package.json         # Dépendances du worker (wrangler)
└── ui/                  # Front Angular (standalone, v19)
    ├── src/
    │   ├── app/
    │   │   ├── app.component.ts          # Layout + navigation
    │   │   ├── app.routes.ts             # Routes + gardes (auth/superviseur)
    │   │   ├── models.ts                 # Types front
    │   │   ├── services/                 # ApiService, AuthService
    │   │   ├── interceptors/             # Token interceptor (JWT)
    │   │   └── guards/
    │   │       ├── auth.guard.ts
    │   │       └── superviseur.guard.ts
    │   │   └── pages/                    # Pages (login, dashboard, factures, ...)
    │   ├── environments.ts               # URL de l'API
    │   ├── main.ts                       # Bootstrap
    │   ├── index.html
    │   └── styles.css
    ├── angular.json
    ├── package.json
    └── tsconfig*.json
```

## Fonctionnalités

- **Factures** : création, brouillon, envoyer, marquer payée, annuler (superviseur uniquement).
- **Devis** : création, envoyer, accepter, refuser, annuler.
- **Factures pro forma** : création et liste.
- **Réçus de paiement** : création et liste (génère les écritures comptables).
- **Bordereaux de dépense** : création, valider, annuler.
- **Journal comptable** : écritures auto-générées + écritures manuelles.
- **Compte d'exploitation** : produits, charges, TVA collectée, résultat par période.
- **Clients** : CRUD complet.
- **Utilisateurs (agents)** : CRUD réservé au superviseur.
- **Sécurité** : JWT stocké dans `localStorage` ; seul le `SUPERVISEUR` peut gérer les utilisateurs, annuler des paiements et modifier les paramètres.

## Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) : `npm install -g wrangler`
- [Angular CLI](https://angular.io/cli) : `npm install -g @angular/cli`

## 1. Créer le namespace KV (stockage des données JSON)

```bash
# Dans le dossier racine (à côté de wrangler.toml)
npx wrangler kv:namespace create "CAISSE_DB"
```

La commande retourne deux IDs. Copiez l'ID de production dans `wrangler.toml` à la place de `REMPLACEZ_PAR_L_ID_DU_NAMESPACE_KV` :

```toml
[[kv_namespaces]]
binding = "CAISSE_DB"
id = "votre_id_de_production"
```

## 2. Configurer la clé secrète JWT

Dans `wrangler.toml`, modifiez :

```toml
[vars]
JWT_SECRET = "une-cle-secrete-tres-longue-et-aleatoire-ici"
```

## 3. Déployer le worker (API)

```bash
# À la racine du projet
npm install
npx wrangler deploy
```

Le worker expose l'API REST sous `/api/*` (ex: `/api/factures`, `/api/auth/login`).

## 4. Construire et déployer le front Angular

```bash
cd ui
npm install
ng build
```

Le build se trouve dans `ui/dist/ukia-caisse-ui/browser/`.

Déploiement du front (deux options) :

### Option A : Cloudflare Pages (recommandé)
Le front est sur Pages et appelle le Worker pour l'API.
Dans `ui/src/environments.prod.ts`, mettez l'URL de votre Worker :

```ts
export const environment = {
  production: true,
  apiUrl: "https://votre-worker.votre-compte.workers.dev",
};
```

Puis :
```bash
cd ui
npx wrangler pages deploy dist/ukia-caisse-ui/browser --project-name ukia-caisse
```

### Option B : Servir le front depuis le Worker
Placez le contenu de `ui/dist/ukia-caisse-ui/browser/` dans un dossier `public/` à la racine, puis ajoutez dans `wrangler.toml` :

```toml
[assets]
directory = "public"
spa = true
```

Et redéployez le worker.

## 5. Premier lancement (création du superviseur)

Rendez-vous sur l'application, puis :
1. Connectez-vous avec le formulaire "Créer le superviseur" (nom, email, mot de passe).
2. Connectez-vous avec ces identifiants.
3. Créez les clients, puis les agents depuis **Utilisateurs** (réservé au superviseur).

## Variables d'environnement du worker

| Variable | Rôle |
|----------|------|
| `CAISSE_DB` (KV) | Stockage JSON des données |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT |

## Routes API principales

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Utilisateur connecté |
| POST | `/api/auth/init` | Créer le premier superviseur |
| GET/POST/PUT/DELETE | `/api/utilisateurs` | CRUD utilisateurs (superviseur) |
| GET/POST/PUT/DELETE | `/api/clients` | CRUD clients |
| GET/POST | `/api/factures` | Liste / créer une facture |
| POST | `/api/factures/:id/envoyer` | Envoyer une facture |
| POST | `/api/factures/:id/payer` | Marquer payée |
| POST | `/api/factures/:id/annuler` | Annuler (superviseur) |
| GET/POST | `/api/devis` | Liste / créer un devis |
| POST | `/api/devis/:id/(accepter\|refuser\|annuler)` | Changer statut devis |
| GET/POST | `/api/factures-proforma` | Pro forma |
| GET/POST | `/api/recus` | Réçus de paiement |
| GET/POST | `/api/bordereaux` | Bordereaux de dépense |
| POST | `/api/bordereaux/:id/(valider\|annuler)` | Valider/annuler bordereau |
| GET/POST | `/api/journal` | Journal comptable |
| GET | `/api/compte-exploitation?debut=&fin=` | Compte d'exploitation |
| GET/PUT | `/api/parametres` | Paramètres (taux TVA, devise, entreprise) |

## Licence

Privé - Ukia Manager.