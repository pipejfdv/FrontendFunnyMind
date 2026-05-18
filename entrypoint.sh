#!/bin/sh
set -e

if [ -n "$BACKEND_URL" ]; then
  echo "BACKEND_URL set to: $BACKEND_URL"
  sed -i "s|__BACKEND_URL__|$BACKEND_URL|g" /etc/nginx/conf.d/default.conf
else
  echo "BACKEND_URL not set. Using localhost:8080."
  sed -i "s|__BACKEND_URL__|http://localhost:8080|g" /etc/nginx/conf.d/default.conf
fi

exec nginx -g "daemon off;"
