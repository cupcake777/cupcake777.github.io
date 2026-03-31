# Homepage Project Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Quartz homepage as the personal site while making `Cat Journal` an obvious, durable project entry that supports adding more projects later.

**Architecture:** Update the homepage content source in `cc-site/content/index.md` instead of redirecting the root site. Model the projects area as a reusable featured-project block plus a project card grid so future projects can be appended without restructuring the page again.

**Tech Stack:** Quartz content markdown, custom SCSS, Node test runner via `tsx --test`

---

### Task 1: Add a regression test for the homepage project entry

**Files:**
- Create: `tests/homepage-project-entry.test.mjs`
- Test: `tests/homepage-project-entry.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"

test("homepage advertises Cat Journal as a first-class project entry", async () => {
  const homepage = await fs.readFile(new URL("../cc-site/content/index.md", import.meta.url), "utf8")

  assert.match(homepage, /\/projects\/cat-journal\//)
  assert.match(homepage, /Cat Journal/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/homepage-project-entry.test.mjs`
Expected: FAIL because the homepage source does not yet include a Cat Journal project link.

- [ ] **Step 3: Write minimal implementation**

Update the homepage source to include a featured `Cat Journal` entry and project card link.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/homepage-project-entry.test.mjs`
Expected: PASS

### Task 2: Restructure the homepage projects section for future additions

**Files:**
- Modify: `cc-site/content/index.md`
- Modify: `cc-site/custom.scss`
- Test: `tests/homepage-project-entry.test.mjs`

- [ ] **Step 1: Add a featured-project block and modular project cards**

Represent the current highlighted project separately from the general card grid while keeping the rest of the homepage intact.

- [ ] **Step 2: Extend styles with reusable project-entry classes**

Add styles for a featured project callout and clickable project cards, while preserving the current visual language.

- [ ] **Step 3: Re-run homepage regression test**

Run: `npm test -- tests/homepage-project-entry.test.mjs`
Expected: PASS

### Task 3: Verify the full site still builds and tests cleanly

**Files:**
- Verify only

- [ ] **Step 1: Run root tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run Cat Journal tests**

Run: `npm test`
Expected: PASS from `project/`

- [ ] **Step 3: Build the full Pages artifact**

Run: `node ./quartz/bootstrap-cli.mjs build --directory cc-site/content`
Expected: Quartz build succeeds and emits `public`

- [ ] **Step 4: Build and republish Cat Journal**

Run: `npm run build`
Expected: Vite build succeeds from `project/`

Run: `node ./tools/publish-cat-journal.mjs`
Expected: Cat Journal files are copied into `public/projects/cat-journal`
