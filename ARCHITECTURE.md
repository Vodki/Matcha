# 🎨 Architecture Matcha - Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         MATCHA APP                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   FRONTEND (Next.js) │◄───────►│   BACKEND (Go/Gin)   │
│   Port 3000          │  HTTP   │   Port 8080          │
│                      │  REST   │                      │
│  ┌────────────────┐  │         │  ┌────────────────┐  │
│  │ Pages          │  │         │  │ Handlers       │  │
│  │ - /registration│  │         │  │ - Register     │  │
│  │ - /sign-in     │  │         │  │ - Login        │  │
│  │ - /verification│  │         │  │ - Verify       │  │
│  │ - /home        │  │         │  │ - Tags CRUD    │  │
│  └────────────────┘  │         │  └────────────────┘  │
│                      │         │                      │
│  ┌────────────────┐  │         │  ┌────────────────┐  │
│  │ Services       │  │         │  │ Middleware     │  │
│  │ - api.ts       │──┼────────►│  │ - CORS         │  │
│  └────────────────┘  │         │  │ - Auth         │  │
│                      │         │  └────────────────┘  │
│  ┌────────────────┐  │         │                      │
│  │ Hooks          │  │         │  ┌────────────────┐  │
│  │ - useAuth      │  │         │  │ Database       │  │
│  │ - useTags      │  │         │  │ - db.go        │  │
│  └────────────────┘  │         │  └────────────────┘  │
│                      │         │          │           │
│  ┌────────────────┐  │         │          ▼           │
│  │ Components     │  │         │  ┌────────────────┐  │
│  │ - TagsManager  │  │         │  │ PostgreSQL     │  │
│  │ - LogoutButton │  │         │  │ Port 5432      │  │
│  └────────────────┘  │         │  └────────────────┘  │
└──────────────────────┘         └──────────────────────┘
```

## 🔄 Flux de données

### 1️⃣ Inscription (Register)

```
User fills form
      │
      ▼
Frontend validates input
      │
      ▼
api.register(userData)
      │
      ▼
POST /auth/register ──────► Backend Handler
                                  │
                                  ▼
                            Validate data
                                  │
                                  ▼
                            Hash password
                                  │
                                  ▼
                            Insert into DB
                                  │
                                  ▼
                            Send verification email
                                  │
                                  ▼
                            Return success
      ◄─────────────────────────┘
      │
      ▼
Redirect to /verification
```

### 2️⃣ Connexion (Login)

```
User submits credentials
      │
      ▼
api.login({username, password})
      │
      ▼
POST /auth/login ────────────► Backend Handler
                                     │
                                     ▼
                               Check credentials
                                     │
                                     ▼
                               Generate session_token
                                     │
                                     ▼
                               Set HttpOnly cookie
      ◄──────────────────────────────┘
      │
      ▼
Cookie stored in browser
      │
      ▼
Redirect to /home
```

### 3️⃣ Requête protégée (Protected Request)

```
User action (e.g., get tags)
      │
      ▼
api.getTags()
      │
      ▼
GET /tags ──────────────────► AuthMiddleware
(with session_token cookie)         │
                                    ▼
                              Verify token in DB
                                    │
                                    ▼
                              Set userID in context
                                    │
                                    ▼
                              Handler
                                    │
                                    ▼
                              Query DB with userID
                                    │
                                    ▼
                              Return data
      ◄─────────────────────────────┘
      │
      ▼
Display data in UI
```

## 📦 Structure des données

### User (Backend)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    session_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tags (Backend)

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_tags (
    user_id INTEGER REFERENCES users(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (user_id, tag_id)
);
```

### API Response Format

```typescript
// Success
{
  message: "Operation successful",
  data?: any
}

// Error
{
  error: "Error message"
}
```

## 🔐 Sécurité

```
┌────────────────────────────────────────────────┐
│              SECURITY LAYERS                   │
├────────────────────────────────────────────────┤
│  1. Password Hashing (bcrypt)                  │
│  2. HttpOnly Cookies (session_token)           │
│  3. CORS Configuration                         │
│  4. Input Validation                           │
│  5. SQL Injection Protection (Prepared Stmts)  │
│  6. Authentication Middleware                  │
└────────────────────────────────────────────────┘
```

## 🛠️ Technologies

### Backend
- **Language:** Go 1.24
- **Framework:** Gin
- **Database:** PostgreSQL
- **ORM:** Native SQL
- **Password:** bcrypt
- **Session:** Cookie-based

### Frontend
- **Framework:** Next.js 15
- **Language:** TypeScript
- **UI:** React 19 + TailwindCSS + DaisyUI
- **Forms:** Native HTML5 + React Hooks
- **HTTP Client:** Fetch API

### DevOps
- **Containerization:** Docker + Docker Compose
- **Database:** PostgreSQL 16 Alpine
- **Hot Reload:** Air (Go) + Next.js Dev Server

## 📊 Ports utilisés

```
┌──────────────┬───────┬────────────────────┐
│   Service    │  Port │    Description     │
├──────────────┼───────┼────────────────────┤
│   Frontend   │  3000 │  Next.js App       │
│   Backend    │  8080 │  Gin API Server    │
│   Database   │  5432 │  PostgreSQL        │
└──────────────┴───────┴────────────────────┘
```

## 🌐 Endpoints API

```
PUBLIC ENDPOINTS
├── POST   /auth/register    - Create new user
├── POST   /auth/login       - Authenticate user
└── GET    /auth/verify      - Verify email token

PROTECTED ENDPOINTS (require authentication)
├── POST   /logout           - Logout user
├── GET    /tags             - Get user tags
├── POST   /tags?tag=NAME    - Add tag to user
└── DELETE /tags?tag=NAME    - Remove tag from user
```

## 📝 Variables d'environnement

### Backend
```env
DB_STRING=postgres://user:pass@host:port/db?sslmode=disable
```

### Frontend
```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

## 🚀 Workflow de développement

```
1. Modifier le code
      │
      ▼
2. Hot reload automatique
      │
      ├─► Backend: Air recompile
      └─► Frontend: Next.js recompile
      │
      ▼
3. Tester dans le navigateur
      │
      ▼
4. Vérifier les logs
      │
      ├─► docker logs matcha_backend
      └─► docker logs matcha_frontend
      │
      ▼
5. Commit & Push
```

## 📚 Documentation

```
QUICK_START.md              - Démarrage rapide
README_API_INTEGRATION.md   - Guide complet d'intégration
README_TESTING.md           - Tests et débogage
README_IMPLEMENTATION.md    - Résumé de l'implémentation
ARCHITECTURE.md             - Ce fichier
```

---

**Dernière mise à jour:** 4 octobre 2025
