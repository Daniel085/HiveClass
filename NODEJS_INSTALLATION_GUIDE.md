# Node.js Installation Guide for HiveClass Development

## System Information
- **OS**: macOS (Darwin 24.6.0)
- **Required**: Node.js v20 LTS
- **Current Status**: Node.js not installed

---

## Installation Options

### Option 1: Official Node.js Installer (Recommended for Beginners)

**Pros**: Simple, official, includes npm
**Cons**: Manual updates needed

**Steps**:
1. Visit https://nodejs.org/
2. Download the **LTS version** (v20.x.x) - look for the green "LTS Recommended For Most Users" button
3. Open the downloaded `.pkg` file
4. Follow the installation wizard (accept defaults)
5. Verify installation (see "Verify Installation" section below)

**Download Link**: https://nodejs.org/en/download/

---

### Option 2: Homebrew + Node.js (Recommended for Developers)

**Pros**: Easy updates, package management, industry standard on macOS
**Cons**: Requires installing Homebrew first

#### Step 1: Install Homebrew

Open Terminal and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**What this does**:
- Installs Homebrew package manager
- Takes ~5 minutes
- May prompt for your macOS password

**After installation**, follow the "Next steps" instructions Homebrew displays, typically:
```bash
# Add Homebrew to your PATH (exact command will be shown by installer)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### Step 2: Install Node.js via Homebrew

```bash
# Install Node.js LTS
brew install node@20

# Link it (make it available in PATH)
brew link node@20
```

**Alternative - Install latest Node.js**:
```bash
brew install node  # Installs latest stable (currently v22.x)
```

---

### Option 3: NVM (Node Version Manager) - Best for Multiple Node Versions

**Pros**: Switch between Node versions easily, best for advanced development
**Cons**: Slightly more complex setup

#### Install NVM:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

#### Add to your shell profile:
```bash
# For zsh (default on modern macOS)
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bash_profile
source ~/.bash_profile
```

#### Install Node.js 20 LTS:
```bash
nvm install 20
nvm use 20
nvm alias default 20
```

---

## Verify Installation

After installing via any method, open a **new terminal window** and run:

```bash
# Check Node.js version
node --version
# Expected output: v20.x.x (or v22.x.x if you installed latest)

# Check npm version
npm --version
# Expected output: v10.x.x

# Check installation locations
which node
# Expected output: /usr/local/bin/node or /opt/homebrew/bin/node

which npm
# Expected output: /usr/local/bin/npm or /opt/homebrew/bin/npm
```

**Expected Results**:
- Node.js: v20.11.0 or higher (LTS)
- npm: v10.2.4 or higher
- Both commands should return paths, not "command not found"

---

## Troubleshooting

### Issue: "command not found: node" after installation

**Solutions**:
1. **Close and reopen Terminal** - PATH changes require new shell session
2. **Check PATH**:
   ```bash
   echo $PATH
   # Should include /usr/local/bin or /opt/homebrew/bin
   ```
3. **Manually add to PATH** (if needed):
   ```bash
   # For zsh
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc

   # For bash
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile
   source ~/.bash_profile
   ```

### Issue: "Permission denied" during npm install

**Solution**: Don't use sudo with npm. If you installed Node.js with sudo, reinstall using one of the methods above.

### Issue: Homebrew installation fails

**Solution**: Check System Requirements:
- macOS 11 (Big Sur) or newer required for Apple Silicon
- macOS 10.15 (Catalina) or newer for Intel Macs
- If older, use Option 1 (Official Installer) instead

### Issue: Multiple Node versions installed

**Solution**: Use NVM to manage versions:
```bash
nvm list  # See installed versions
nvm use 20  # Switch to Node 20
nvm alias default 20  # Set as default
```

---

## Post-Installation: Install HiveClass Test Dependencies

Once Node.js is verified working:

### Step 1: Install Test Utilities Dependencies
```bash
cd /Users/danielororke/GitHub/HiveClass/hiveclass-master/test-utils
npm install
```

**Expected output**:
```
added 42 packages, and audited 43 packages in 3s
found 0 vulnerabilities
```

### Step 2: Run Your First Test
```bash
# Run RTCClient tests
cd /Users/danielororke/GitHub/HiveClass/hiveclass-master
npx mocha student/webrtc/test/client.spec.js --require test-utils/webrtc-mock.js

# Run RTCServer tests
npx mocha teacher/webrtc/test/server.spec.js --require test-utils/webrtc-mock.js
```

**Expected output**: Test results showing passes/failures

### Step 3: Install Project Dependencies (All Modules)

The HiveClass project has multiple modules. You'll need to install dependencies for:

```bash
# Server-side dependencies
cd /Users/danielororke/GitHub/HiveClass/hiveclass-server-master/rendezvous
npm install

cd ../auth
npm install

cd ../apps
npm install

cd ../storage
npm install

cd ../logging
npm install

cd ../jira
npm install

# Client-side dependencies
cd /Users/danielororke/GitHub/HiveClass/hiveclass-master/login
npm install

cd ../student
npm install

cd ../teacher
npm install
```

**Note**: Some installations may show warnings about outdated dependencies - this is expected since we're using packages from 2015-2018. We'll upgrade these in Phase 7.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `node --version` | Check Node.js version |
| `npm --version` | Check npm version |
| `npm install` | Install dependencies from package.json |
| `npm test` | Run tests (if configured in package.json) |
| `npx mocha <file>` | Run Mocha tests directly |
| `which node` | Show Node.js installation path |

---

## Recommended Installation Method for HiveClass Development

**For this project, I recommend Option 2 (Homebrew + Node.js)**:

**Why?**
1. ✅ Easy to update: `brew upgrade node@20`
2. ✅ Industry standard on macOS
3. ✅ Integrates well with other development tools
4. ✅ No manual PATH configuration needed
5. ✅ Can install MongoDB easily later: `brew install mongodb-community`

**Installation Steps Summary**:
```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Follow post-install instructions to add to PATH

# 3. Install Node.js 20 LTS
brew install node@20

# 4. Verify
node --version
npm --version

# 5. Install HiveClass test dependencies
cd /Users/danielororke/GitHub/HiveClass/hiveclass-master/test-utils
npm install

# 6. Run tests!
cd ..
npx mocha student/webrtc/test/client.spec.js --require test-utils/webrtc-mock.js
```

---

## What to Do After Installation

1. ✅ **Verify Node.js works** (see "Verify Installation" section)
2. ✅ **Install test dependencies** (see "Post-Installation" section)
3. ✅ **Run baseline tests** to verify our test infrastructure
4. 📝 **Report results** - Let me know if tests pass or if there are any failures
5. 🔄 **Continue Phase 1** - Complete remaining signaling tests and E2E tests
6. 🚀 **Move to Phase 2** - ICE Configuration (Week 3)

---

**Questions? Issues?** Let me know and I'll help troubleshoot!
