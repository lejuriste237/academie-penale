# 🏛️ Académie Pénale

**Plateforme pédagogique interactive de droit pénal camerounais**

Générez des cas pratiques illimités avec l'API **Mistral AI**, répondez à des QCM et recevez des corrections intelligentes.

## ✨ Fonctionnalités

- 📚 **Génération de cas pratiques** via Mistral AI (droit camerounais)
- ❓ **QCM interactifs** avec feedback instantané
- ✏️ **Exercices de rédaction** et analyse juridique
- 🤖 **Corrections IA** personnalisées et détaillées
- 📊 **Suivi de progression** en temps réel
- 🎯 **Filtrage par thème, difficulté et mode**
- 💾 **Sauvegarde locale** des résultats (localStorage)

## 🌐 Accès en ligne

🔗 **https://lejuriste237.github.io/academie-penale**

Déployée automatiquement sur GitHub Pages via CI/CD.

## 🚀 Déploiement

### Automatique (GitHub Pages)
La plateforme se déploie automatiquement à chaque push sur la branche `main` via GitHub Actions.

### Manuel
1. Fork ou clonez ce repository
2. Poussez vos modifications sur `main`
3. GitHub déploiera automatiquement sur votre domaine GitHub Pages

## 📋 Structure du projet

```
academie-penale/
├── index.html          # Page principale (HTML + CSS)
├── app.js              # Logique JavaScript (API, QCM, corrections)
├── README.md           # Cette documentation
├── .gitignore          # Fichiers à ignorer
└── .github/
    └── workflows/
        └── deploy.yml  # Configuration CI/CD
```

## ⚙️ Configuration API

### Mistral AI

La plateforme utilise **Mistral AI** pour générer les cas et corrections.

**Clé API actuelle** : `TSTlYdHui4PAsQLyaJJhJVjzZVt4ROKz`

> ⚠️ **IMPORTANT** : Cette clé est exposée en frontend (non sécurisée).
> Pour une utilisation en production, protégez-la via un backend.

Pour changer la clé :
1. Obtenez une nouvelle clé sur https://console.mistral.ai
2. Modifiez `app.js` ligne 31 :
```javascript
const MISTRAL_API_KEY = 'votre_nouvelle_clé';
```

## 📖 Contenu juridique

La plateforme inclut :
- **Code pénal camerounais** (Loi n°2016/007)
- **Code de procédure pénale** (Loi n°2005/007)
- Articles principaux et textes officiels

## 🎓 Modes de travail

### 1. **Mixte** (QCM + Rédaction)
- Répondez d'abord au QCM
- Puis rédaction libre de votre analyse
- Feedback IA complet

### 2. **QCM seul**
- Questions à choix multiples
- Feedback immédiat
- Explication pédagogique

### 3. **Rédaction seule**
- Cas pratique uniquement
- Rédaction libre
- Correction IA détaillée

## 📊 Suivi de progression

- **Cas étudiés** : Nombre de cas générés
- **QCM réussis** : Nombre de bonnes réponses
- **Taux de réussite** : Pourcentage de bonne réponses

Les données sont sauvegardées dans `localStorage`.

## ⚠️ Avertissements importants

1. **L'IA peut se tromper** : Vérifiez toujours les articles cités dans les textes officiels
2. **Pas de garantie légale** : Cette plateforme est à usage pédagogique uniquement
3. **Consultez un avocat** : Pour des questions juridiques réelles

## 🛠️ Développement local

1. Clonez le repository :
```bash
git clone https://github.com/lejuriste237/academie-penale.git
cd academie-penale
```

2. Lancez un serveur local (Python) :
```bash
python -m http.server 8000
```

3. Ouvrez http://localhost:8000 dans votre navigateur

## 📝 Améliorations futures

- [ ] Backend Node.js pour protéger la clé API
- [ ] Base de données pour persistence des données
- [ ] Authentification utilisateur
- [ ] Export des résultats (PDF, Excel)
- [ ] Plus de thèmes juridiques
- [ ] Intégration d'autres modèles IA
- [ ] Interface multilingue

## 📄 License

MIT - Libre d'utilisation

## 👨‍⚖️ Auteur

**Georges Zenker** - Plateforme pédagogique d'excellence en droit pénal camerounais

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub : https://github.com/lejuriste237/academie-penale/issues
