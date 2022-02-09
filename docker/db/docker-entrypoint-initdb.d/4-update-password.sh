#!/usr/bin/env bash
set -e

PGPASSWORD="$TAILORMAP_PASSWORD" psql -v ON_ERROR_STOP=1 --username tailormap --dbname tailormap <<-EOSQL
    update user_ set password='$TAILORMAP_ADMIN_HASHED_PASSWORD' where username='admin';
EOSQL
