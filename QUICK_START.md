# 🚀 Guide de Démarrage Rapide - Matcha

## Démarrage en 3 étapes

### 1. Démarrer l'application

```bash
cd /home/louis/Documents/Matcha
docker compose --profile dev up --build
```

### 2. Ouvrir le navigateur

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### 3. Tester l'inscription

1. Aller sur http://localhost:3000/registration
2. Remplir le formulaire
3. Cliquer sur "Register"

## ✅ Vérification

Pour vérifier que tout fonctionne :

```bash
./check_integration.sh
```

## 📚 Documentation complète

- **README_API_INTEGRATION.md** - Comment le backend et frontend communiquent
- **README_TESTING.md** - Guide de tests complets
- **README_IMPLEMENTATION.md** - Résumé de l'implémentation

## 🔧 Commandes utiles

### Arrêter l'application
```bash
docker compose --profile dev down
```

### Voir les logs
```bash
# Backend
docker logs -f matcha_backend

# Frontend
docker logs -f matcha_frontend
```

### Redémarrer proprement
```bash
docker compose --profile dev down -v
docker compose --profile dev up --build
```

## 🎯 Fonctionnalités disponibles

### Pages fonctionnelles
- ✅ `/registration` - Inscription avec validation
- ✅ `/sign-in` - Connexion avec authentification
- ✅ `/verification` - Vérification d'email
- ✅ `/home` - Page d'accueil (après connexion)

### API Backend
- ✅ `POST /auth/register` - Inscription
- ✅ `POST /auth/login` - Connexion
- ✅ `GET /auth/verify?token=XXX` - Vérification email
- ✅ `POST /logout` - Déconnexion
- ✅ `GET /tags` - Liste des tags
- ✅ `POST /tags?tag=NAME` - Ajouter un tag
- ✅ `DELETE /tags?tag=NAME` - Supprimer un tag

### Composants réutilisables
- ✅ `LogoutButton` - Bouton de déconnexion
- ✅ `TagsManager` - Gestionnaire de tags

### Hooks
- ✅ `useAuth()` - Gestion de l'authentification
- ✅ `useTags()` - Gestion des tags

## 💡 Exemples d'utilisation

### Utiliser l'authentification

```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Déconnexion</button>
      ) : (
        <button onClick={() => login('username', 'password')}>
          Connexion
        </button>
      )}
    </div>
  );
}
```

### Utiliser les tags

```typescript
import TagsManager from '../components/TagsManager';

function ProfilePage() {
  return (
    <div>
      <h1>Mon profil</h1>
      <TagsManager />
    </div>
  );
}
```

### Appeler directement l'API

```typescript
import api from '../services/api';

const result = await api.register({
  username: 'john',
  password: 'John1234',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
});

if (result.error) {
  console.error(result.error);
} else {
  console.log('Success!');
}
```

## 🐛 Problèmes courants

### Les services ne démarrent pas
```bash
# Nettoyer et redémarrer
docker compose --profile dev down -v
docker compose --profile dev up --build
```

### Erreur CORS
Vérifier que le backend accepte les requêtes de `http://localhost:3000`

### Cookie non envoyé
Les requêtes doivent inclure `credentials: 'include'` (déjà configuré dans `api.ts`)

### 401 Unauthorized
Se reconnecter ou vérifier que le cookie de session existe

## 📞 Besoin d'aide ?

1. Vérifier les logs : `docker logs matcha_backend`
2. Consulter la documentation complète dans les README
3. Vérifier la console du navigateur (F12)

---

**Bon développement ! 🚀**
