#!/bin/sh
sed -i "s@{SRC}@$SRC@" /usr/share/nginx/html/index.html
sed -i "s@{SRC}@$SRC@" /usr/share/nginx/html/secured.html
sed -i "s@{SRC}@$SRC@" /usr/share/nginx/html/feature-selection.html
