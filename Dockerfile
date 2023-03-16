ARG BUILDPLATFORM=linux/amd64
ARG VERSION=snapshot
ARG API_VERSION=snapshot

# Note when updating this version also update the version in the workflow files
FROM --platform=linux/amd64 node:18.15.0 AS builder

ARG BASE_HREF=/

WORKDIR /app

COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm install

COPY . /app

RUN npm run build -- --base-href=${BASE_HREF}
RUN npm run build-admin -- --base-href=${BASE_HREF}admin/

FROM --platform=$BUILDPLATFORM ghcr.io/b3partners/tailormap-api:${API_VERSION}

LABEL org.opencontainers.image.authors="info@b3partners.nl" \
      org.opencontainers.image.description="Tailormap" \
      org.opencontainers.image.vendor="B3Partners BV" \
      org.opencontainers.image.title="Tailormap" \
      org.opencontainers.image.url="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.source="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.documentation="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${VERSION}"

COPY --from=builder /app/dist/app static/
