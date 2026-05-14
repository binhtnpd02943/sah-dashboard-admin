#!/bin/bash
set -Eeuo pipefail

ENV=${1:-staging}
PORT=$([ "$ENV" == "production" ] && echo 3000 || echo 3010)
URL="http://127.0.0.1:$PORT/api/health"

echo "-> Healthcheck: $URL"

for i in {1..10}; do
    if curl -s -f "$URL" > /dev/null; then
        echo "✅ Healthcheck passed!"
        exit 0
    fi
    echo "⚠️ Attempt $i failed. Retrying..."
    sleep 5
done

echo "❌ Healthcheck failed!"
exit 1
