#!/bin/sh
set -e

if [ -n "$BACKEND_URL" ]; then
  echo "Replacing BACKEND_URL with: $BACKEND_URL"
  sed -i "s|__BACKEND_URL__|$BACKEND_URL|g" /etc/nginx/conf.d/default.conf
else
  echo "WARNING: BACKEND_URL not set. API proxy will be disabled."
  sed -i 's|proxy_pass https://__BACKEND_URL__/pipejfdv/api/v1/;|proxy_pass http://localhost:8080/pipejfdv/api/v1/;|' /etc/nginx/conf.d/default.conf
fi

exec nginx -g "daemon off;"
