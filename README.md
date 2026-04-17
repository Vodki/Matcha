# Matcha

Application de rencontres fullstack — Next.js (frontend) + Go/Gin (backend) + PostgreSQL.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Variables d'environnement](#variables-denvironnement)
- [Lancer le projet](#lancer-le-projet)
- [Peupler la base de données](#peupler-la-base-de-données)
- [Commandes Docker utiles](#commandes-docker-utiles)
- [Commandes base de données](#commandes-base-de-données)
- [Développement sans Docker](#développement-sans-docker)
- [URLs](#urls)

---

## Stack technique

| Couche      | Technologie                  |
|-------------|------------------------------|
| Frontend    | Next.js 15, React 19, Tailwind CSS, DaisyUI |
| Backend     | Go 1.24, Gin, Goose (migrations) |
| Base de données | PostgreSQL 16             |
| Infra       | Docker, Docker Compose       |

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- Python 3.10+ (pour le script de peuplement uniquement)

---

## Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Base de données
POSTGRES_DB=matcha
POSTGRES_USER=matcha
POSTGRES_PASSWORD=matcha

# Mail (Gmail) — requis pour l'envoi des emails de vérification
GMAIL_PASS=ton_mot_de_passe_application_gmail

# URL du backend (visible par le navigateur)
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

> Le fichier `.env` est ignoré par git. Ne jamais le commiter.

---

## Lancer le projet

```bash
docker compose up --build
```

### Arrêter les conteneurs

```bash
docker compose down
```

### Arrêter et supprimer les volumes (reset complet)

```bash
docker compose down -v
```

---

## Peupler la base de données

Le script `populate_db.py` insère **500 utilisateurs** réalistes avec des coordonnées GPS, des tags, des likes et des vues de profils.

> La base de données doit être démarrée avant de lancer le script.

### 1. Installer les dépendances Python

```bash
pip install -r requirements.txt
```

Ou dans un environnement virtuel :

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Lancer le script

```bash
python3 populate_db.py
```

**Identifiants des utilisateurs de test :**
- Email : `<username>@matcha-test.com`
- Mot de passe : `Password123!`

---

## Commandes Docker utiles

### Voir les logs en temps réel

```bash
# Tous les services
docker compose logs -f

# Backend uniquement
docker compose logs -f backend

# Frontend uniquement
docker compose logs -f frontend

# Base de données uniquement
docker compose logs -f db
```

### Redémarrer un service

```bash
docker compose restart backend
docker compose restart frontend
```

### Rebuild d'un service spécifique

```bash
docker compose up --build backend
docker compose up --build frontend
```

### Voir l'état des conteneurs

```bash
docker compose ps
```

---

## Commandes base de données

Se connecter à la base de données :

```bash
docker exec -it matcha_db psql -U matcha -d matcha
```

### Voir le nombre d'utilisateurs

```sql
SELECT COUNT(*) FROM users;
```

### Voir les derniers utilisateurs inscrits

```sql
SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;
```

### Voir le nombre de likes / vues / matches

```sql
-- Nombre de likes
SELECT COUNT(*) FROM profile_likes;

-- Nombre de vues de profils
SELECT COUNT(*) FROM profile_views;

-- Nombre de matches (likes mutuels)
SELECT COUNT(*) FROM (
  SELECT a.liker_id, a.liked_id
  FROM profile_likes a
  JOIN profile_likes b ON a.liker_id = b.liked_id AND a.liked_id = b.liker_id
  WHERE a.liker_id < a.liked_id
) AS matches;
```

### Vider toutes les données utilisateurs (garder la structure)

```sql
TRUNCATE users CASCADE;
```

> `CASCADE` supprime aussi toutes les tables liées (likes, vues, images, tags, etc.).

### Reset complet de la base (données + structure)

Depuis le terminal hôte :

```bash
docker compose down -v
docker compose --profile dev up --build
```

Les migrations sont rejouées automatiquement au démarrage du backend.

### Vérifier les tags disponibles

```sql
SELECT name, COUNT(ut.user_id) AS nb_utilisateurs
FROM tags t
LEFT JOIN user_tags ut ON t.id = ut.tag_id
GROUP BY t.name
ORDER BY nb_utilisateurs DESC;
```

### Voir les fame ratings

```sql
SELECT
  MIN(fame_rating) AS min,
  MAX(fame_rating) AS max,
  ROUND(AVG(fame_rating), 2) AS moyenne
FROM users;
```

---

## Développement sans Docker

### Backend (Go)

```bash
cd backend
DB_STRING="postgres://matcha:matcha@localhost:5432/matcha?sslmode=disable" go run ./server
```

> Nécessite PostgreSQL en local sur le port 5432 et les migrations déjà appliquées.

### Frontend (Next.js)

```bash
cd matcha
npm install
npm run dev
```

Frontend disponible sur `http://localhost:3000`.

---

## URLs

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:3000      |
| Backend    | http://localhost:8080      |
| PostgreSQL | localhost:5432             |
