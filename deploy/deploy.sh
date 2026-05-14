#!/bin/bash
set -Eeuo pipefail

ENV=${1:-staging}
RELEASE_ID=${2:-latest}
APP_DIR=${APP_DIR:-$(pwd)}
PROJECT_NAME="sah-admin-$ENV"

echo "🚀 DEPLOYING $PROJECT_NAME (RELEASE: $RELEASE_ID)"

cd "$APP_DIR"

COMPOSE_FILE="docker-compose.$([ "$ENV" == "production" ] && echo "prod" || echo "stage").yml"

# Backup current .env
[ -f .env ] && cp .env .env.bak || touch .env.bak

# Update IMAGE_URI in .env
sed -i '/^IMAGE_URI=/d' .env || true
echo "IMAGE_URI=$IMAGE_URI" >> .env

echo "-> Pulling $IMAGE_URI..."
docker compose -f docker-compose.yml -f "$COMPOSE_FILE" -p "$PROJECT_NAME" pull

echo "-> Starting containers..."
if ! docker compose -f docker-compose.yml -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --wait --remove-orphans; then
    echo "❌ Deployment failed healthcheck!"
    docker compose -f docker-compose.yml -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs --tail 20
    bash deploy/rollback.sh "$ENV"
    exit 1
fi

echo "✅ DEPLOYED SUCCESSFUL"
docker image prune -f --filter "until=24h"
