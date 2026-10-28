#!/bin/sh
set -eu

: "${VITE_API_BASE_URL:?VITE_API_BASE_URL must be set in the container environment}"

jq -nr --arg apiBaseUrl "$VITE_API_BASE_URL" \
    '"window.__RUNTIME_CONFIG__ = \({VITE_API_BASE_URL: $apiBaseUrl} | tojson);"' \
    > /usr/share/nginx/html/runtime-config.js
