# 🌟 Fame Rating System - Documentation

## Vue d'ensemble

Le système de **Fame Rating** calcule automatiquement la popularité d'un utilisateur basée sur le ratio de likes reçus par rapport aux vues de profil.

### Formule
```
Fame Rating = (Nombre de Likes / Nombre de Vues) × 100
```

Le système utilise des triggers PostgreSQL pour mettre à jour automatiquement le rating à chaque nouvelle vue ou like.

---

## Architecture

### Base de données

#### Tables créées

1. **`profile_views`** - Track les vues de profil
   ```sql
   - id (SERIAL PRIMARY KEY)
   - viewer_id (INTEGER) → users(id)
   - viewed_id (INTEGER) → users(id)
   - viewed_at (TIMESTAMP)
   - UNIQUE(viewer_id, viewed_id) -- Empêche les vues multiples
   ```

2. **`profile_likes`** - Track les likes
   ```sql
   - id (SERIAL PRIMARY KEY)
   - liker_id (INTEGER) → users(id)
   - liked_id (INTEGER) → users(id)
   - liked_at (TIMESTAMP)
   - UNIQUE(liker_id, liked_id) -- Un like unique par personne
   ```

3. **`users.fame_rating`** - Nouvelle colonne
   ```sql
   - fame_rating (DECIMAL(5,2)) DEFAULT 0.00
   ```

#### Fonctions SQL

- **`calculate_fame_rating(user_id)`** - Calcule et met à jour le rating
- **`update_fame_rating_on_view()`** - Trigger après INSERT sur profile_views
- **`update_fame_rating_on_like()`** - Trigger après INSERT/DELETE sur profile_likes

---

## Backend API

### Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/profile/:userId/view` | Enregistrer une vue de profil | ✅ |
| POST | `/profile/:userId/like` | Toggle like/unlike | ✅ |
| GET | `/profile/:userId/stats` | Récupérer les stats (vues, likes, fame) | ❌ |
| GET | `/profile/:userId/like-status` | Vérifier si l'utilisateur actuel a liké | ✅ |

### Exemples de réponses

#### GET `/profile/2/stats`
```json
{
  "views": 5,
  "likes": 3,
  "fame_rating": 60.00
}
```

#### POST `/profile/2/like`
```json
{
  "message": "Like added",
  "liked": true
}
```

---

## Frontend

### Hook personnalisé : `useFameRating`

```typescript
const { stats, isLiked, loading, recordView, toggleLike } = useFameRating(userId);
```

#### Propriétés retournées

- `stats` - `{ views: number, likes: number, fame_rating: number }`
- `isLiked` - `boolean` - True si l'utilisateur actuel a liké
- `loading` - `boolean` - État de chargement
- `error` - `string | null` - Message d'erreur éventuel
- `recordView()` - Fonction pour enregistrer une vue
- `toggleLike()` - Fonction pour liker/unliker
- `refreshStats()` - Rafraîchir les statistiques

### Utilisation dans les composants

```typescript
import { useFameRating } from '@/hooks/useFameRating';

function ProfilePage({ userId }) {
  const { stats, isLiked, recordView, toggleLike } = useFameRating(userId);
  
  useEffect(() => {
    recordView(); // Enregistrer automatiquement la vue
  }, [recordView]);
  
  return (
    <div>
      <p>Fame Rating: {stats.fame_rating}%</p>
      <p>Views: {stats.views}</p>
      <p>Likes: {stats.likes}</p>
      <button onClick={toggleLike}>
        {isLiked ? 'Unlike' : 'Like'}
      </button>
    </div>
  );
}
```

---

## Règles de gestion

### Vues de profil

- ✅ Une vue par utilisateur (contrainte UNIQUE)
- ❌ Impossible de voir son propre profil
- ✅ Mise à jour automatique du fame_rating via trigger
- ✅ Timestamp `viewed_at` pour analytics futures

### Likes

- ✅ Un like par utilisateur (contrainte UNIQUE)
- ❌ Impossible de liker son propre profil
- ✅ Toggle : Like → Unlike → Like
- ✅ Mise à jour automatique du fame_rating (INSERT/DELETE)
- ✅ Timestamp `liked_at` pour analytics

### Fame Rating

- 📊 **Calcul automatique** via triggers SQL
- 🔢 **Précision** : 2 décimales (ex: 66.67%)
- 📈 **Plafond** : Maximum 100%
- 📉 **Plancher** : Minimum 0%
- 🔄 **Temps réel** : Mis à jour instantanément

---

## Tests

### Données de test générées

```
┌────┬───────────────┬───────┬───────┬─────────────┐
│ ID │   Username    │ Views │ Likes │ Fame Rating │
├────┼───────────────┼───────┼───────┼─────────────┤
│ 5  │ loulou        │   3   │   3   │   100.00%   │
│ 4  │ emailtest2    │   5   │   3   │    60.00%   │
│ 3  │ emailtest     │   3   │   1   │    33.33%   │
│ 2  │ debugtest     │   5   │   1   │    20.00%   │
│ 6  │ testtoken     │   3   │   0   │     0.00%   │
└────┴───────────────┴───────┴───────┴─────────────┘
```

### Script de test

Exécutez le script pour générer des données :
```bash
cd backend
./populate_fame_rating.sh
```

---

## Améliorations futures

### Analytics
- 📊 Graphiques d'évolution du fame rating
- 📈 Statistiques hebdomadaires/mensuelles
- 🔥 Profils "trending" (forte croissance)

### Gamification
- 🏆 Badges selon le fame rating (Bronze < 30%, Silver < 60%, Gold < 90%, Diamond 90%+)
- 🌟 Classement des profils les plus populaires
- 🎯 Objectifs personnalisés

### Notifications
- 📬 Alertes quand quelqu'un like votre profil
- 👁️ Notifications de vues (optionnel, paramétrable)
- 🎉 Milestone atteint (ex: 100 likes, 500 vues)

### Pondération
- ⚖️ Poids différents selon l'ancienneté du like
- 📅 Decay temporel (likes récents comptent plus)
- 🔍 Qualité des likers (mutual matches comptent double)

---

## Sécurité

### Protection contre le spam
- ✅ Contrainte UNIQUE empêche les vues/likes multiples
- ✅ Validation backend (impossible de liker son propre profil)
- ✅ Cascade DELETE (suppression automatique si utilisateur supprimé)

### Optimisation
- ✅ Index sur `viewed_id` et `viewed_id` pour requêtes rapides
- ✅ Index sur `liker_id` et `liked_id`
- ✅ Triggers optimisés (calcul en temps réel sans overhead)

---

## Migration

La migration `20251004230645_add_fame_rating_system.sql` :
- ✅ Crée les tables
- ✅ Ajoute la colonne fame_rating
- ✅ Crée les fonctions et triggers
- ✅ Inclut un Down pour rollback propre

---

Créé avec ❤️ pour Matcha
