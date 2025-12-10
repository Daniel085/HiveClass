# Montage Framework Technical Debt

**Status**: 🔴 Critical Technical Debt
**Severity**: High
**Effort**: 6-12 months
**Priority**: Low (functional but outdated)
**Last Updated**: December 9, 2025

---

## Executive Summary

HiveClass is built on **Montage.js**, a JavaScript framework created by Motorola in 2012 and abandoned around 2015. While the WebRTC implementation has been fully modernized (Phase 5 complete), the underlying UI framework represents significant technical debt that will need to be addressed in the future.

**Key Finding**: The Montage framework itself does NOT use deprecated WebRTC APIs. The WebRTC modernization (Phases 2 & 5) successfully eliminated all WebRTC deprecation warnings. However, the framework uses outdated JavaScript patterns and has compatibility issues with modern tooling.

---

## What is Montage.js?

Montage.js was a Model-View-Controller (MVC) framework similar to modern React/Vue/Angular, created in 2012 by Motorola Mobility. It featured:

- Component-based architecture
- Data binding with FRB (Functional Reactive Bindings)
- Declarative HTML templates
- Promise-based asynchronous loading
- Built-in draw cycle for performance

### Timeline:
- **2012**: Created by Motorola Mobility
- **2012-2015**: Active development (last major release)
- **2015-present**: Effectively abandoned (minimal maintenance)
- **2025**: Still used by HiveClass (10+ years old)

### GitHub Stats:
- **Repository**: https://github.com/montagejs/montage
- **Last significant commit**: ~2015
- **Stars**: ~3.1k (mostly historical interest)
- **Current status**: Maintenance mode only

---

## Current HiveClass Usage

### Applications Built with Montage:

1. **Login App** (`/hiveclass-master/login/`)
   - Authentication UI
   - Google OAuth integration
   - Session management

2. **Student App** (`/hiveclass-master/student/`)
   - ~875 lines in classroom-service.js
   - UI components (.reel directories)
   - WebRTC client integration

3. **Teacher App** (`/hiveclass-master/teacher/`)
   - ~940 lines in classroom-service.js
   - Complex multi-student management UI
   - WebRTC server integration

### Montage-Specific Code Patterns:

```javascript
// Montage component structure
exports.MyComponent = Component.specialize({
    didCreate: {
        value: function() {
            // Component initialization
        }
    },

    templateDidLoad: {
        value: function() {
            // After template loads
        }
    }
});
```

### File Structure:
- `.reel/` directories for components (Montage convention)
- `main.reel/main.html` - Declarative templates
- `package.json` with Montage dependencies

---

## Technical Debt Issues

### 1. Compatibility Problems

**Node Modules Structure**:
- Montage expects nested `node_modules` (npm v2 style)
- Modern npm uses flat hoisting
- **Workaround**: Manual symlink creation required
  ```bash
  cd node_modules/montage && mkdir -p node_modules
  ln -s ../../bluebird node_modules/bluebird
  ln -s ../packages/mr node_modules/mr
  ```

**Impact**: Every `npm install` requires manual symlink recreation

### 2. Outdated Dependencies

Montage's dependency tree includes:
- **Bluebird** (Promise library) - Deprecated, native Promises preferred
- **Q** (Promise library) - Multiple versions (0.9.7, 1.0.0, 1.5.1)
- **Mr** (Module loader) - Custom loader, outdated

```
npm warn deprecated q@1.5.1: You or someone you depend on is using Q,
the JavaScript Promise library that gave JavaScript developers strong
feelings about promises. They can almost certainly migrate to the
native JavaScript promise now.
```

### 3. Build Tooling Incompatibility

Modern build tools don't support Montage:
- ❌ Webpack (requires custom loaders)
- ❌ Vite (not supported)
- ❌ Rollup (complex configuration needed)
- ✅ Native loading only (no bundling)

### 4. Development Experience

**Issues**:
- No modern IDE support/plugins
- No TypeScript support
- Limited documentation (outdated)
- Small community (effectively zero)
- No security updates

### 5. Performance

Montage uses older JavaScript patterns:
- Pre-ES6 modules
- Callback-based APIs (pre-async/await)
- Custom draw cycle (not aligned with modern browser optimizations)
- No tree-shaking support

---

## Why This Wasn't Part of WebRTC Modernization

### Scope Separation:

**Phase 5 (Completed)**: Modernize WebRTC APIs
- ✅ Remove deprecated `webkitRTCPeerConnection`
- ✅ Convert callbacks to async/await
- ✅ Migrate to track-based APIs
- ✅ Zero WebRTC deprecation warnings
- **Effort**: 3 weeks

**Framework Replacement (Future Phase 10+)**: Replace Montage
- Rewrite all UI components
- Migrate all business logic
- Recreate all templates
- Re-implement data binding
- **Effort**: 6-12 months

### Decision Rationale:

The WebRTC modernization goal was to **eliminate browser deprecation warnings** and ensure the application continues to work in modern browsers. This was achieved by modernizing the `montage-webrtc` library without touching the Montage framework itself.

**Key Insight**: Montage framework doesn't use deprecated WebRTC APIs. The deprecated APIs were in `montage-webrtc` (a separate library), which we successfully modernized.

---

## Impact Assessment

### Current Risks:

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Security vulnerabilities in old deps | High | Medium | Regular `npm audit` |
| Browser compatibility breaks | Medium | Low | Montage uses stable APIs |
| Developer onboarding difficulty | High | High | Documentation + training |
| Cannot use modern tooling | Medium | High | Accept limitation |
| Maintenance burden | High | High | Minimal changes only |

### What Still Works:

✅ **Functional**: Application runs correctly
✅ **WebRTC**: Fully modernized, zero deprecation warnings
✅ **Browsers**: Chrome, Edge, Safari support
✅ **Node.js**: Compatible with v20+
✅ **Security**: No known critical vulnerabilities in Montage itself

### What Doesn't Work:

❌ **Modern Build Tools**: Cannot use Webpack/Vite
❌ **npm Install**: Requires manual symlink creation
❌ **TypeScript**: No support
❌ **Hot Module Replacement**: Not supported
❌ **Tree Shaking**: Cannot optimize bundle size

---

## Modernization Options

### Option 1: Full Framework Replacement (Recommended Long-Term)

**Replace Montage with Modern Framework**

**Candidates**:
1. **React** (Most popular, huge ecosystem)
2. **Vue 3** (Progressive, easier migration)
3. **Svelte** (Minimal runtime, great performance)

**Effort Breakdown**:
- **Planning**: 2-4 weeks
  - Architectural decisions
  - Technology selection
  - Migration strategy

- **Infrastructure**: 2-3 weeks
  - Build tooling setup (Vite/Webpack)
  - Component library selection
  - State management (Redux/Zustand/Pinia)
  - Testing infrastructure

- **Core Components**: 8-12 weeks
  - Login/authentication UI
  - Teacher dashboard
  - Student interface
  - Classroom management

- **WebRTC Integration**: 4-6 weeks
  - Integrate modernized WebRTC code
  - Test multi-peer connections
  - Screen sharing UI

- **Testing & QA**: 4-6 weeks
  - Unit tests
  - Integration tests
  - E2E tests
  - Cross-browser testing

- **Deployment & Rollout**: 2-4 weeks
  - Staged rollout
  - User acceptance testing
  - Documentation updates

**Total**: 22-35 weeks (5.5-9 months)

**Advantages**:
- ✅ Modern developer experience
- ✅ Active community and ecosystem
- ✅ TypeScript support
- ✅ Modern build tooling
- ✅ Better performance
- ✅ Easier to hire developers

**Disadvantages**:
- ❌ High effort (6-9 months)
- ❌ High risk (complete rewrite)
- ❌ Requires maintaining old and new codebases in parallel
- ❌ Expensive

---

### Option 2: Minimal Montage Modernization (Medium-Term)

**Keep Montage but fix major issues**

**Tasks**:
1. Create automated symlink script for `npm install`
2. Update Montage dependencies where possible
3. Remove deprecated dependencies (Q, old Bluebird)
4. Add TypeScript definitions manually
5. Document Montage patterns for developers

**Effort**: 4-6 weeks

**Advantages**:
- ✅ Lower risk (no major changes)
- ✅ Faster (1-1.5 months)
- ✅ Cheaper
- ✅ Application remains functional

**Disadvantages**:
- ❌ Still using outdated framework
- ❌ Limited improvements
- ❌ Technical debt persists

---

### Option 3: Hybrid Approach (Recommended Short-Term)

**Incremental migration - new features in modern framework, keep existing Montage**

**Strategy**:
1. **Phase 1**: Set up modern framework alongside Montage
2. **Phase 2**: Build new features in modern framework
3. **Phase 3**: Gradually migrate existing pages one-by-one
4. **Phase 4**: Remove Montage when migration complete

**Example Architecture**:
```
/hiveclass-modern/
  ├── src/
  │   ├── react/          # New React components
  │   └── legacy/         # Existing Montage code
  ├── webpack.config.js   # Modern build
  └── package.json
```

**Effort**: 8-12 months (incremental)

**Advantages**:
- ✅ Lower risk (gradual migration)
- ✅ Can deliver value incrementally
- ✅ Old app continues working during migration
- ✅ Learn and adjust as you go

**Disadvantages**:
- ❌ Longer timeline
- ❌ Need to maintain two frameworks temporarily
- ❌ More complex architecture during transition

---

## Immediate Action Items

### Quick Wins (1-2 weeks):

1. **Document the symlink workaround**
   - Create `scripts/fix-montage-deps.sh`
   - Run after every `npm install`

2. **Add npm scripts** to `package.json`:
   ```json
   {
     "scripts": {
       "postinstall": "bash scripts/fix-montage-deps.sh"
     }
   }
   ```

3. **Update README.md**
   - Document Montage framework usage
   - Explain symlink requirement
   - Add troubleshooting section

4. **Create developer onboarding guide**
   - Montage-specific patterns
   - Component structure (.reel)
   - Data binding with FRB

---

## Proposed Phase 10: Framework Modernization

**Add to MODERNIZATION_PLAN_2025.md**

### Phase 10: Framework Replacement
- **Timeline**: 6-9 months
- **Effort**: High
- **Priority**: Low (functional but needed eventually)
- **Dependencies**: All previous phases complete

**Approach**: Hybrid incremental migration

**Deliverables**:
1. Modern framework selected (React/Vue/Svelte)
2. Build tooling configured (Vite/Webpack)
3. Component library integrated
4. Core pages migrated (login, teacher, student)
5. WebRTC integration tested
6. Montage completely removed
7. All tests passing
8. Performance benchmarks met

**Success Criteria**:
- Zero Montage dependencies
- Modern build tooling working
- All features functional
- Performance improved or maintained
- Developer experience significantly improved

---

## Recommendations

### Short-Term (Next 3 months):
1. ✅ **Accept current state** - Montage works, focus on other priorities
2. ✅ **Create symlink automation** - Fix npm install friction
3. ✅ **Document framework quirks** - Help future developers

### Medium-Term (6-12 months):
1. 🔶 **Evaluate replacement options** - Research React/Vue/Svelte
2. 🔶 **Plan migration strategy** - Hybrid approach recommended
3. 🔶 **Budget for rewrite** - Allocate resources

### Long-Term (12-24 months):
1. 🔴 **Begin incremental migration** - Start with new features
2. 🔴 **Migrate existing pages** - One component at a time
3. 🔴 **Remove Montage** - Complete the transition

---

## Conclusion

The Montage framework represents significant technical debt but is **not blocking** the WebRTC modernization goals. The WebRTC APIs have been successfully modernized (Phase 5 complete, 47/47 tests passing), eliminating all deprecation warnings.

**Current Status**: ✅ Functional but outdated
**Risk Level**: 🟡 Medium (manageable)
**Action Required**: 📋 Document and plan, no immediate action needed

The framework replacement should be planned as a **separate future initiative** (Phase 10+) with dedicated resources and timeline. For now, the application works correctly with modernized WebRTC, which was the primary goal.

---

## References

- Montage GitHub: https://github.com/montagejs/montage
- Montage Docs (archived): http://montagejs.org/
- WebRTC Modernization Plan: `/MODERNIZATION_PLAN_2025.md`
- Phase 5 Completion: `/PHASE5_MONTAGE_WEBRTC_MODERNIZATION.md`

---

**Document Maintained By**: WebRTC Modernization Team
**Next Review**: Q2 2026
