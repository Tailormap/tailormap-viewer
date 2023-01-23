FROM postgres:15.1-alpine3.17

ARG TZ="Europe/Amsterdam"
ARG VERSION="snapshot"

LABEL org.opencontainers.image.authors="support@b3partners.nl" \
      org.opencontainers.image.description="Sample configuration database for Tailormap" \
      org.opencontainers.image.vendor="B3Partners BV" \
      org.opencontainers.image.title="Tailormap Viewer database" \
      org.opencontainers.image.url="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.source="https://github.com/B3Partners/tailormap-viewer/docker/db/" \
      org.opencontainers.image.documentation="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${VERSION}"

# get schema export from tailormap persistence
RUN set -eux;ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone\
    && apk upgrade --no-cache && apk -U add --no-cache tzdata curl unzip \
    # this will get the latest version of tailormap persistence from nexus using nexus REST API \
    # see https://help.sonatype.com/repomanager3/integrations/rest-and-integration-api/search-api#SearchAPI-DownloadingtheLatestVersionofanAsset
    && curl -v -L -X GET 'https://repo.b3p.nl/nexus/service/rest/v1/search/assets/download?sort=version&repository=public&maven.groupId=nl.b3p.tailormap&maven.artifactId=tailormap-persistence&maven.extension=jar&maven.classifier' -H 'accept: application/json'  -o /tmp/tailormap-persistence.jar \
    # note that the sql scripts are executed from the respective scripts and not the database init procedure (as that results in tables in postgres database)
    && unzip -p /tmp/tailormap-persistence.jar scripts/postgresql-schema-export.sql > ./docker-entrypoint-initdb.d/2-postgresql-schema-export.sql.script \
    && rm -rf /tmp/*

USER postgres

COPY ./docker-entrypoint-initdb.d /docker-entrypoint-initdb.d
