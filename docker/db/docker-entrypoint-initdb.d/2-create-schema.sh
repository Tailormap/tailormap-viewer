#!/usr/bin/env bash
set -e

echo "Initializing Tailormap schema"
PGPASSWORD="$TAILORMAP_PASSWORD" psql -v ON_ERROR_STOP=1 --username tailormap --dbname tailormap -f /docker-entrypoint-initdb.d/2-postgresql-schema-export.sql.script
