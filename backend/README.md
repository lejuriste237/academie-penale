# Backend Académie Pénale 🔐

Serveur Node.js sécurisé pour protéger la clé API Mistral.

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Créez un fichier `.env` :
```bash
cp .env.example .env
```

2. Ajoutez votre clé API Mistral :
```env
MISTRAL_API_KEY=votre_clé_api
PORT=3000
NODE_ENV=production
```

## Développement local

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## Production

```bash
npm start
```

## Endpoints disponibles

### POST /api/generate
Genère un texte via Mistral AI

**Requête :**
```json
{
  "messages": [
    { "role": "user", "content": "Votre prompt" }
  ],
  "max_tokens": 1200,
  "temperature": 0.7,
  "model": "mistral-small-latest"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-05-16T22:00:00Z"
}
```

### GET /api/health
Vérifier l'état du serveur

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2026-05-16T22:00:00Z"
}
```

## Déploiement sur Render

1. Créez un compte sur [render.com](https://render.com)
2. Connectez votre repository GitHub
3. Créez un nouveau **Web Service**
4. Configurez :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Environment** : Ajoutez `MISTRAL_API_KEY`
5. Déployez !

## Déploiement sur Railway

1. Créez un compte sur [railway.app](https://railway.app)
2. Connectez votre GitHub
3. Sélectionnez le repository
4. Ajoutez les variables d'environnement dans le dashboard
5. Railway déploiera automatiquement

## Sécurité

✅ Clé API protégée en backend
✅ CORS configuré (domaines spécifiques)
✅ Validation des requêtes
✅ Gestion des erreurs
✅ Limites de taille de payload
✅ Timeout sur les requêtes
