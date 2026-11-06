# syntax=docker/dockerfile:1
#
# Development images for the HiveClass server and web apps, as they were in 2016.
# Node 8 is the newest Node these dependencies (Hapi 13, ws 0.7, mongodb 2.2) run on.
# Build context is the repository root; see docker-compose.yml.

# ---- server: the seven Node services --------------------------------------
FROM node:8-alpine AS server
WORKDIR /srv/hiveclass-server
COPY docker/npm-install.sh /usr/local/bin/npm-install
COPY hiveclass-server-master/apps/package*.json       apps/
COPY hiveclass-server-master/auth/package*.json       auth/
COPY hiveclass-server-master/jira/package*.json       jira/
COPY hiveclass-server-master/logging/package*.json    logging/
COPY hiveclass-server-master/rendezvous/package*.json rendezvous/
COPY hiveclass-server-master/router/package*.json     router/
COPY hiveclass-server-master/storage/package*.json    storage/
RUN --mount=type=secret,id=ca_cert,required=false \
    npm-install apps auth jira logging rendezvous router storage
COPY hiveclass-server-master/ ./
COPY docker/seed-whitelist.js ./
ENV HOST=0.0.0.0

# ---- web-deps: install the Montage apps' dependencies (needs git) ----------
FROM node:8-alpine AS web-deps
RUN apk add --no-cache git
WORKDIR /srv/hiveclass
COPY docker/npm-install.sh /usr/local/bin/npm-install
COPY hiveclass-master/login/package*.json hiveclass-master/login/.npmrc   login/
COPY hiveclass-master/student/package*.json hiveclass-master/student/.npmrc student/
COPY hiveclass-master/teacher/package*.json hiveclass-master/teacher/.npmrc teacher/
RUN --mount=type=secret,id=ca_cert,required=false \
    npm-install login student teacher

# ---- apps: the "apps" service plus the login, student and teacher web apps -
FROM server AS apps
WORKDIR /srv/hiveclass
COPY hiveclass-master/common  common/
COPY hiveclass-master/login   login/
COPY hiveclass-master/student student/
COPY hiveclass-master/teacher teacher/
COPY --from=web-deps /srv/hiveclass/login/node_modules   login/node_modules/
COPY --from=web-deps /srv/hiveclass/student/node_modules student/node_modules/
COPY --from=web-deps /srv/hiveclass/teacher/node_modules teacher/node_modules/
WORKDIR /srv/hiveclass-server
ENV APPS_ROOT=/srv/hiveclass
CMD ["node", "apps/app.js"]
