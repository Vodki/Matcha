# Matcha - Docker usage

This repository is dockerized with separate frontend (Next.js) and backend (Go/Gin) services plus a Postgres database.
We provide two modes via Docker Compose profiles: development (dev) and local production (prod). Both run on localhost.

## Prerequisites
- Docker & Docker Compose plugin installed

## Environment
Create a `.env` file at the repo root (optional). See `.env.example`.

## Development Mode
Features:
- Live reload for Go (using `go run`) and Next.js (hot reload)
- Source code mounted into containers

Start:
```bash
docker compose --profile dev up --build
```
Stop:
```bash
docker compose --profile dev down
```

Services in dev:
- db (Postgres) => localhost:5432
- backend => localhost:8080
- frontend => http://localhost:3000

## Local Production Mode
Features:
- Optimized multi-stage builds
- Distroless Go image, production Node build
- No source bind mounts

Start:
```bash
docker compose --profile prod up --build
```
Stop:
```bash
docker compose --profile prod down
```

Services in prod (still localhost):
- db (Postgres) => localhost:5432
- backend_prod => localhost:8080
- frontend_prod => http://localhost:3000

## Changing the backend build target
By default dev mode uses target `dev`. Prod profile explicitly uses `prod` target.
You can force another target by exporting `BACKEND_TARGET` before compose build (mainly for experiments).

## Common Commands
Rebuild a single service:
```bash
docker compose build backend
```
View logs:
```bash
docker compose logs -f backend
```
Run a one-off DB psql session:
```bash
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB
```

## Notes / Next Steps
- Add a migration step (e.g. goose) as an init container or sidecar if needed.
- Consider adding a hot-reload tool for Go such as air for faster backend iteration.
- Add a reverse proxy (Caddy/NGINX/Traefik) in front if you later deploy externally.

Enjoy!
