# Guide de test - Liaison Backend-Frontend

## Tests de l'API avec curl

### 1. Test d'inscription

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=Test1234&email=test@example.com&first_name=Test&last_name=User" \
  -c cookies.txt
```

**Réponse attendue:**
```json
{"message":"User registered successfully"}
```

### 2. Test de connexion

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=Test1234" \
  -c cookies.txt -b cookies.txt
```

**Réponse attendue:**
```json
{"message":"Login successful"}
```

### 3. Test de récupération des tags (endpoint protégé)

```bash
curl -X GET http://localhost:8080/tags \
  -b cookies.txt
```

**Réponse attendue:**
```json
{"tags":[]}
```

### 4. Test d'ajout d'un tag

```bash
curl -X POST "http://localhost:8080/tags?tag=photography" \
  -b cookies.txt
```

**Réponse attendue:**
```json
{"message":"Tag created and assigned successfully"}
```

### 5. Test de suppression d'un tag

```bash
curl -X DELETE "http://localhost:8080/tags?tag=photography" \
  -b cookies.txt
```

**Réponse attendue:**
```json
{"message":"User tag deleted successfully"}
```

### 6. Test de déconnexion

```bash
curl -X POST http://localhost:8080/logout \
  -b cookies.txt
```

**Réponse attendue:**
```json
{"message":"Logout successful"}
```

## Tests depuis le navigateur

### 1. Test d'inscription
1. Aller sur http://localhost:3000/registration
2. Remplir le formulaire avec :
   - Email: test@example.com
   - Username: testuser
   - First name: Test
   - Last name: User
   - Date de naissance: (au moins 18 ans)
   - Password: Test1234
3. Cliquer sur "Register"
4. Vérifier la redirection vers `/verification`

### 2. Test de connexion
1. Vérifier l'email (simulé) en allant directement sur:
   - Récupérer le token depuis la base de données
   - Aller sur http://localhost:3000/verification?token=XXX
2. Aller sur http://localhost:3000/sign-in
3. Se connecter avec :
   - Username: testuser
   - Password: Test1234
4. Vérifier la redirection vers `/home`

### 3. Test des tags
1. Se connecter
2. Utiliser le hook `useTags` dans un composant :

```tsx
import { useTags } from '../hooks/useTags';

function TagsExample() {
  const { tags, addTag, removeTag, isLoading, error } = useTags();

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {tags.map(tag => (
            <li key={tag.id}>
              {tag.name}
              <button onClick={() => removeTag(tag.name)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => addTag("new-tag")}>Add Tag</button>
    </div>
  );
}
```

## Tests avec les DevTools

### Network Tab
1. Ouvrir F12 → Network
2. Effectuer une action (ex: connexion)
3. Vérifier :
   - ✅ URL: http://localhost:8080/auth/login
   - ✅ Method: POST
   - ✅ Status: 200
   - ✅ Cookie: session_token présent dans les cookies

### Console
Vérifier qu'il n'y a pas d'erreurs CORS :
```
Access-Control-Allow-Origin: http://localhost:3000
```

## Vérification de la base de données

```bash
# Se connecter à PostgreSQL
docker exec -it matcha_db psql -U matcha -d matcha

# Lister les utilisateurs
SELECT id, username, email, verified FROM users;

# Lister les tags
SELECT * FROM tags;

# Lister les associations user-tags
SELECT u.username, t.name 
FROM users u
JOIN user_tags ut ON u.id = ut.user_id
JOIN tags t ON ut.tag_id = t.id;

# Quitter
\q
```

## Débogage courant

### Problème : CORS errors

**Solution:**
Vérifier que le backend est configuré avec CORS :
```go
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowCredentials: true,
}))
```

### Problème : Cookie non envoyé

**Solution:**
Vérifier que les requêtes incluent `credentials: 'include'` :
```typescript
fetch(url, {
  credentials: 'include',
  // ...
})
```

### Problème : 401 Unauthorized sur les endpoints protégés

**Solution:**
1. Vérifier que l'utilisateur est connecté
2. Vérifier que le cookie `session_token` existe
3. Vérifier que le token est valide dans la base de données

### Problème : Connection refused

**Solution:**
1. Vérifier que les services sont démarrés :
```bash
docker ps
```
2. Vérifier les logs :
```bash
docker logs matcha_backend
docker logs matcha_frontend
```
3. Redémarrer les services :
```bash
docker compose --profile dev down
docker compose --profile dev up --build
```

## Checklist de vérification

- [ ] Backend démarre sur le port 8080
- [ ] Frontend démarre sur le port 3000
- [ ] Base de données est accessible
- [ ] Pas d'erreurs CORS dans la console
- [ ] L'inscription fonctionne
- [ ] La connexion fonctionne
- [ ] Les cookies sont envoyés
- [ ] Les endpoints protégés fonctionnent
- [ ] Les tags peuvent être créés/supprimés
- [ ] La déconnexion fonctionne

## Scripts utiles

### Nettoyer et redémarrer
```bash
docker compose --profile dev down -v
docker compose --profile dev up --build
```

### Voir les logs en temps réel
```bash
docker logs -f matcha_backend
# ou
docker logs -f matcha_frontend
```

### Accéder au conteneur backend
```bash
docker exec -it matcha_backend sh
```

### Accéder au conteneur frontend
```bash
docker exec -it matcha_frontend sh
```
