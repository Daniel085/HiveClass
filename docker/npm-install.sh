#!/bin/sh
# Installs production dependencies, exactly as pinned in each package-lock.json.
# Usage: npm-install <package-dir>...
#
# If the build is given a "ca_cert" secret (needed behind TLS-inspecting proxies,
# common on school networks), npm and git are told to trust it.
set -e
if [ -f /run/secrets/ca_cert ]; then
    export npm_config_cafile=/run/secrets/ca_cert
    export GIT_SSL_CAINFO=/run/secrets/ca_cert
fi
for dir in "$@"; do
    echo "--- npm ci: $dir"
    (cd "$dir" && npm ci --production --no-audit --loglevel=error)
done
