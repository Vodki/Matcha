#!/bin/bash

# Script de vérification de l'intégration Backend-Frontend
# Ce script teste que les services sont correctement démarrés et communiquent

echo "🔍 Vérification de l'intégration Matcha Backend-Frontend"
echo "========================================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de vérification
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# 1. Vérifier que Docker est installé
echo "1. Vérification de Docker..."
docker --version > /dev/null 2>&1
check "Docker est installé"
echo ""

# 2. Vérifier que les conteneurs sont en cours d'exécution
echo "2. Vérification des conteneurs..."
docker ps | grep -q "matcha_backend"
check "Backend (matcha_backend) est en cours d'exécution"

docker ps | grep -q "matcha_frontend"
check "Frontend (matcha_frontend) est en cours d'exécution"

docker ps | grep -q "matcha_db"
check "Base de données (matcha_db) est en cours d'exécution"
echo ""

# 3. Vérifier que le backend répond
echo "3. Vérification de l'API Backend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/auth/verify?token=test)
if [ "$response" == "400" ] || [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} Backend répond sur le port 8080 (HTTP $response)"
else
    echo -e "${RED}✗${NC} Backend ne répond pas correctement (HTTP $response)"
fi
echo ""

# 4. Vérifier que le frontend répond
echo "4. Vérification du Frontend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} Frontend répond sur le port 3000"
else
    echo -e "${RED}✗${NC} Frontend ne répond pas correctement (HTTP $response)"
fi
echo ""

# 5. Vérifier que la base de données est accessible
echo "5. Vérification de la base de données..."
docker exec matcha_db pg_isready -U matcha > /dev/null 2>&1
check "PostgreSQL est prêt"
echo ""

# 6. Test d'inscription (optionnel)
echo "6. Test d'inscription (optionnel)..."
echo -e "${YELLOW}ℹ${NC} Pour tester l'inscription, exécutez:"
echo "   curl -X POST http://localhost:8080/auth/register \\"
echo "     -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "     -d \"username=testuser&password=Test1234&email=test@test.com&first_name=Test&last_name=User\""
echo ""

# 7. Résumé
echo "========================================================="
echo "📊 Résumé"
echo "========================================================="
echo ""
echo "Services disponibles:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:8080"
echo "  - Database:  localhost:5432"
echo ""
echo "Documentation:"
echo "  - README_API_INTEGRATION.md   - Guide complet"
echo "  - README_TESTING.md           - Tests et débogage"
echo "  - README_IMPLEMENTATION.md    - Résumé de l'implémentation"
echo ""
echo "Logs:"
echo "  - Backend:   docker logs matcha_backend"
echo "  - Frontend:  docker logs matcha_frontend"
echo "  - Database:  docker logs matcha_db"
echo ""
echo -e "${GREEN}✓${NC} Vérification terminée!"
