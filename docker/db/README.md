# tailormap-db

Container for development and continuous deployment of Tailormap on h03.b3p.nl (or local development).

Connect using a SSH tunnel:

```
ssh -L 55432:localhost:55432 h03.b3p.nl
psql -h localhost -p 55432 -U tailormap tailormap
```

## Loading initial data

This container starts up with a preconfigured `tailormap` database on first use using the file `docker-entrypoint-initdb.d/3-dump.sql.script`.
When `tailormap-api` starts up, it will create a new admin user password and reset the admin roles.

## Dumping data

After modifying an application or loading services a new dumpfile must be created, the commands to do this can be found
in `docker-entrypoint-initdb.d/3-load-data.sh`, these will result in a new version of `docker-entrypoint-initdb.d/3-dump.sql.script` that
should be pushed to the repository.
