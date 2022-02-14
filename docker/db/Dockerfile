FROM postgres:14.2-alpine3.15

ARG TZ="Europe/Amsterdam"
ARG TM_VERSION="5.9.13"

# get schema export from tailormap persistence
RUN set -eux; \
    apk upgrade --update && apk -U add --no-cache tzdata curl unzip \
    && curl https://repo.b3p.nl/nexus/repository/public/org/tailormap/viewer-config-persistence/$TM_VERSION/viewer-config-persistence-$TM_VERSION.jar  -o /tmp/viewer-config-persistence.jar \
    # note that the sql scripts are executed from the respective scripts and not the database init procedure (as that results in tables in postgres database)
    && unzip -p /tmp/viewer-config-persistence.jar scripts/postgresql-schema-export.sql > ./docker-entrypoint-initdb.d/2-postgresql-schema-export.sql.script \
    && rm -rf /tmp/*

COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d
