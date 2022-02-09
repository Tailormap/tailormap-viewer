#!/usr/bin/env sh

if [ "$API_PROXY_ENABLED" = true ]; then
  echo Enabling API proxy to $API_PROXY_URL
  sed -i 's/#api //g' /etc/nginx/nginx.conf
fi;

if [ "$ADMIN_PROXY_ENABLED" = true ]; then
  echo Enabling admin proxy to $ADMIN_PROXY_URL
  sed -i 's/#admin //g' /etc/nginx/nginx.conf
fi;
