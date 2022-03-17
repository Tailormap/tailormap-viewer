#!/usr/bin/env bash
set -e

# use the following to create the dump (ignore the circular foreign key constraints warnings):
# docker-compose --profile http --profile full exec -u postgres db pg_dump -aOx -E UTF-8 -S postgres --disable-triggers tailormap -f /tmp/dump.sql
# docker-compose --profile http --profile full exec db cat /tmp/dump.sql > docker/db/docker-entrypoint-initdb.d/3-dump.sql.script
# or
# docker exec -u postgres tailormap-db pg_dump -aOx -E UTF-8 -S postgres --disable-triggers tailormap -f /tmp/dump.sql
# docker exec tailormap-db cat /tmp/dump.sql > docker/db/docker-entrypoint-initdb.d/3-dump.sql.script

# NOTE! When you update this dump using the command above, you can leave the admin account in the dump. You could remove it manually but in
# case you forget: all user accounts are deleted when the dump is loaded (see below). tailormap-api will create a new account with a
# randomly generated password.

echo "Loading Tailormap default data"
# use admin to be able to disable triggers
PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 --username "postgres" --dbname tailormap -f /docker-entrypoint-initdb.d/3-dump.sql.script

psql --username postgres --dbname tailormap -c "delete from user_ips; delete from user_details; delete from user_groups; delete from user_;"
