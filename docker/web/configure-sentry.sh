#!/bin/sh

sed -i "s!@SENTRY_DSN@!${SENTRY_DSN}!g" /usr/share/nginx/html/index.html
