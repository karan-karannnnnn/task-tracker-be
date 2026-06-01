#!/bin/sh
set -e

# If database host/port provided, wait until it is accepting connections
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  MAX_RETRIES=60
  RETRY=0
  while true; do
    if nc -w 2 "$DB_HOST" "$DB_PORT" </dev/null >/dev/null 2>&1; then
      break
    fi
    RETRY=$((RETRY+1))
    if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
      echo "Timed out waiting for database at $DB_HOST:$DB_PORT after $MAX_RETRIES attempts"
      exit 1
    fi
    echo "Database is unavailable - sleeping (attempt: $RETRY/$MAX_RETRIES)"
    sleep 2
  done
  echo "Database is up"
fi

# Run migrations when a DATABASE_URL is present
if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

# Run seed script if present
if [ -f "./prisma/seed.js" ]; then
  echo "Running seed script..."
  node prisma/seed.js
fi

# Exec the main process
exec "$@"
