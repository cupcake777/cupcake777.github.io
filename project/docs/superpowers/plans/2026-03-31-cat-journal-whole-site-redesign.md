# Cat Journal Whole-Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Cat Journal app into a coherent mint-themed product with a public landing layer, registration-first auth flow, and a logged-in workspace centered on daily logging.

**Architecture:** Extract site structure and design tokens into small configuration modules first, then rebuild the React shells around those modules. Keep Supabase auth and existing data behaviors, but replace the current monolithic app shell with clearer public, auth, and workspace layers.

**Tech Stack:** Vite, React 19, Supabase auth, node:test, ESLint

---

### Task 1: Lock site structure and mint theme in tests

**Files:**
- Create: `tests/site-config.test.mjs`
- Create: `src/config/site.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test"
import assert from "node:assert/strict"

import {
  AUTH_FLOW,
  PRIMARY_TABS,
  PUBLIC_NAV_ITEMS,
  SITE_THEME,
  TOOL_MENU_ITEMS,
} from "../src/config/site.js"

test("primary tabs reflect the approved workspace IA", () => {
  assert.deepEqual(
    PRIMARY_TABS.map((item) => item.label),
    ["今日", "时间线", "洞察", "AI", "我的"],
  )
})

test("auth flow is registration-first with returning-device auto entry", () => {
  assert.equal(AUTH_FLOW.defaultMode, "register")
  assert.equal(AUTH_FLOW.autoLoginStrategy, "persistent-session")
})

test("site theme inherits the approved mint palette", () => {
  assert.equal(SITE_THEME.accent, "#2c8c72")
  assert.equal(SITE_THEME.headerTint, "rgba(44, 140, 114, 0.08)")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site-config.test.mjs`
Expected: FAIL because `../src/config/site.js` does not exist yet

- [ ] **Step 3: Write minimal implementation**

Create `src/config/site.js` exporting the approved navigation, tool menu, auth-flow, and theme tokens.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/site-config.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/site-config.test.mjs src/config/site.js docs/superpowers/plans/2026-03-31-cat-journal-whole-site-redesign.md
git commit -m "test: lock cat journal site configuration"
```

### Task 2: Establish global design tokens and layout helpers

**Files:**
- Modify: `src/index.css`
- Create: `src/components/ui/tokens.js`
- Create: `src/components/ui/primitives.jsx`
- Test: `tests/site-config.test.mjs`

- [ ] **Step 1: Write the failing test**

Extend the config test to assert the theme exports a workspace header tint and neutral border token consumed by shared UI helpers.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site-config.test.mjs`
Expected: FAIL because the new token shape is missing

- [ ] **Step 3: Write minimal implementation**

Move shared colors, typography, spacing, and common card/button/input primitives into reusable helpers consistent with the mint theme.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/site-config.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/ui/tokens.js src/components/ui/primitives.jsx tests/site-config.test.mjs
git commit -m "refactor: add shared mint design tokens"
```

### Task 3: Rebuild the app shell into public, auth, and workspace layers

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/Public/PublicHome.jsx`
- Create: `src/components/Auth/AuthShell.jsx`
- Create: `src/components/Workspace/WorkspaceShell.jsx`
- Modify: `src/components/Auth/index.js`
- Modify: `src/components/App/index.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/site-config.test.mjs` to assert public navigation labels and tool menu labels align with the approved IA.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site-config.test.mjs`
Expected: FAIL because the exported nav collections are incomplete

- [ ] **Step 3: Write minimal implementation**

Route unauthenticated users into the public page and auth shell, and authenticated users into a dedicated workspace shell.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/site-config.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/Public/PublicHome.jsx src/components/Auth/AuthShell.jsx src/components/Workspace/WorkspaceShell.jsx src/components/Auth/index.js src/components/App/index.js tests/site-config.test.mjs
git commit -m "feat: split cat journal app shells"
```

### Task 4: Rebuild auth for registration-first entry and persistent-session UX

**Files:**
- Modify: `src/hooks/useAuth.js`
- Modify: `src/components/Auth/AuthPage.jsx`
- Modify: `src/components/Auth/LoginForm.jsx`
- Modify: `src/components/Auth/RegisterForm.jsx`

- [ ] **Step 1: Write the failing test**

Add a test asserting the auth config exposes `register` as the default mode and `login` as the secondary path for returning users.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site-config.test.mjs`
Expected: FAIL if auth-flow exports drift from the approved behavior

- [ ] **Step 3: Write minimal implementation**

Update auth copy, layout, and session handling so registration is primary, login is secondary, and existing sessions bypass the auth page.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/site-config.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAuth.js src/components/Auth/AuthPage.jsx src/components/Auth/LoginForm.jsx src/components/Auth/RegisterForm.jsx tests/site-config.test.mjs
git commit -m "feat: redesign cat journal auth flow"
```

### Task 5: Rebuild the logged-in workspace IA around today-first logging

**Files:**
- Modify: `src/components/App/MainApp.jsx`
- Create: `src/components/Workspace/TodayPage.jsx`
- Create: `src/components/Workspace/TimelinePage.jsx`
- Create: `src/components/Workspace/InsightsPage.jsx`
- Create: `src/components/Workspace/AIPage.jsx`
- Create: `src/components/Workspace/MyPage.jsx`

- [ ] **Step 1: Write the failing test**

Extend `tests/site-config.test.mjs` to assert the tool menu contains research access and the primary tabs do not contain research.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site-config.test.mjs`
Expected: FAIL if the exported IA regresses

- [ ] **Step 3: Write minimal implementation**

Refactor the workspace into a top utility bar, today-first landing page, bottom tabs, and secondary tool menu. Keep existing data and check-in behavior, but reorganize it into `今日 / 时间线 / 洞察 / AI / 我的`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/site-config.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/App/MainApp.jsx src/components/Workspace/TodayPage.jsx src/components/Workspace/TimelinePage.jsx src/components/Workspace/InsightsPage.jsx src/components/Workspace/AIPage.jsx src/components/Workspace/MyPage.jsx tests/site-config.test.mjs
git commit -m "feat: rebuild cat journal workspace"
```

### Task 6: Verify behavior and delivery

**Files:**
- Modify: `package.json`
- Test: `tests/normalize.test.mjs`
- Test: `tests/site-config.test.mjs`

- [ ] **Step 1: Add a stable test script**

Set `"test": "node --test tests/*.test.mjs"` in `package.json`.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: add cat journal verification script"
```
