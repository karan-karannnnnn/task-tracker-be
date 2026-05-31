#!/bin/sh
set -e

# If database host/port provided, wait until it is accepting connections
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  MAX_RETRIES=60
  RETRY=0
  while true; do
    if [ -n "$DB_PASSWORD" ]; then
      MYSQL_PWD="$DB_PASSWORD" mysql --protocol=TCP --connect-timeout=2 -h"$DB_HOST" -P"$DB_PORT" -u"${DB_USER:-root}" -e "SELECT 1" >/dev/null 2>&1 || MYSQL_ERR="$?"
    else
      mysql --protocol=TCP --connect-timeout=2 -h"$DB_HOST" -P"$DB_PORT" -u"${DB_USER:-root}" -e "SELECT 1" >/dev/null 2>&1 || MYSQL_ERR="$?"
    fi
    if [ -z "$MYSQL_ERR" ]; then
      break
    fi
    RETRY=$((RETRY+1))
    if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
      echo "Timed out waiting for database at $DB_HOST:$DB_PORT after $MAX_RETRIES attempts (last mysql exit: $MYSQL_ERR)"
      exit 1
    fi
    # Show client error code for first few attempts to aid debugging
    if [ "$RETRY" -le 5 ]; then
      echo "mysql probe failed (exit code: $MYSQL_ERR)"
    fi
    echo "Database is unavailable - sleeping (attempt: $RETRY/$MAX_RETRIES)"
    sleep 2
    unset MYSQL_ERR
  done
  echo "Database is up"
fi

# Run migrations when a DATABASE_URL is present
if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
npx prisma migrate deploy

# Run seed script if present
if [ -f "./prisma/seed.js" ]; then
  echo "Running seed script..."
  node prisma/seed.js
fi

# Exec the main process
exec "$@"
