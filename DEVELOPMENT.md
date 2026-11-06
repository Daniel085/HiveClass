# Developing HiveClass locally

This runs the 2016 HiveClass code, unchanged, with one command. It is the baseline
that modernization work is tested against (see `MODERNIZATION_PLAN_2025.md`).

## Requirements

- Docker with Compose v2.24 or newer (`docker compose version`)

## Start

```sh
cp .env.example .env     # then fill in the Google OAuth values (see below)
docker compose up --build
```

Open <http://localhost:8080/apps/login/>. You should see the HiveSchool
"Start Your Class" page.

Stop with `Ctrl+C`, or `docker compose down`. Add `-v` to also delete the database.

## What runs

| Service          | Purpose                                              | Host port |
|------------------|------------------------------------------------------|-----------|
| `router`         | Front door; proxies `/auth`, `/apps`, `/storage`, ... | **8080**  |
| `rendezvous`     | WebRTC signaling (WebSocket) and classroom codes     | **9090**  |
| `auth`           | Google sign-in, domain whitelist                     | –         |
| `apps`           | Serves the login, teacher and student web apps       | –         |
| `storage`        | Google Drive and database storage for teachers       | –         |
| `logging`        | Collects client logs (in memory)                     | –         |
| `jira`           | Feedback proxy to Jira (unused unless configured)    | –         |
| `mongo`          | MongoDB 3.6 for `auth` and `storage`                 | –         |
| `seed-whitelist` | One-shot: allows sign-in from `DEV_WHITELIST_DOMAINS` | –         |

Everything runs on Node 8, the newest version these 2016 dependencies support.
Upgrading them is a separate step in the modernization plan.

Logs: `docker compose logs -f <service>`.
Active classrooms: `docker compose exec rendezvous wget -qO- localhost:19090/classroom`.

## Google sign-in

Sign-in needs your own Google OAuth client. The credentials that used to be
committed to this repository have been removed.

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth client ID** of type **Web application**.
2. Add the authorized redirect URI `http://localhost:8080/auth/google`.
3. Put the client ID and secret in `.env`, then `docker compose up -d auth storage`.

Without them, every service still starts, and the login page loads, but the
"Sign in with Google" button will fail at Google. `auth` logs a warning.

Only email domains in `DEV_WHITELIST_DOMAINS` can sign in (default:
`["gmail.com"]`). To change the list, edit `.env` and run
`docker compose up seed-whitelist`.

## Chrome extensions: known limitation

The teacher and student apps are designed to run inside the HiveSchool Chrome
extensions (`hiveclass-master/extensions/`). Opened directly in a browser, they
load and show a loading spinner, waiting for the extension.

**Current Chrome cannot load these extensions.** They use Manifest V2, which
Chrome no longer supports. Porting them to Manifest V3 is the next step in the
modernization plan. Until then, a full teacher-and-student session can only run
in an old Chromium build that still supports Manifest V2.

When an extension can be loaded, use `chrome://extensions` → Developer mode →
Load unpacked. Both extensions already point at `http://localhost:8080`
(`extensions/*/js/configuration.js`).

## Changing code

The images contain a copy of the source, so rebuild after changes:

```sh
docker compose up --build -d            # all services
docker compose up --build -d apps       # just the web apps
```

### Dependencies are pinned

Every package has a `package-lock.json`, and the images install with `npm ci`, so
everyone gets exactly the same versions. Two details matter for the web apps
(`hiveclass-master/{login,student,teacher}`):

- **Nested `node_modules`.** Montage 0.16 loads modules in the browser from the
  npm 2 style nested layout. Each app's `.npmrc` sets `legacy-bundling=true`.
- **2016 git commits.** `matte`, `montage-webrtc` and Montage's own loader `mr`
  are pinned to the commits that were current when HiveClass last shipped. Their
  `master` branches have since moved to incompatible versions. `mr` is pinned in
  the lockfiles (Montage depends on `mr#master`), so use `npm ci`, not
  `npm install`, which re-resolves `master`.

To change a dependency, run npm inside the Node 8 image so the lockfile format
matches:

```sh
docker run --rm -it -v "$PWD":/repo -w /repo/hiveclass-master/teacher node:8-alpine \
  sh -c 'apk add --no-cache git && npm install <package>'
```

## Configuration

Server settings come from environment variables, with defaults for local
development. See `.env.example` and each service's `config.js` in
`hiveclass-server-master/`. Defaults are for development only: set
`COOKIE_PASSWORD`, `ADMIN_BEARER_TOKEN` and the OAuth values for any real
deployment.

## Behind a TLS-inspecting proxy

School and corporate networks often re-sign HTTPS traffic. If `npm ci` fails with
certificate errors during the build, pass your network's CA certificate as a
build secret:

```sh
docker build --secret id=ca_cert,src=/path/to/ca.pem -f docker/Dockerfile --target server -t hiveclass-server:dev .
docker build --secret id=ca_cert,src=/path/to/ca.pem -f docker/Dockerfile --target apps   -t hiveclass-apps:dev .
docker compose up --no-build
```
