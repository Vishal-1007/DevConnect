#!/usr/bin/env bash
# Run on EC2 from repository root: bash deploy/aws/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="deploy/aws/.env"
COMPOSE_FILES=(-f deploy/aws/docker-compose.aws.yml)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy from deploy/aws/.env.example and edit secrets."
  exit 1
fi

# RDS overlay when RDS_HOST is set
if grep -qE '^RDS_HOST=.+' "$ENV_FILE" 2>/dev/null; then
  COMPOSE_FILES+=(-f deploy/aws/docker-compose.aws-rds.yml)
  PROFILE_ARGS=()
  echo "Using RDS (no local postgres container)"
else
  PROFILE_ARGS=(--profile local-db)
  echo "Using local PostgreSQL container on EC2"
fi

# Optional AI profile
AI_PROFILE=""
if grep -qE '^OLLAMA_BASE_URL=http://ollama' "$ENV_FILE"; then
  AI_PROFILE="--profile ai"
  echo "Ollama AI profile enabled"
fi

echo "Building and starting DevConnect..."
docker compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" \
  ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} \
  $AI_PROFILE \
  up -d --build

echo ""
echo "Deployment started. Check status:"
echo "  docker compose ${COMPOSE_FILES[*]} --env-file $ENV_FILE ps"
echo "  curl -s http://localhost/actuator/health"
echo ""
echo "Open in browser: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo YOUR_EC2_IP)"
