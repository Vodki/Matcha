# Matcha Codebase - AI Agent Instructions

## Project Overview

**Matcha** is a dating app with a **Go/Gin backend** (port 8080) and **Next.js 15 frontend** (port 3000), using **PostgreSQL** (port 5432) via Docker Compose.

**Current branch**: Actively building profile/matching features with cookie-based authentication.

### Key Technologies
- **Backend**: Go 1.24, Gin Framework, PostgreSQL, bcrypt, native SQL (no ORM)
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS + DaisyUI
- **Auth**: HttpOnly cookies with `session_token`, AuthMiddleware pattern
- **Database**: PostgreSQL with migrations in `backend/migrations/`

---

## Critical Architecture Patterns

### Backend Handler Pattern
All backend handlers in `backend/server/handler.go` follow this structure:
```go
func SomeHandler(db *sql.DB) gin.HandlerFunc {
  return func(c *gin.Context) {
    userID, exists := c.Get("userID") // From AuthMiddleware
    if !exists { c.JSON(401, gin.H{"error": "Unauthorized"}); return }
    // Handler logic...
    c.JSON(200, gin.H{"message": "Success"})
  }
}
```

**Key points**:
- Protected routes get `userID` via `AuthMiddleware` (set in `backend/server/middleware.go`)
- All responses are JSON
- Use `c.Get()` never `c.PostForm()` for authenticated requests
- Add new handlers to `backend/server/routes.go` in protected group

### Frontend API Service Pattern
`matcha/src/services/api.ts` is the single source of truth for all backend communication:
```typescript
const response = await api.request('/endpoint', {
  method: 'POST',
  credentials: 'include', // Always include cookies
  headers: { 'Content-Type': 'application/json' }
});
```

**Key points**:
- All API calls go through `ApiService` class
- Always use `credentials: 'include'` for authenticated requests
- Returns `{data?, error?}` structure
- Base URL from `process.env.NEXT_PUBLIC_API_BASE`

### Frontend Type System
User profiles follow the `Profile` interface in `matcha/src/types/profile.ts`:
```typescript
interface Profile {
  id: string; firstName; lastName; email; gender; preferences; bio;
  interests: string[]; birthdate: Date; fameRating: number; location?;
}
```

Data from backend is converted via `backendUserToProfile()` function which maps fields:
- `first_name` → `firstName`, `orientation` → `preferences`, `tags` → `interests`
- **Always add missing fields to both Profile interface and backendUserToProfile()**

---

## Developer Workflow

### Starting Development
```bash
cd /home/louis/Documents/Matcha
docker compose --profile dev up --build    # First time
docker compose --profile dev up            # Subsequent times

# Services:
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Database: localhost:5432 (matcha/matcha)
```

### Adding a New Feature

**1. Backend (Go)**:
- Add handler to `backend/server/handler.go` (follows pattern above)
- Register route in `backend/server/routes.go` (protected or auth group)
- If modifying database schema, create migration in `backend/migrations/`

**2. Frontend (React/TypeScript)**:
- Add API method to `ApiService` in `matcha/src/services/api.ts`
- Create hook if state management needed (e.g., `hooks/useNewFeature.ts`)
- Update Profile type if new user field (in `matcha/src/types/profile.ts`)
- Use component in `matcha/src/app/` or `matcha/src/components/`

**3. Test**:
- Backend: `curl -X POST 'http://localhost:8080/endpoint' -b cookies.txt`
- Login first: `curl -X POST 'http://localhost:8080/auth/login' -d 'username=louisejacquet17' -d 'password=Password123!' -c cookies.txt`
- **Test credentials** (dev-only, never used in production):
  - Username: `louisejacquet17`
  - Password: `Password123!`
  - User ID: 19 (Female, "likes women")
  - Use these for any feature verification without security concerns

---

## Core Conventions & Gotchas

### Authentication
- Cookie-based, token in `session_token` cookie set by backend on login
- Frontend automatically includes cookie via `credentials: 'include'`
- Protected routes use `AuthMiddleware` which extracts `userID` from token
- **Gotcha**: Email updates in `GeneralInformations` component require both API call AND type update

### Database Queries
- Use parameterized queries: `db.QueryRow("SELECT ... WHERE id = $1", userID)`
- Database tables: `users`, `user_tags`, `tags`, `user_locations`, `profile_likes`, `profile_views`
- **Test account** (development only):
  - Username: `louisejacquet17` / Password: `Password123!`
  - User ID: 19
  - Safe to use for all testing and verification without security concerns

### API Response Format
Backend always returns:
- Success: `{"message": "..."}`  or `{"data": {...}}`
- Error: `{"error": "..."}`

Frontend expects `ApiResponse<T> = {data?: T, error?: string, message?: string}`

### Profile/Matching Logic
- **Compatibility score**: `0.5 * distance + 0.3 * tags + 0.2 * fame`
- **Mutual compatibility**: Both users must have matching `preferences` (e.g., both like women)
- **Distance calculation**: Haversine formula in degrees to kilometers
- Location: `{latitude, longitude}` from `user_locations` table

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/server/handler.go` | All HTTP endpoint handlers |
| `backend/server/routes.go` | Route registration & middleware setup |
| `backend/server/middleware.go` | AuthMiddleware (extracts userID from session_token) |
| `matcha/src/services/api.ts` | Centralized API client class |
| `matcha/src/hooks/useAuth.ts` | Authentication state hook |
| `matcha/src/types/profile.ts` | Profile interface + conversion functions |
| `matcha/src/app/home/profile/[id]/page.tsx` | Profile view with compatibility calculation |
| `matcha/src/components/profile/GeneralInformations.tsx` | Edit user profile info |

---

## Common Tasks

### Adding a new user field
1. Add column to `users` table (migration in `backend/migrations/`)
2. Update `GetCurrentUserHandler` to SELECT the field
3. Add field to `Profile` interface & `BackendUserProfile`
4. Update `backendUserToProfile()` function to map it
5. Create handler like `UpdateProfileHandler()` for persistence
6. Call API in frontend component

### Creating a new endpoint
1. Write handler in `handler.go` (use userID from `c.Get("userID")`)
2. Register route in `routes.go`
3. Add method to `ApiService` in `api.ts`
4. Use in React component via hook or direct API call

### Debugging authentication issues
- Check `cookies.txt` has valid `session_token`
- Verify `AuthMiddleware` in `middleware.go` runs before handler
- Ensure `credentials: 'include'` in fetch calls
- Backend CORS configured for `http://localhost:3000`

---

## Notes for AI Agents

- **File changes persist**: Check current file contents before editing (formatter/git may have changed files)
- **Type-driven development**: Profile type changes ripple through codebase - update interface first
- **API centralization**: Never use fetch directly in components - add method to `ApiService`
- **Cookie pattern**: Frontend never manages session_token - backend handles lifecycle
- **Compatibility matching**: Ensure both direction checks (mutual orientation match) when filtering profiles
