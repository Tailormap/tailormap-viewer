FROM node:16.13.1 AS builder

ARG BASE_HREF=/

# set working directory
WORKDIR /app

# install and cache app dependencies
COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm install

# add app
COPY . /app

# run tests
RUN npm run test

# generate build
RUN npm run build -- --base-href=${BASE_HREF}

# base image
FROM nginx:1.21.4-alpine

ARG NGINX_CONF=nginx.conf

# copy artifact build from the 'build environment'
COPY --from=builder /app/dist/app /usr/share/nginx/html

COPY ./config/${NGINX_CONF} /etc/nginx/nginx.conf

# expose port 80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=2 CMD wget --spider --header 'Accept: text/html' http://localhost/ || exit 1

# run nginx
CMD ["nginx", "-g", "daemon off;"]
