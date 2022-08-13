FROM postgres:14.5-alpine3.16

ARG TZ="Europe/Amsterdam"

# get schema export from tailormap persistence
RUN set -eux; \
    apk upgrade --update && apk -U add --no-cache tzdata curl unzip \
    # this will get the latest version of tailormap from nexus using nexus REST API \
    # see https://help.sonatype.com/repomanager3/integrations/rest-and-integration-api/search-api#SearchAPI-DownloadingtheLatestVersionofanAsset
    && curl -v -L -X GET 'https://repo.b3p.nl/nexus/service/rest/v1/search/assets/download?sort=version&repository=public&maven.groupId=nl.b3p.tailormap&maven.artifactId=tailormap-persistence&maven.extension=jar&maven.classifier' -H 'accept: application/json'  -o /tmp/tailormap-persistence.jar \
    # note that the sql scripts are executed from the respective scripts and not the database init procedure (as that results in tables in postgres database)
    && unzip -p /tmp/tailormap-persistence.jar scripts/postgresql-schema-export.sql > ./docker-entrypoint-initdb.d/2-postgresql-schema-export.sql.script \
    && rm -rf /tmp/*

COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d
