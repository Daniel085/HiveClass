# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HiveClass (formerly HiveSchool) is a Chrome-based classroom management application for connected learning. It enables teachers to view student screens in real-time, present content to the class, assign resources, and manage browser controls (on Chromebooks). The application uses WebRTC for peer-to-peer screen streaming and a microservices backend architecture.

**Key Characteristics:**
- **Monorepo**: Client apps (hiveclass-master) and backend services (hiveclass-server-master) in one repository
- **Microservices**: 7 backend services communicating via HTTP/WebSocket
- **Real-time**: WebRTC for screen sharing, WebSocket for signaling and presence
- **Chrome Extension**: Desktop capture and tab control capabilities
- **Google Apps Domain**: Authentication via OAuth2

## Repository Structure

```
HiveClass/
├── hiveclass-master/              # Frontend applications (MontageJS)
│   ├── login/                    # Login app with OAuth flow
│   ├── student/                  # Student classroom interface
│   ├── teacher/                  # Teacher dashboard and controls
│   ├── extensions/               # Chrome extensions
│   │   ├── teacher/             # Desktop capture, notifications
│   │   ├── student/             # Desktop capture, tab control
│   │   └── common/              # Shared extension services
│   └── test-utils/              # WebRTC mocking infrastructure
├── hiveclass-server-master/       # Backend microservices (Hapi.js)
│   ├── router/                   # API gateway (port 8088)
│   ├── auth/                     # OAuth2 + session management (port 8081)
│   ├── rendezvous/               # WebSocket signaling server (port 9090)
│   ├── apps/                     # Static file server for SPAs (port 8082)
│   ├── storage/                  # MongoDB user data storage (port 8085)
│   ├── logging/                  # Analytics and event logging (port 8084)
│   └── jira/                     # Feedback submission proxy (port 8083)
└── scripts/                       # Utility scripts
```

## Architecture

### Client-Server Communication Flow

1. **Authentication**: Login app → Auth service → Google OAuth2 → Cookie-based session
2. **App Serving**: Browser → Router → Apps service → Static files (login/student/teacher)
3. **Real-time Signaling**: Apps → WebSocket (rendezvous:9090) → Room management
4. **WebRTC Mesh**: Student ↔ Teacher peer-to-peer connections (screen streams)
5. **Data Persistence**: Apps → Storage service → MongoDB (resources, assignments)

### Critical Architectural Patterns

**WebRTC Topology**: Mesh network (not SFU/MCU)
- Each student maintains a single peer connection to the teacher
- Teacher maintains N peer connections (one per student)
- Teacher is the "impolite peer", students are "polite peers" (Perfect Negotiation pattern)
- Implementation: `student/webrtc/client.js` and `teacher/webrtc/server.js`

**Service Discovery**: No service registry
- Services hardcoded in configuration files (core/configuration.json)
- Router acts as reverse proxy to internal services
- Extensions configured with app URLs in `extensions/*/js/configuration.js`

**State Management**:
- Student state machine: loading → enterClass → joinClass → dashboard
- Teacher state machine: loading → init → screens → dashboard → resources
- Room state stored in-memory in rendezvous service (lost on restart)

## Technology Stack

**Frontend:**
- MontageJS 3.x (2012-2015 framework, see MONTAGE_FRAMEWORK_TECHNICAL_DEBT.md)
- montage-webrtc: Forked and modernized at `github.com/Daniel085/montage-webrtc#modern-webrtc`
- Chrome Extension APIs: desktopCapture, tabs, windows, notifications

**Backend:**
- Node.js (requires v4+, tested with v20+)
- Hapi.js v21 (upgraded from v13 in Phase 7)
- MongoDB v6.0 (upgraded from v2.1.7)
- WebSocket (ws v8.18.0, upgraded from v0.7.1)

**Communication:**
- HTTP/HTTPS for REST APIs
- WebSocket for signaling and presence
- WebRTC DataChannel for peer-to-peer data
- WebRTC MediaStream for screen sharing

## Common Commands

### Install Dependencies

```bash
# Install all client apps
cd hiveclass-master
npm install  # Installs root test dependencies

cd login && npm install
cd ../student && npm install
cd ../teacher && npm install
cd ../..

# Install all backend services
cd hiveclass-server-master

cd auth && npm install
cd ../rendezvous && npm install
cd ../router && npm install
cd ../apps && npm install
cd ../storage && npm install
cd ../logging && npm install
cd ../jira && npm install
cd ../..

# Create symlinks for apps service
cd hiveclass-server-master/apps
ln -s ../../hiveclass-master/login login
ln -s ../../hiveclass-master/student student
ln -s ../../hiveclass-master/teacher teacher
cd ../..
```

### Testing

```bash
# Run all WebRTC unit tests (from root)
cd hiveclass-master
npm test  # Runs student + teacher WebRTC tests

# Run student tests only
npm run test:client

# Run teacher tests only
npm run test:server

# Run with coverage
npm run test:coverage

# Run individual test files
cd student
npx mocha webrtc/test/client.spec.js --require ../test-utils/webrtc-mock.js

cd ../teacher
npx mocha webrtc/test/server.spec.js --require ../test-utils/webrtc-mock.js
```

**Test Infrastructure**: All WebRTC tests use mocks (`test-utils/webrtc-mock.js`) to avoid requiring actual browser WebRTC APIs. Tests verify API modernization: async/await, addTrack/removeTrack, ontrack, Perfect Negotiation pattern.

### Starting Backend Services

**Prerequisites:**
1. MongoDB must be running on `localhost:27017`
2. Configuration files must have Google OAuth2 credentials

**Option 1: Manual (recommended for development)**

Open 7 terminal windows and start each service:

```bash
# Terminal 1: Auth service
cd hiveclass-server-master/auth
node app.js  # Starts on port 8081

# Terminal 2: Rendezvous service
cd hiveclass-server-master/rendezvous
node app.js  # Starts on ports 9090 (WS) and 19090 (HTTP)

# Terminal 3: Router service
cd hiveclass-server-master/router
node app.js  # Starts on port 8088 (public entry point)

# Terminal 4: Apps service
cd hiveclass-server-master/apps
node app.js  # Starts on port 8082

# Terminal 5: Storage service
cd hiveclass-server-master/storage
node app.js  # Starts on port 8085

# Terminal 6: Logging service
cd hiveclass-server-master/logging
node app.js  # Starts on port 8084

# Terminal 7: Jira service (optional)
cd hiveclass-server-master/jira
node app.js  # Starts on port 8083
```

**Option 2: Automated (legacy script)**

```bash
cd hiveclass-server-master
./start.sh  # Launches all services + MongoDB + browser-sync
```

**Note**: The start.sh script attempts to install MongoDB 3.2.0 locally, which is outdated. Use system MongoDB instead.

### Starting MongoDB

```bash
# If MongoDB installed via Homebrew (macOS)
brew services start mongodb-community

# If MongoDB installed manually
mongod --dbpath /path/to/data

# Verify MongoDB is running
mongoc --eval "db.version()"
```

### Accessing the Application

Once all services are running:

1. Navigate to `http://localhost:8088/apps/login/`
2. Sign in with Google Apps Domain account
3. Ensure your domain is whitelisted (see Configuration section)
4. You'll be redirected to teacher or student app based on your role

### Domain Whitelist Management

```bash
# Add a domain to whitelist (required for login)
curl -X POST http://localhost:8088/auth/whitelist/yourdomain.com \
  -H "Authorization: Bearer your_bearer_token_from_config" \
  -H "Content-Type: application/json" \
  -d '["yourdomain.com"]'

# Check if domain is whitelisted
curl http://localhost:8088/auth/whitelist/yourdomain.com \
  -H "Authorization: Bearer your_bearer_token_from_config"

# For development, use the authorize_domains.js script
cd hiveclass-server-master
node authorize_domains.js
```

## Configuration

### Critical Configuration Files

**Backend Services**: Each service has a `config.js` file with:
- Server host/port
- MongoDB connection string
- Service endpoints
- OAuth2 credentials (auth service only)
- Cookie encryption password

**Frontend Apps**: Each app has `core/configuration.json` with:
- Auth endpoints (profile, check, invalidate)
- WebSocket endpoint (rendezvous)
- Storage endpoint
- Logging endpoint

**Chrome Extensions**: Each extension has `js/configuration.js` with:
- Application URL (e.g., `http://localhost:8088/apps/teacher`)

### Required Configuration Changes for Development

1. **Auth Service** (`hiveclass-server-master/auth/config.js`):
   - Set `providers.google.client_id` and `client_secret`
   - Change `cookie.password` to a random 32-character string
   - Update `oauthLocation` to your public URL

2. **Frontend Apps** (*/core/configuration.json):
   - Update all endpoints to match your router URL (e.g., `http://localhost:8088`)
   - Update `presenceEndpointUrl` to WebSocket URL (e.g., `ws://localhost:9090/ws`)

3. **Chrome Extensions** (*/js/configuration.js):
   - Update `application.url` to match router + app path

## WebRTC Implementation Details

### Modernization Status (Phase 5 Complete)

**All deprecated WebRTC APIs have been removed and replaced with modern equivalents:**

- ✅ `webkitRTCPeerConnection` → Feature detection with `RTCPeerConnection`
- ✅ `createOffer(successCb, errorCb)` → `await createOffer()` (async/await)
- ✅ `addStream(stream)` → `addTrack(track, stream)`
- ✅ `removeStream(stream)` → `removeTrack(sender)`
- ✅ `onaddstream` → `ontrack`
- ✅ Perfect Negotiation pattern implemented (student=polite, teacher=impolite)
- ✅ STUN servers configured for NAT traversal
- ✅ ICE candidate pooling optimized

**Evidence**: 47/47 unit tests passing (student: 27/27, teacher: 20/20)

**Key Files:**
- `hiveclass-master/student/webrtc/client.js` - Student WebRTC client
- `hiveclass-master/teacher/webrtc/server.js` - Teacher WebRTC server (manages N peers)
- `hiveclass-master/test-utils/webrtc-mock.js` - WebRTC mock for testing

### Message Fragmentation

DataChannel messages >50KB are automatically fragmented into chunks to avoid size limits. Implemented in both client.js and server.js with reassembly logic.

## Known Issues and Workarounds

### Issue 1: Montage Framework Compatibility

**Problem**: Montage.js (2012-2015) expects nested node_modules structure (npm v2), but modern npm uses flat hoisting. This causes Bluebird Promise errors in the browser.

**Impact**: Frontend may fail to load with `Uncaught TypeError: expecting a function but got [object Undefined]` from bluebird.

**Workaround**: Run the symlink fix script:
```bash
cd hiveclass-master
../scripts/fix-montage-deps.sh
```

**Root Cause**: Montage framework technical debt (see MONTAGE_FRAMEWORK_TECHNICAL_DEBT.md)

**Long-term Solution**: Framework replacement (6-12 month effort, not started)

### Issue 2: MongoDB Connection Required

**Problem**: Auth service requires MongoDB running on localhost:27017. Without it, authentication will fail.

**Solution**: Start MongoDB before launching services:
```bash
brew services start mongodb-community
# or
mongod --dbpath /path/to/data
```

### Issue 3: Google OAuth Redirect URI Configuration

**Problem**: Google OAuth requires exact redirect URI match. Mismatch causes authentication failure.

**Solution**: In Google Developer Console, add redirect URI exactly as configured in auth/config.js:
- Development: `http://localhost:8088/auth/google`
- Production: `https://yourdomain.com/auth/google`

### Issue 4: Chrome Extension Permissions

**Problem**: Desktop capture requires user permission grant. Students must click "Allow" when prompted.

**Solution**: This is by design for security. No workaround. Extensions should request permission gracefully.

## Development Workflow

### Making Changes to Client Apps

1. Edit files in `hiveclass-master/{login,student,teacher}/`
2. Refresh browser (apps served statically, no build step for development)
3. Check browser console for MontageJS loading errors
4. If you see Bluebird errors, run `scripts/fix-montage-deps.sh`

### Making Changes to Backend Services

1. Edit files in `hiveclass-server-master/{service}/`
2. Restart the service (Ctrl+C, then `node app.js`)
3. Check terminal for service startup errors
4. Verify service is listening on expected port

### Making Changes to WebRTC Code

1. Edit `student/webrtc/client.js` or `teacher/webrtc/server.js`
2. Run unit tests: `cd hiveclass-master && npm test`
3. Verify 47/47 tests still pass
4. Test in browser (requires all services running + MongoDB)
5. Check browser console for WebRTC errors
6. Use `chrome://webrtc-internals` to debug peer connections

### Chrome Extension Development

1. Edit files in `hiveclass-master/extensions/{teacher,student}/`
2. Go to `chrome://extensions/`
3. Click "Reload" on the modified extension
4. Test functionality (desktop capture, tab control, etc.)
5. Check extension background page console for errors

### Adding New WebRTC Features

**Important**: The WebRTC implementation uses:
- Perfect Negotiation pattern (student=polite, teacher=impolite)
- Mesh topology (teacher has N connections, students have 1)
- Track-based APIs (addTrack, not addStream)
- Async/await (no callbacks)

When adding features:
1. Add to both `client.js` and `server.js` consistently
2. Update unit tests in `test/*.spec.js`
3. Ensure 47/47 tests still pass
4. Verify no deprecated APIs introduced (run `grep` checks from PLAN_VS_REALITY_STATUS.md)

## Security Considerations

### Production Deployment

1. **Enable HTTPS**: Set `cookie.is_secure: true` in auth/config.js
2. **Secure Cookie Password**: Generate random 32+ character string
3. **Bearer Token**: Change default in auth/config.js
4. **Firewall**: Only expose Router (8088) and Rendezvous (9090) publicly
5. **MongoDB**: Enable authentication, restrict to localhost
6. **OAuth**: Use production Google OAuth credentials
7. **Domain Whitelist**: Only authorize your school domain(s)

### Vulnerability Status

- ✅ **0 vulnerabilities** after Phase 7 backend modernization (was 97)
- ✅ All dependencies modernized (Hapi 21, MongoDB 6, ws 8.18.0)
- ✅ No deprecated Node.js APIs in use
- ✅ Compatible with Node.js v20+

## Key Architectural Decisions

### Why Microservices?

Each service has a single responsibility:
- **Auth**: Session management separate from app logic
- **Rendezvous**: Stateful WebSocket connections isolated
- **Apps**: Static file serving decoupled from APIs
- **Storage**: User data persistence abstracted
- **Router**: Single entry point for all external traffic

This allows independent scaling and failure isolation.

### Why Mesh Topology for WebRTC?

**Alternative**: SFU (Selective Forwarding Unit) or MCU (Multipoint Control Unit)

**Chosen**: Mesh (peer-to-peer connections)

**Rationale**:
- Simpler to implement (no media server required)
- Lower server costs (no server-side media processing)
- Works well for classroom sizes (<30 students)
- Teacher device is typically more powerful than student devices

**Trade-off**: Does not scale beyond ~30 students (bandwidth limits on teacher device)

### Why MontageJS?

**Historical**: Chosen in 2012-2015 when project started. Modern frameworks (React, Vue, Angular) didn't exist or were immature.

**Current**: Technical debt. Framework is abandoned but functional.

**Future**: Framework replacement planned (Phase 10+, 6-12 months)

### Why Cookie-based Sessions?

**Alternative**: JWT tokens

**Chosen**: Encrypted cookies via @hapi/cookie

**Rationale**:
- Built-in CSRF protection
- Simple to implement with Hapi
- Session data encrypted server-side
- No token storage required on client

**Trade-off**: Does not scale horizontally without sticky sessions or Redis

## Testing Philosophy

**Unit Tests**: Focus on WebRTC implementation correctness
- Mock all browser APIs (RTCPeerConnection, MediaStream, etc.)
- Test async/await flows
- Verify Perfect Negotiation state machine
- Ensure no deprecated APIs used

**Integration Tests**: Not implemented (future work)

**E2E Tests**: Minimal (`hiveclass-master/e2e/`)

**Why Focus on WebRTC Unit Tests?**
- WebRTC is the most complex and error-prone component
- Browser APIs are easy to mock (see test-utils/webrtc-mock.js)
- Catches API deprecations immediately
- Provides confidence for refactoring

## Additional Resources

- **Full Documentation**: See DOCUMENTATION.md (1060+ lines)
- **Modernization Status**: See PLAN_VS_REALITY_STATUS.md and PHASES_5_AND_7_COMPLETION_SUMMARY.md
- **Framework Technical Debt**: See MONTAGE_FRAMEWORK_TECHNICAL_DEBT.md
- **Node.js Installation**: See NODEJS_INSTALLATION_GUIDE.md
- **Original Project**: https://github.com/montagestudio/hiveclass
- **This Fork**: https://github.com/Daniel085/HiveClass

## Port Reference

| Service | Port | Protocol | Public | Purpose |
|---------|------|----------|--------|---------|
| Router | 8088 | HTTP | Yes | API gateway (reverse proxy) |
| Rendezvous WS | 9090 | WebSocket | Yes | Signaling and presence |
| Rendezvous HTTP | 19090 | HTTP | No | Health checks |
| Auth | 8081 | HTTP | No | OAuth2 + session management |
| Apps | 8082 | HTTP | No | Static file server |
| Jira | 8083 | HTTP | No | Feedback proxy |
| Logging | 8084 | HTTP | No | Analytics |
| Storage | 8085 | HTTP | No | User data |
| MongoDB | 27017 | TCP | No | Database |

## Quick Start for Development

```bash
# 1. Start MongoDB
brew services start mongodb-community

# 2. Install dependencies (if not done)
cd hiveclass-master
npm install && cd login && npm install && cd ../student && npm install && cd ../teacher && npm install && cd ..
cd ../hiveclass-server-master
cd auth && npm install && cd ../rendezvous && npm install && cd ../router && npm install && cd ../apps && npm install && cd ../storage && npm install && cd ../logging && npm install && cd ../jira && npm install && cd ..

# 3. Create symlinks
cd apps
ln -s ../../hiveclass-master/login login
ln -s ../../hiveclass-master/student student
ln -s ../../hiveclass-master/teacher teacher
cd ..

# 4. Configure OAuth (edit auth/config.js with your Google credentials)
# 5. Whitelist your domain (edit hiveclass-server-master/authorize_domains.js)

# 6. Start all services (7 terminals)
# Terminal 1: cd hiveclass-server-master/auth && node app.js
# Terminal 2: cd hiveclass-server-master/rendezvous && node app.js
# Terminal 3: cd hiveclass-server-master/router && node app.js
# Terminal 4: cd hiveclass-server-master/apps && node app.js
# Terminal 5: cd hiveclass-server-master/storage && node app.js
# Terminal 6: cd hiveclass-server-master/logging && node app.js
# Terminal 7: cd hiveclass-server-master/jira && node app.js

# 7. Open browser
# Navigate to http://localhost:8088/apps/login/

# 8. Run tests
cd hiveclass-master && npm test  # Should show 47/47 passing
```
