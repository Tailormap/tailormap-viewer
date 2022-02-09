#!/usr/bin/env bash
set -e

# use the following to create the dump for example:
# docker exec -i -u postgres -e PGPASSWORD=tailormap tailormap-viewer_db_1 pg_dump -aOx -E UTF-8 -S postgres --disable-triggers tailormap > config/db/docker-entrypoint-initdb.d/3-dump.sql.script

echo "Loading Tailormap default data"
# use admin to be able to disable triggers
PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 --username "postgres" --dbname tailormap -f /docker-entrypoint-initdb.d/3-dump.sql.script
