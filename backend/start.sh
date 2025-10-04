#!/bin/bash

# Script de démarrage du backend
# 1. Attend que la base de données soit prête
# 2. Applique les migrations avec Goose
# 3. Démarre le serveur

set -e

# Parse DB_STRING to extract connection details for psql
# Format: postgres://user:password@host:port/dbname?sslmode=disable
if [ -n "$DB_STRING" ]; then
    DB_USER=$(echo "$DB_STRING" | sed -n 's|postgres://\([^:]*\):.*|\1|p')
    DB_PASS=$(echo "$DB_STRING" | sed -n 's|postgres://[^:]*:\([^@]*\)@.*|\1|p')
    DB_HOST=$(echo "$DB_STRING" | sed -n 's|.*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo "$DB_STRING" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    DB_NAME=$(echo "$DB_STRING" | sed -n 's|.*/\([^?]*\).*|\1|p')
fi

echo "Waiting for database to be ready..."
until PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Database is ready! Applying migrations with Goose..."

# Configure Goose environment variables
export GOOSE_DRIVER=postgres
export GOOSE_DBSTRING="$DB_STRING"
export GOOSE_MIGRATION_DIR=./migrations

# Run Goose migrations
/go/bin/goose up

echo "Migrations completed successfully!"
echo "Starting backend server..."

# Start the backend server
exec go run ./server
