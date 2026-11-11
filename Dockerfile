ARG VERSION=snapshot
ARG API_VERSION=snapshot

# Note when updating this version also update the version in the workflow files
FROM node:24.22.2 AS builder

ARG BASE_HREF=/

WORKDIR /app

COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm install

COPY . /app

RUN npm run build -- --base-href=${BASE_HREF}
# Empty directory for the log files, see below
RUN mkdir /logs

FROM ghcr.io/tailormap/tailormap-api:${API_VERSION}

ARG VERSION=${VERSION}
ARG API_VERSION=${API_VERSION}

LABEL org.opencontainers.image.authors="info@b3partners.nl" \
      org.opencontainers.image.description="Tailormap application" \
      org.opencontainers.image.vendor="B3Partners BV" \
      org.opencontainers.image.title="Tailormap" \
      org.opencontainers.image.url="https://github.com/Tailormap/tailormap-viewer/" \
      org.opencontainers.image.source="https://github.com/Tailormap/tailormap-viewer/" \
      org.opencontainers.image.documentation="https://github.com/Tailormap/tailormap-viewer/" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.base.name="tailormap/tailormap-api:$API_VERSION" \
      tailormap-api.version="$API_VERSION"

COPY --from=builder /app/dist/app /home/cnb/static/
# Directory for the log files owned by the cnb user the application runs as, so a volume mounted on it is writable. A
# volume mounted on a directory which does not exist in the image is owned by root. See docker-compose.logs.yml
COPY --from=builder --chown=cnb:cnb /logs /home/cnb/logs
