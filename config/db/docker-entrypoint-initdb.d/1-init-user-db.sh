#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER tailormap with password '$TAILORMAP_PASSWORD';
    CREATE DATABASE tailormap owner tailormap;
EOSQL
