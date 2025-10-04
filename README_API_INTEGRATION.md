# Liaison Backend-Frontend - Matcha

Ce document explique comment le backend Go et le frontend Next.js communiquent ensemble.

## Architecture

- **Backend**: Go avec Gin Framework (port 8080)
- **Frontend**: Next.js avec React (port 3000)
- **Base de données**: PostgreSQL (port 5432)

## Configuration

### Backend

Le backend expose une API REST sur `http://localhost:8080` avec les endpoints suivants :

#### Endpoints d'authentification (publics)
- `POST /auth/register` - Inscription d'un nouvel utilisateur
- `POST /auth/login` - Connexion d'un utilisateur
- `GET /auth/verify?token=XXX` - Vérification de l'email

#### Endpoints protégés (nécessitent une authentification)
- `POST /logout` - Déconnexion
- `GET /tags` - Récupérer les tags de l'utilisateur
- `POST /tags?tag=NAME` - Ajouter un tag
- `DELETE /tags?tag=NAME` - Supprimer un tag

### CORS

Le backend est configuré pour accepter les requêtes du frontend (`http://localhost:3000`) avec :
- Credentials (cookies)
- Headers personnalisés
- Toutes les méthodes HTTP nécessaires

### Frontend

Le frontend utilise :
- **Service API** (`src/services/api.ts`) : centralise toutes les requêtes HTTP vers le backend
- **Hooks personnalisés** :
  - `useAuth` : gestion de l'authentification
  - `useTags` : gestion des tags
- **Variables d'environnement** : `.env.local` pour configurer l'URL de l'API

## Utilisation

### 1. Démarrer l'application

```bash
# Mode développement avec Docker
docker compose --profile dev up --build

# Ou mode production
docker compose --profile prod up --build
```

### 2. Inscription d'un utilisateur

Le formulaire d'inscription (`/registration`) envoie les données au backend :

```typescript
const result = await api.register({
  username: "john_doe",
  password: "Password123",
  email: "john@example.com",
  first_name: "John",
  last_name: "Doe",
});
```

Le backend :
1. Valide les données
2. Hash le mot de passe
3. Crée l'utilisateur dans la base de données
4. Envoie un email de vérification

### 3. Connexion

Le formulaire de connexion (`/sign-in`) authentifie l'utilisateur :

```typescript
const result = await api.login({
  username: "john_doe",
  password: "Password123",
});
```

Le backend :
1. Vérifie les credentials
2. Génère un token de session
3. Stocke le token dans un cookie HttpOnly
4. Retourne le succès

### 4. Vérification d'email

Quand l'utilisateur clique sur le lien dans l'email, il est redirigé vers :
`/verification?token=XXX`

La page appelle automatiquement :
```typescript
const result = await api.verify(token);
```

### 5. Gestion des tags

Dans les pages protégées :

```typescript
import { useTags } from '../hooks/useTags';

function MyComponent() {
  const { tags, addTag, removeTag, isLoading, error } = useTags();

  const handleAddTag = async () => {
    await addTag("photography");
  };

  const handleRemoveTag = async () => {
    await removeTag("photography");
  };

  return (
    <div>
      {tags.map(tag => (
        <span key={tag.id}>{tag.name}</span>
      ))}
    </div>
  );
}
```

## Authentification

L'authentification se fait via des cookies HttpOnly :
- Le backend génère un `session_token` lors de la connexion
- Le token est stocké dans un cookie
- Les requêtes suivantes incluent automatiquement ce cookie
- Le middleware `AuthMiddleware` vérifie le token pour les routes protégées

## Format des données

### Requêtes au backend

Le backend attend les données en `application/x-www-form-urlencoded` pour les formulaires d'authentification.

### Réponses du backend

Toutes les réponses sont en JSON :

**Succès :**
```json
{
  "message": "User registered successfully"
}
```

**Erreur :**
```json
{
  "error": "Username already exists"
}
```

## Gestion des erreurs

Le service API (`api.ts`) gère automatiquement les erreurs :

```typescript
const result = await api.login(credentials);

if (result.error) {
  // Afficher l'erreur à l'utilisateur
  setErrorMessage(result.error);
} else {
  // Rediriger vers la page d'accueil
  router.push("/home");
}
```

## Variables d'environnement

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

### Backend (via Docker Compose)
```env
DB_STRING=postgres://matcha:matcha@db:5432/matcha?sslmode=disable
```

## Développement

### Ajouter un nouvel endpoint

1. **Backend** : Ajouter le handler dans `handler.go` et la route dans `routes.go`
2. **Frontend** : Ajouter la méthode dans `services/api.ts`
3. **(Optionnel)** Créer un hook personnalisé dans `hooks/`

### Exemple : Ajouter un endpoint de profil

**Backend (`handler.go`):**
```go
func GetProfileHandler(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetInt("userID")
        
        var profile Profile
        err := db.QueryRow("SELECT * FROM users WHERE id = $1", userID).Scan(&profile)
        
        if err != nil {
            c.JSON(500, gin.H{"error": "Error fetching profile"})
            return
        }
        
        c.JSON(200, profile)
    }
}
```

**Backend (`routes.go`):**
```go
protected.GET("/profile", GetProfileHandler(db))
```

**Frontend (`services/api.ts`):**
```typescript
async getProfile(): Promise<ApiResponse<Profile>> {
  return this.request('/profile', {
    method: 'GET',
  });
}
```

**Frontend (`hooks/useProfile.ts`):**
```typescript
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      const result = await api.getProfile();
      if (!result.error && result.data) {
        setProfile(result.data);
      }
    };
    fetchProfile();
  }, []);
  
  return { profile };
}
```

## Sécurité

- ✅ Mots de passe hashés avec bcrypt
- ✅ Cookies HttpOnly pour les sessions
- ✅ CORS configuré
- ✅ Validation des entrées côté backend
- ✅ Middleware d'authentification pour les routes protégées
- ⚠️ TODO: HTTPS en production
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Protection CSRF

## Débogage

### Vérifier que le backend fonctionne
```bash
curl http://localhost:8080/auth/register -X POST \
  -d "username=test&password=Test1234&email=test@test.com&first_name=Test&last_name=User"
```

### Vérifier la connexion frontend-backend
Ouvrir les DevTools du navigateur (F12) → Network pour voir les requêtes HTTP.

### Logs Docker
```bash
# Voir les logs du backend
docker logs matcha_backend

# Voir les logs du frontend
docker logs matcha_frontend

# Suivre les logs en temps réel
docker logs -f matcha_backend
```

## Prochaines étapes

- [ ] Ajouter un endpoint `/auth/me` pour vérifier l'état de connexion
- [ ] Implémenter la modification de profil
- [ ] Ajouter l'upload d'images
- [ ] Implémenter le chat en temps réel (WebSocket)
- [ ] Ajouter la récupération de mot de passe
- [ ] Implémenter la recherche d'utilisateurs
- [ ] Ajouter la géolocalisation
