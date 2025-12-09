# Phase 7: Backend Server Modernization - Audit

**Date**: December 9, 2025
**Status**: Starting Modernization
**Trigger**: Node.js v20 compatibility issue (`Os.tmpDir is not a function`)

---

## 🎯 Objective

Modernize all backend servers to work with Node.js v20+ and remove deprecated dependencies.

---

## 📊 Server Dependency Audit

### 1. Apps Server (`/hiveclass-server-master/apps`)

**Current Dependencies:**
```json
{
  "blipp": "^2.3.0",
  "good": "^5.1.2",
  "good-console": "^4.1.0",
  "hapi": "^13.0.0",
  "hapi-auth-cookie": "^2.2.0",
  "inert": "^3.2.0"
}
```

**Updates Needed:**
- ❌ `hapi` 13.0.0 → `@hapi/hapi` ^21.3.0
- ❌ `good` 5.1.2 → `@hapi/good` ^9.0.0
- ❌ `good-console` 4.1.0 → `@hapi/good-console` ^9.0.0
- ❌ `hapi-auth-cookie` 2.2.0 → `@hapi/cookie` ^12.0.0
- ❌ `inert` 3.2.0 → `@hapi/inert` ^7.0.0
- ❌ `blipp` 2.3.0 → `blipp` ^4.0.0

---

### 2. Auth Server (`/hiveclass-server-master/auth`)

**Current Dependencies:**
```json
{
  "bell": "^2.9.0",
  "blipp": "^2.3.0",
  "hapi": "^13.0.0",
  "good": "^5.1.2",
  "good-console": "^4.1.0",
  "inert": "^3.2.0",
  "hapi-auth-bearer-token": "^4.0.0",
  "hapi-auth-cookie": "^2.2.0",
  "bluebird": "^3.3.1",
  "mongodb": "^2.1.7",
  "request": "^2.69.0"
}
```

**Updates Needed:**
- ❌ `hapi` 13.0.0 → `@hapi/hapi` ^21.3.0
- ❌ `bell` 2.9.0 → `@hapi/bell` ^13.0.0
- ❌ `good` 5.1.2 → `@hapi/good` ^9.0.0
- ❌ `good-console` 4.1.0 → `@hapi/good-console` ^9.0.0
- ❌ `inert` 3.2.0 → `@hapi/inert` ^7.0.0
- ❌ `hapi-auth-bearer-token` 4.0.0 → `@hapi/bearer-token` ^8.0.0
- ❌ `hapi-auth-cookie` 2.2.0 → `@hapi/cookie` ^12.0.0
- ❌ `blipp` 2.3.0 → `blipp` ^4.0.0
- ❌ `mongodb` 2.1.7 → `mongodb` ^6.0.0
- ❌ `bluebird` 3.3.1 → REMOVE (use native Promises)
- ❌ `request` 2.69.0 → `@hapi/wreck` ^18.0.0 (request deprecated)

---

### 3. Rendezvous Server (`/hiveclass-server-master/rendezvous`)

**Current Dependencies:**
```json
{
  "ws": "^8.18.0",          ← ✅ Already updated!
  "blipp": "^2.3.0",
  "bluebird": "^3.3.1",
  "good": "^5.1.2",
  "good-console": "^4.1.0",
  "hapi": "^13.0.0",
  "hapi-auth-cookie": "^2.2.0",
  "mongodb": "^2.1.7"
}
```

**Updates Needed:**
- ✅ `ws` 8.18.0 (already modern!)
- ❌ `hapi` 13.0.0 → `@hapi/hapi` ^21.3.0
- ❌ `good` 5.1.2 → `@hapi/good` ^9.0.0
- ❌ `good-console` 4.1.0 → `@hapi/good-console` ^9.0.0
- ❌ `hapi-auth-cookie` 2.2.0 → `@hapi/cookie` ^12.0.0
- ❌ `blipp` 2.3.0 → `blipp` ^4.0.0
- ❌ `mongodb` 2.1.7 → `mongodb` ^6.0.0
- ❌ `bluebird` 3.3.1 → REMOVE (use native Promises)

---

### 4. Router Server (`/hiveclass-server-master/router`)

**Current Dependencies:**
```json
{
  "blipp": "^2.3.0",
  "good": "^5.1.2",
  "good-console": "^4.1.0",
  "h2o2": "^5.0.0",
  "hapi": "^13.0.0"
}
```

**Updates Needed:**
- ❌ `hapi` 13.0.0 → `@hapi/hapi` ^21.3.0
- ❌ `good` 5.1.2 → `@hapi/good` ^9.0.0
- ❌ `good-console` 4.1.0 → `@hapi/good-console` ^9.0.0
- ❌ `h2o2` 5.0.0 → `@hapi/h2o2` ^10.0.0
- ❌ `blipp` 2.3.0 → `blipp` ^4.0.0

---

## 🔧 Hapi 13 → 21 Breaking Changes

### Major API Changes:

1. **Package Name Change**
   - Old: `require('hapi')`
   - New: `require('@hapi/hapi')`

2. **Server Initialization**
   - Old: `new Hapi.Server()`
   - New: `Hapi.server()`

3. **Server Connection**
   - Old: `server.connection({ port: 8080 })`
   - New: Constructor `Hapi.server({ port: 8080, host: 'localhost' })`

4. **Plugin Registration**
   - Old: `server.register([plugins], callback)`
   - New: `await server.register([plugins])` (returns Promise)

5. **Server Start**
   - Old: `server.start(callback)`
   - New: `await server.start()` (returns Promise)

6. **Route Configuration**
   - Old: Plugin structure different
   - New: Routes defined in plugin with `plugin.route()`

---

## 📋 Implementation Plan

### Phase 7.1: Update package.json Files ✅
1. Update apps/package.json
2. Update auth/package.json
3. Update rendezvous/package.json
4. Update router/package.json

### Phase 7.2: Fix Apps Server Code
1. Update Hapi initialization
2. Fix plugin registration
3. Fix server start
4. Test server starts

### Phase 7.3: Fix Auth Server Code
1. Update Hapi initialization
2. Fix MongoDB connection (callbacks → Promises)
3. Remove Bluebird, use native Promises
4. Fix plugin registration
5. Replace `request` with `@hapi/wreck`
6. Test server starts

### Phase 7.4: Fix Rendezvous Server Code
1. Update Hapi initialization
2. Fix MongoDB connection (callbacks → Promises)
3. Remove Bluebird, use native Promises
4. Fix plugin registration
5. Test server starts

### Phase 7.5: Fix Router Server Code
1. Update Hapi initialization
2. Fix plugin registration
3. Test server starts

### Phase 7.6: Integration Testing
1. Start all servers
2. Test student/teacher apps connect
3. Test WebRTC with modernized montage-webrtc
4. Verify zero deprecation warnings

---

## 🎯 Success Criteria

- [ ] All servers run on Node.js v20+
- [ ] No deprecated dependencies
- [ ] All Hapi plugins updated to @hapi/* scoped packages
- [ ] MongoDB driver uses Promises (not callbacks)
- [ ] Bluebird removed, native Promises used
- [ ] Student/teacher apps connect successfully
- [ ] WebRTC signaling works
- [ ] Zero npm deprecation warnings

---

**Generated**: December 9, 2025
**Status**: Ready to begin modernization
