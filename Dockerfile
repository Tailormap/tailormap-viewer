# Note when updating this version also update the version in the workflow files
FROM --platform=$BUILDPLATFORM node:18.14.0 AS builder

ARG BASE_HREF=/

WORKDIR /app

COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm install

COPY . /app

RUN npm run build -- --base-href=${BASE_HREF}
RUN npm run build-admin -- --base-href=${BASE_HREF}admin/

FROM nginx:1.23.3-alpine

ARG VERSION=snapshot
ARG TZ="Europe/Amsterdam"

LABEL org.opencontainers.image.authors="support@b3partners.nl" \
      org.opencontainers.image.description="Tailormap Viewer provides the web interface for Tailormap" \
      org.opencontainers.image.vendor="B3Partners BV" \
      org.opencontainers.image.title="Tailormap Viewer" \
      org.opencontainers.image.url="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.source="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.documentation="https://github.com/B3Partners/tailormap-viewer/" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${VERSION}"

COPY --from=builder /app/dist/app /usr/share/nginx/html
COPY --from=builder /app/dist/admin /usr/share/nginx/html/admin

COPY docker/web/nginx.conf /etc/nginx/nginx.conf
COPY docker/web/api-proxy.conf.template /etc/nginx/templates/api-proxy.conf.template
COPY docker/web/admin-proxy.conf.template /etc/nginx/templates/admin-proxy.conf.template
COPY docker/web/enable-proxies.sh /docker-entrypoint.d/enable-proxies.sh
COPY docker/web/configure-sentry.sh /docker-entrypoint.d/99-configure-sentry.sh

# set-up timezone
RUN set -eux;ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && apk upgrade --no-cache && apk -U add --no-cache tzdata

EXPOSE 80

# NO USER command; nginx drops to nginx user for worker processes

HEALTHCHECK --interval=30s --timeout=3s --retries=2 CMD wget --spider --header 'Accept: text/html' http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
