#!/usr/bin/env bash
set -e

# use the following to create the dump (ignore the circular foreign key constraints warnings):
# docker compose --profile full exec -u postgres db pg_dump -aOx -E UTF-8 -S postgres --disable-triggers tailormap > docker/db/docker-entrypoint-initdb.d/3-dump.sql.script

# NOTE! When you update this dump using the command above, you can leave the admin account in the dump. You could remove it manually but in
# case you forget: all admin accounts are deleted when the dump is loaded (see below). tailormap-api will create a new account with a
# randomly generated password.


if [ "$CONFIG_DB_INIT_EMPTY" = true ]
  then
    echo "Initializing empty database"
    PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 --username "postgres" --dbname tailormap -f /docker-entrypoint-initdb.d/3-initialize-empty-database.sql.script
  else
    echo "Loading Tailormap default data"
    # use admin to be able to disable triggers
    PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 --username "postgres" --dbname tailormap -f /docker-entrypoint-initdb.d/3-dump.sql.script
fi


psql --username postgres --dbname tailormap -c "delete from user_ips; delete from user_details; delete from user_groups where group_ = 'Admin' or username = 'admin'; delete from user_ where username = 'admin';"
