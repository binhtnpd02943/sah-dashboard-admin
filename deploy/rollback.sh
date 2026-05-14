#!/bin/bash
set -Eeuo pipefail

ENV=${1:-staging}
APP_DIR=${APP_DIR:-$(pwd)}
PROJECT_NAME="sah-admin-$ENV"

echo "🔄 ROLLING BACK $PROJECT_NAME"

cd "$APP_DIR"

COMPOSE_FILE="docker-compose.$([ "$ENV" == "production" ] && echo "prod" || echo "stage").yml"

if [ -f .env.bak ]; then
    mv .env.bak .env
    docker compose -f docker-compose.yml -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    echo "✅ Rollback complete."
else
    echo "❌ No backup environment found to rollback."
    exit 1
fi
