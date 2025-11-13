# HiveClass Documentation

## Table of Contents
- [Overview](#overview)
- [What is HiveClass?](#what-is-hiveclass)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deployment](#deployment)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

HiveClass (also known as HiveSchool) is a Chrome-based educational classroom management application designed to facilitate connected learning in digital classrooms. It provides teachers with tools to manage classrooms, view student screens in real-time, present content, assign resources, and keep students on task.

### Project Origins
HiveClass was developed by Aerohive as an open-source contribution to education. The source code is available free of charge to help schools leverage modern classroom technology.

## What is HiveClass?

HiveClass is a distributed web application consisting of:

1. **Chrome Extensions** - For both teachers and students, providing desktop capture and browser control
2. **Web Applications** - Browser-based interfaces built with MontageJS framework
3. **Backend Services** - Microservices architecture for authentication, real-time communication, and data storage

### Supported Platforms

**Recommended:**
- Chromebooks (full feature set including remote control)
- Teachers: MacBooks, Windows computers, or Chromebooks

**Not Supported:**
- Mobile devices (iPads, Android tablets)

### Prerequisites

**School Requirements:**
- Google Apps Domain (for authentication)
- Full Chrome browser on all devices
- Commercial-grade Wi-Fi network (vendor-independent)

## Key Features

### For Teachers

#### Classroom Management
- Create and name classrooms with unique 4-digit join codes
- Real-time student presence dashboard
- Lock/unlock classrooms to control entry
- Close classrooms and disconnect all students

#### Screen Viewing & Monitoring
- Live view of all student screens simultaneously
- Real-time screen updates with configurable compression
- WebRTC peer-to-peer streaming for efficient bandwidth usage
- Visual dashboard showing student activity

#### Content Presentation
- Share teacher desktop/screen with entire class ("Follow Me" mode)
- Enforces fullscreen viewing on student devices
- URL-locking to keep students focused on specific resources
- Student presentation mode - assign students to present to class

#### Resource Management
- Assign teaching resources (URLs) to students
- Organize and categorize learning materials
- Students access assigned resources through dashboard
- Resources stored and synced via cloud storage

#### Student Control (Chromebook-specific)
- Close specific browser tabs remotely
- Close all tabs except allowed URLs
- Lock students to single resource/URL
- Prevent tab/window switching
- Send attention alerts to students

#### Analytics & Reporting
- Track student engagement metrics
- View classroom activity reports
- Submit feedback via integrated Jira system

### For Students

#### Classroom Access
- Join classrooms using 4-digit codes
- Real-time roster updates
- Profile with photo from Google account

#### Engagement Features
- Share screen with teacher and classmates
- Present work to class when assigned
- View teacher presentations in fullscreen
- Access assigned learning resources

#### Responsive Controls
- Receive and acknowledge attention alerts
- Follow teacher screen in "Follow Me" mode
- Browser automatically manages tab focus per teacher commands
- Desktop capture with user consent

## Architecture

### System Design

HiveClass uses a microservices architecture with clear separation between client and server components.

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Browser                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Teacher App     │  │ Student App     │  │ Login App   │ │
│  │ (MontageJS)     │  │ (MontageJS)     │  │ (MontageJS) │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                    │        │
│  ┌────────▼────────────────────▼────────────────────▼──────┐ │
│  │         Chrome Extension (Teacher/Student)              │ │
│  │  - Desktop Capture  - Tab Control  - Focus Management  │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/WebSocket
                            ▼
              ┌──────────────────────────┐
              │  Router (Port 8088)      │
              │  Reverse Proxy Gateway   │
              └─────────┬────────────────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
   │  Auth   │    │   Apps    │   │  Storage  │
   │  (8081) │    │  (8082)   │   │  (8085)   │
   │ OAuth2  │    │  Static   │   │  MongoDB  │
   └─────────┘    │  Files    │   │  Files    │
                  └───────────┘   └───────────┘
                        │
              ┌─────────▼──────────┐
              │  Rendezvous (9090) │
              │  WebSocket Server  │
              │  Room Management   │
              │  WebRTC Signaling  │
              └────────────────────┘
                        │
        ┌───────────────┼────────────────┐
   ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
   │ Logging │    │   Jira    │   │  MongoDB  │
   │ (8084)  │    │  (8083)   │   │  (27017)  │
   └─────────┘    └───────────┘   └───────────┘
```

### Components

#### Client-Side

**1. Login App** (`/hiveclass-master/login/`)
- Google OAuth2 authentication entry point
- Redirects to auth service
- Validates domain membership

**2. Teacher App** (`/hiveclass-master/teacher/`)
- Dashboard with student presence and screens
- Resource assignment interface
- Classroom controls (lock, close)
- Reporting and analytics
- State machine: loading → init → screens → dashboard → resources

**3. Student App** (`/hiveclass-master/student/`)
- Classroom join interface
- Follow-me presentation viewer
- Resource dashboard
- Attention alert handling
- State machine: loading → enterClass → joinClass → dashboard

**4. Chrome Extensions** (`/hiveclass-master/extensions/`)
- **Teacher Extension**: Desktop capture, bookmarks, notifications
- **Student Extension**: Desktop capture, tab control, window management
- **Common Services**: Screen capture, tab management, focus control, follow-me mode

#### Server-Side

**1. Auth Service** (`/hiveclass-server-master/auth/` - Port 8081)
- Google OAuth2 authentication with Bell plugin
- Domain whitelist authorization
- Session management with encrypted cookies
- Profile endpoint for user data
- MongoDB storage for sessions

**2. Rendezvous Service** (`/hiveclass-server-master/rendezvous/` - Port 9090/19090)
- WebSocket server for real-time communication
- Room creation and management
- 4-digit join code generation
- WebRTC signaling (offer/answer/candidates)
- Presence management

**3. Apps Service** (`/hiveclass-server-master/apps/` - Port 8082)
- Static file server for teacher, student, login apps
- Cookie-based authentication
- Serves compiled MontageJS applications
- Symlinks to client app directories

**4. Storage Service** (`/hiveclass-server-master/storage/` - Port 8085)
- User data storage (resources, assignments)
- MongoDB per-user collections
- Google Drive integration
- JSON file storage with upsert

**5. Router Service** (`/hiveclass-server-master/router/` - Port 8088)
- Reverse proxy gateway
- Routes to backend services
- Public-facing entry point
- HTTP proxy with X-Public-Host header

**6. Logging Service** (`/hiveclass-server-master/logging/` - Port 8084)
- Event logging and analytics
- File-based storage
- User-agent tracking

**7. Jira Service** (`/hiveclass-server-master/jira/` - Port 8083)
- Feedback submission proxy
- Proxies to Atlassian Jira
- Basic authentication

### Communication Protocols

#### WebSocket Protocol
```
Endpoint: ws://[host]:9090/ws

Message Format:
{
  "id": "uuid",
  "source": "client-id",
  "type": "presence|webrtc",
  "cmd": "createRoom|offer|answer|...",
  "data": {...}
}

Response Format:
{
  "id": "uuid",
  "source": "server-id",
  "type": "message-type",
  "success": true/false,
  "data": {...},
  "error": "error message"
}
```

#### HTTP Endpoints

**Authentication:**
- `GET/POST /auth/google` - OAuth callback
- `GET /auth/check` - Validate session
- `GET /auth/invalidate` - Logout
- `GET /auth/me` - User profile

**Storage:**
- `GET /storage/{filename}` - Retrieve file
- `POST /storage/{filename}` - Save file

**Logging:**
- `POST /logging` - Record event
- `GET /logging` - Retrieve events

## Technology Stack

### Frontend
- **MontageJS 3+** - JavaScript framework
- **Montage-WebRTC** - WebRTC implementation
- **Digit** - UI components
- **Collections.js** - Data structures
- **Chrome APIs** - tabs, windows, desktopCapture, notifications
- **IndexedDB** - Client-side persistence
- **Canvas API** - Screen capture compression

### Backend
- **Node.js** - Runtime (v0.10+ recommended v4+)
- **Hapi.js v13** - HTTP server framework
- **Bell** - OAuth2 plugin
- **WebSocket.js** - WebSocket server
- **MongoDB v2.1+** - NoSQL database
- **Bluebird** - Promise library

### Communication
- **WebSocket** - Real-time presence and signaling
- **HTTP/HTTPS** - APIs and file serving
- **WebRTC** - Peer-to-peer video/screen streaming

### DevOps
- **Docker** - Containerization
- **Ansible** - Infrastructure automation

## Installation

### System Requirements

**Development Environment:**
- Node.js v4+ (original codebase uses v0.10+)
- npm package manager
- MongoDB v2.1+
- Git
- Chrome browser

**External Services:**
- Google Apps Domain account
- Google OAuth2 credentials (Client ID, Secret)
- (Optional) Jira account for feedback

### Step 1: Clone Repositories

```bash
# Clone main repository
git clone https://github.com/Daniel085/HiveClass.git
cd HiveClass

# The repository contains both client and server code
# Client: hiveclass-master/
# Server: hiveclass-server-master/
```

### Step 2: Install Client Dependencies

```bash
# Install login app
cd hiveclass-master/login
npm install

# Install student app
cd ../student
npm install

# Install teacher app
cd ../teacher
npm install

cd ../..
```

### Step 3: Set Up Server Services

```bash
# Create symlinks for apps service
cd hiveclass-server-master/apps
ln -s ../../hiveclass-master/login login
ln -s ../../hiveclass-master/student student
ln -s ../../hiveclass-master/teacher teacher
cd ..

# Install auth service
cd auth
npm install

# Install rendezvous service
cd ../rendezvous
npm install

# Install router service
cd ../router
npm install

# Install apps service
cd ../apps
npm install

# Install storage service
cd ../storage
npm install

# Install logging service
cd ../logging
npm install

# Install jira service (optional)
cd ../jira
npm install

cd ../..
```

### Step 4: Set Up MongoDB

```bash
# Start MongoDB (if not running)
mongod --dbpath /path/to/data

# MongoDB will create these databases automatically:
# - mongodb://localhost:27017/auth
# - mongodb://localhost:27017/storage
```

### Step 5: Configure Google OAuth2

1. Go to [Google Developer Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth2 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8080/auth/google`
5. Note your Client ID and Client Secret

### Step 6: Update Configuration Files

**Server Configuration:**

Edit `/hiveclass-server-master/auth/config.js`:
```javascript
module.exports = {
  server: {
    host: '0.0.0.0',
    port: 8081,
    contextRoot: '/auth'
  },
  providers: {
    google: {
      client_id: 'YOUR_GOOGLE_CLIENT_ID',
      client_secret: 'YOUR_GOOGLE_CLIENT_SECRET'
    }
  },
  cookie: {
    is_secure: false,  // Set true for HTTPS in production
    password: 'CHANGE_THIS_TO_RANDOM_32_CHAR_STRING'
  },
  mongodbUrl: 'mongodb://localhost:27017/auth',
  bearerToken: 'your_secure_token_here',
  loginUrl: 'http://localhost:8080/apps/login/',
  oauthLocation: 'http://localhost:8080'
};
```

Edit `/hiveclass-server-master/storage/config.js`:
```javascript
module.exports = {
  mongodbUrl: 'mongodb://localhost:27017/storage'
};
```

**Client Configuration:**

Edit `/hiveclass-master/login/core/configuration.json`:
```json
{
  "provider": "google",
  "endpoint": "http://localhost:8080/auth"
}
```

Edit `/hiveclass-master/teacher/core/configuration.json`:
```json
{
  "profileEndpoint": "http://localhost:8080/auth/me",
  "checkEndpoint": "http://localhost:8080/auth/check",
  "invalidateEndpoint": "http://localhost:8080/auth/invalidate",
  "storageEndpoint": "http://localhost:8080/storage/",
  "presenceEndpointUrl": "ws://localhost:9090/ws",
  "studentUrl": "http://localhost:8080/apps/student/",
  "loggingEndpoint": "http://localhost:8080/logging"
}
```

Edit `/hiveclass-master/student/core/configuration.json`:
```json
{
  "profileEndpoint": "http://localhost:8080/auth/me",
  "checkEndpoint": "http://localhost:8080/auth/check",
  "invalidateEndpoint": "http://localhost:8080/auth/invalidate",
  "presenceEndpointUrl": "ws://localhost:9090/ws",
  "loggingEndpoint": "http://localhost:8080/logging"
}
```

**Extension Configuration:**

Edit `/hiveclass-master/extensions/teacher/js/configuration.js`:
```javascript
define({
  application: {
    url: 'http://localhost:8080/apps/teacher'
  }
});
```

Edit `/hiveclass-master/extensions/student/js/configuration.js`:
```javascript
define({
  application: {
    url: 'http://localhost:8080/apps/student'
  }
});
```

### Step 7: Start Services

Open 7 separate terminal windows/tabs and start each service:

```bash
# Terminal 1: Auth Service
cd hiveclass-server-master/auth
node app.js

# Terminal 2: Rendezvous Service
cd hiveclass-server-master/rendezvous
node app.js

# Terminal 3: Router Service
cd hiveclass-server-master/router
node app.js

# Terminal 4: Apps Service
cd hiveclass-server-master/apps
node app.js

# Terminal 5: Storage Service
cd hiveclass-server-master/storage
node app.js

# Terminal 6: Logging Service
cd hiveclass-server-master/logging
node app.js

# Terminal 7: Jira Service (optional)
cd hiveclass-server-master/jira
node app.js
```

### Step 8: Install Chrome Extensions

**For Development:**

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `/hiveclass-master/extensions/teacher/` for teacher extension
5. Repeat for `/hiveclass-master/extensions/student/` for student extension

**For Production:**

1. Go to `chrome://extensions/`
2. Click "Pack extension"
3. Select extension folder and pack it
4. Distribute .crx file via Chrome Web Store or Chromebook Management Console

### Step 9: Verify Installation

1. Open browser to `http://localhost:8080/apps/login/`
2. Click "Sign in with Google"
3. Authenticate with Google Apps Domain account
4. You should be redirected to teacher or student app

## Configuration

### Port Configuration

| Service | Port | Protocol | Public |
|---------|------|----------|--------|
| Router | 8088 | HTTP | Yes |
| Auth | 8081 | HTTP | No |
| Apps | 8082 | HTTP | No |
| Jira | 8083 | HTTP | No |
| Logging | 8084 | HTTP | No |
| Storage | 8085 | HTTP | No |
| Rendezvous WS | 9090 | WebSocket | Yes |
| Rendezvous HTTP | 19090 | HTTP | No |
| MongoDB | 27017 | TCP | No |

### Security Configuration

**Production Settings:**

1. **Enable HTTPS:**
   - Set `cookie.is_secure: true` in auth/config.js
   - Configure SSL certificates in router service
   - Update all endpoint URLs to use https://

2. **Secure Cookies:**
   - Generate strong random password: `cookie.password`
   - Use 32+ character random string

3. **Bearer Token:**
   - Change default bearer token for whitelist API
   - Store securely in environment variables

4. **Firewall Rules:**
   - Only expose Router (8088) and Rendezvous (9090) to public
   - Block direct access to internal services
   - Restrict MongoDB to localhost

### Domain Whitelist

To authorize domains for login:

```bash
# Add domain to whitelist
curl -X POST http://localhost:8080/auth/whitelist/yourdomain.com \
  -H "Authorization: Bearer your_bearer_token"

# Check whitelist
curl http://localhost:8080/auth/whitelist/yourdomain.com \
  -H "Authorization: Bearer your_bearer_token"
```

Only users with @yourdomain.com email addresses will be able to authenticate.

### Environment Variables

Recommended environment variables for production:

```bash
export GOOGLE_CLIENT_ID="your_client_id"
export GOOGLE_CLIENT_SECRET="your_client_secret"
export COOKIE_PASSWORD="your_random_password"
export BEARER_TOKEN="your_bearer_token"
export MONGODB_URL="mongodb://localhost:27017"
export PUBLIC_HOST="https://yourschool.com"
```

## Usage

### For Teachers

#### 1. Login and Access Teacher App

1. Open Chrome browser
2. Install Teacher Chrome extension
3. Navigate to `http://localhost:8080/apps/teacher/` (or your configured URL)
4. Sign in with Google Apps Domain account
5. You'll see the teacher dashboard

#### 2. Create a Classroom

1. Click "Create Classroom" or similar button
2. Enter classroom name (e.g., "Math Period 3")
3. System generates 4-digit join code
4. Share join code with students

#### 3. View Student Screens

1. Students appear on dashboard as they join
2. Click on student tile to view their screen
3. Screen updates in real-time
4. See all student screens simultaneously in grid view

#### 4. Present to Class (Follow Me)

1. Click "Present" or "Follow Me" button
2. Select which screen/window to share
3. Students automatically see your screen in fullscreen
4. Students cannot switch tabs during presentation
5. Click "Stop Presenting" to end

#### 5. Assign Resources

1. Navigate to Resources section
2. Click "Add Resource"
3. Enter URL of teaching resource (website, video, etc.)
4. Assign to individual students or entire class
5. Students see assigned resources in their dashboard

#### 6. Control Student Browsers

**Close Tabs:**
1. View student screen
2. Click on tabs you want to close
3. Tab closes on student device

**Lock to URL:**
1. Assign resource to student
2. Enable "Lock" mode
3. Student cannot open other tabs or switch windows

**Send Attention Alert:**
1. Select student(s)
2. Click "Get Attention" button
3. Student sees fullscreen alert message

#### 7. Lock/Unlock Classroom

- **Lock**: Prevents new students from joining
- **Unlock**: Allows students to join
- Useful for starting class on time

#### 8. Close Classroom

1. Click "Close Classroom"
2. All students disconnected
3. Classroom and join code become invalid

### For Students

#### 1. Login and Access Student App

1. Open Chrome browser
2. Install Student Chrome extension
3. Navigate to `http://localhost:8080/apps/student/` (or your configured URL)
4. Sign in with Google Apps Domain account

#### 2. Join Classroom

1. Enter 4-digit join code provided by teacher
2. Click "Join"
3. Grant permission for screen capture when prompted
4. You'll see classroom dashboard

#### 3. View Assigned Resources

1. Assigned resources appear in your dashboard
2. Click on resource to open
3. Complete assignments
4. Teacher can see your screen while working

#### 4. Watch Teacher Presentation

1. When teacher starts presenting, your screen automatically switches to fullscreen
2. Follow along with teacher's screen
3. Cannot switch tabs during presentation (Focus Mode)
4. Presentation ends when teacher stops sharing

#### 5. Present to Class

1. Teacher can assign you as presenter
2. Select screen/window to share
3. Entire class sees your screen
4. Great for showing your work

#### 6. Respond to Alerts

1. Teacher may send attention alerts
2. Alert appears fullscreen
3. Click "OK" or "Got it" to dismiss

### Chrome Extension Features

#### Teacher Extension

**Desktop Capture:**
- Capture entire desktop or specific windows
- High-quality screen streaming
- Configurable compression

**Bookmark Management:**
- Create resource bookmarks
- Share bookmarks with students

**Notifications:**
- Get notified when students join
- Alert when students need help

#### Student Extension

**Screen Sharing:**
- Share screen with teacher/class
- Desktop or window selection

**Tab Management:**
- Extension enforces tab closures
- Automatic tab management during Follow Me
- Focus lock prevents switching

**Attention Mode:**
- Fullscreen alerts from teacher
- Cannot dismiss until acknowledged

## Deployment

### Production Deployment

#### Option 1: Docker Deployment

```bash
# Build Docker image
cd hiveclass-master
docker build -t hiveclass:latest .

# Run container
docker run -d \
  -p 8088:8088 \
  -p 9090:9090 \
  -e GOOGLE_CLIENT_ID=your_id \
  -e GOOGLE_CLIENT_SECRET=your_secret \
  --name hiveclass \
  hiveclass:latest
```

#### Option 2: Ansible Deployment

Ansible playbooks are provided in `/hiveclass-server-master/deploy/`:

```bash
cd hiveclass-server-master/deploy

# Deploy to staging
./deploy_staging.sh

# Deploy to QA
./deploy_qa.sh

# Deploy to production
ansible-playbook -i environments/production front.yml
ansible-playbook -i environments/production back.yml
```

### Deployment Checklist

- [ ] Configure all service endpoints with public hostname
- [ ] Enable HTTPS (set `cookie.is_secure: true`)
- [ ] Generate strong random passwords for cookies
- [ ] Configure Google OAuth2 with production redirect URIs
- [ ] Set up MongoDB with authentication enabled
- [ ] Configure firewall rules (only expose Router and Rendezvous)
- [ ] Add authorized domains to whitelist
- [ ] Test authentication flow
- [ ] Test classroom creation and joining
- [ ] Test screen sharing and WebRTC connections
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for MongoDB
- [ ] Distribute Chrome extensions via Chrome Web Store or MDM

### Scaling Considerations

**Horizontal Scaling:**
- Deploy multiple instances of each service behind load balancer
- Use Redis for session storage (replace cookie-based sessions)
- Configure MongoDB replica set

**WebSocket Scaling:**
- Rendezvous service requires sticky sessions
- Use load balancer with WebSocket support (nginx, HAProxy)
- Consider using Redis pub/sub for multi-instance coordination

**Database Optimization:**
- Create indexes on frequently queried fields
- Monitor MongoDB performance
- Consider sharding for large deployments

## Development

### Project Structure

```
HiveClass/
├── hiveclass-master/              # Client applications
│   ├── login/                    # Login app
│   ├── teacher/                  # Teacher app
│   ├── student/                  # Student app
│   ├── extensions/               # Chrome extensions
│   │   ├── teacher/
│   │   ├── student/
│   │   └── common/
│   └── common/                   # Shared resources
├── hiveclass-server-master/       # Backend services
│   ├── auth/                     # Auth service
│   ├── rendezvous/               # WebSocket service
│   ├── apps/                     # Static file server
│   ├── storage/                  # Data storage
│   ├── router/                   # API gateway
│   ├── logging/                  # Analytics
│   ├── jira/                     # Feedback
│   └── deploy/                   # Deployment scripts
└── DOCUMENTATION.md
```

### Development Workflow

1. **Make Changes:**
   - Edit files in appropriate directories
   - Client changes: `/hiveclass-master/`
   - Server changes: `/hiveclass-server-master/`

2. **Test Locally:**
   - Restart affected services
   - Test in Chrome with extensions loaded
   - Check browser console for errors
   - Monitor server logs

3. **Build Extensions:**
   ```bash
   cd hiveclass-master/extensions
   # For teacher
   cd teacher
   # Reload extension in chrome://extensions/

   # For student
   cd ../student
   # Reload extension in chrome://extensions/
   ```

4. **Run Tests:**
   ```bash
   # E2E tests
   cd hiveclass-master/e2e
   npm test
   ```

### Debugging

**Client-Side:**
- Open Chrome DevTools (F12)
- Check Console for errors
- Network tab for API calls
- Application tab for cookies and IndexedDB

**Server-Side:**
- Check service logs in terminal
- Add console.log statements
- Use Node.js debugger: `node --inspect app.js`

**WebSocket:**
- Use browser DevTools Network tab → WS filter
- Check WebSocket frames
- Verify connection establishment

### Key Files to Know

**Client:**
- `teacher/core/classroom-service.js` - Main teacher logic
- `student/core/classroom-service.js` - Main student logic
- `extensions/common/js/services/screen.js` - Screen capture
- `extensions/common/js/services/tab.js` - Tab control

**Server:**
- `auth/app.js` - Authentication server
- `rendezvous/app.js` - WebSocket server
- `rendezvous/services/room.js` - Room management
- `storage/lib/dbStorage.js` - Data persistence

## Troubleshooting

### Authentication Issues

**Problem: Cannot login with Google**

Solutions:
- Verify Google OAuth2 credentials in `auth/config.js`
- Check redirect URI matches: `http://yourhost/auth/google`
- Ensure domain is in whitelist
- Check auth service logs for errors

**Problem: Session expired immediately**

Solutions:
- Verify `cookie.password` is set in config
- Check browser allows cookies
- Verify `checkEndpoint` is accessible

### Connection Issues

**Problem: WebSocket connection fails**

Solutions:
- Verify Rendezvous service is running on port 9090
- Check firewall allows WebSocket connections
- Verify `presenceEndpointUrl` in configuration.json
- Check browser console for WebSocket errors

**Problem: Cannot join classroom**

Solutions:
- Verify 4-digit code is correct
- Check classroom is not locked
- Verify Rendezvous service is running
- Check WebSocket connection established

### Screen Sharing Issues

**Problem: Cannot see student screens**

Solutions:
- Verify students granted screen capture permission
- Check WebRTC connections in browser DevTools
- Verify Chrome extension is installed and enabled
- Check for firewall blocking WebRTC ports

**Problem: Poor screen quality**

Solutions:
- Adjust compression settings in `screen.js`
- Check network bandwidth
- Reduce number of simultaneous streams

### Extension Issues

**Problem: Extension not loading**

Solutions:
- Check extension is enabled in `chrome://extensions/`
- Verify manifest.json is valid
- Check for JavaScript errors in extension background page
- Reload extension

**Problem: Tab control not working**

Solutions:
- Verify student is using Chromebook (required for full control)
- Check extension has required permissions
- Verify extension is active

### Service Issues

**Problem: Service won't start**

Solutions:
- Check port is not already in use: `lsof -i :PORT`
- Verify MongoDB is running
- Check config.js for errors
- Review service logs for stack traces

**Problem: MongoDB connection failed**

Solutions:
- Verify MongoDB is running: `ps aux | grep mongo`
- Check MongoDB URL in config files
- Verify MongoDB authentication if enabled
- Check MongoDB logs

### Performance Issues

**Problem: Slow screen updates**

Solutions:
- Reduce screen capture resolution
- Increase compression level
- Check network latency
- Limit number of simultaneous viewers

**Problem: High CPU usage**

Solutions:
- Reduce screen capture frame rate
- Optimize WebRTC settings
- Check for JavaScript loops or memory leaks
- Monitor with Chrome Task Manager

## Additional Resources

### Documentation
- [MontageJS Documentation](http://montagejs.org/docs/)
- [Hapi.js Documentation](https://hapi.dev/)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)

### Support
- GitHub Issues: Report bugs and feature requests
- Original Project: https://github.com/montagestudio/hiveclass
- This Fork: https://github.com/Daniel085/HiveClass

### Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### License

HiveClass is open source and free to use for educational purposes. See LICENSE file for details.

---

**Version:** 1.5.2
**Last Updated:** 2025
**Maintained by:** Daniel O'Rorke (@Daniel085)
