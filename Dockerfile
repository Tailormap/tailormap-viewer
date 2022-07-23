# Note when updating this version also update the version in the workflow files
FROM node:16.16.0 AS builder

ARG BASE_HREF=/

WORKDIR /app

COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm install

COPY . /app

# Disabled for now because of runtime -- GitHub Actions job runs tests in parallel
#RUN npm run test

RUN npm run build-app -- --base-href=${BASE_HREF}

FROM nginx:1.23.1-alpine

COPY --from=builder /app/dist/app /usr/share/nginx/html

COPY docker/web/nginx.conf /etc/nginx/nginx.conf
COPY docker/web/api-proxy.conf.template /etc/nginx/templates/api-proxy.conf.template
COPY docker/web/admin-proxy.conf.template /etc/nginx/templates/admin-proxy.conf.template
COPY docker/web/enable-proxies.sh /docker-entrypoint.d/enable-proxies.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=2 CMD wget --spider --header 'Accept: text/html' http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
