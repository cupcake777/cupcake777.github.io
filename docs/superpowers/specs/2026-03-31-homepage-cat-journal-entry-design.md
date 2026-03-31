# Homepage Cat Journal Entry Design

Date: 2026-03-31
Repo: `/home/lyc/work/cupcake777.github.io`
Status: approved in chat, awaiting written-spec review

## Goal

Reconstruct the homepage so visitors can immediately discover and open the Cat Journal app, while keeping the site as a personal homepage rather than turning it into a generic product landing page.

The redesign should make one fact obvious within the first screen:

- `Cat Journal` is the current primary project.
- It has a live entry point at `/projects/cat-journal/`.
- The site owner is `cupcake`, a genetics/bioinformatics PhD student building useful tools and notes in public.

## Non-Goals

- Rebuild Quartz or change the site generator.
- Replace the current Cat Journal React app.
- Add a full CMS, database, or dynamic homepage logic.
- Turn the entire site into a startup-style single-product marketing page.
- Fetch and display the live GitHub avatar at runtime.

## Recommended Direction

Use a `Hero 直达型` homepage:

- Keep the homepage as a personal site.
- Promote `Cat Journal` as the single featured app in the hero and project area.
- Introduce a cute cat mascot/hero visual in the homepage instead of a raw GitHub avatar crop.

Reasoning:

- There is currently only one real app, so the homepage should not pretend there are multiple equally mature products.
- The strongest fix is not a new framework; it is clearer information hierarchy.
- A cat mascot creates continuity between the personal brand and the Cat Journal app.

## User-Facing Changes

### 1. Hero Reconstruction

The homepage hero should become a two-column composition on desktop and a stacked composition on mobile.

Left side:

- eyebrow / identity line
- main heading introducing `cupcake`
- short description connecting research, bioinformatics, and tool building
- primary CTA: `Open Cat Journal`
- secondary CTA: `Read Notes`
- small metadata row describing the app as the current featured build

Right side:

- a cute cat mascot visual
- a framed presentation so the visual feels intentional, not like a pasted icon
- optional small decorative objects tied to the owner identity, such as terminal cursor, star, notebook, or lab-inspired accents

### 2. Featured App Section

Add a dedicated featured section immediately below the hero.

Content:

- app name: `Cat Journal`
- one-sentence description in Chinese
- one short list of what it does
- direct CTA to `/projects/cat-journal/`
- secondary text clarifying that it is the current primary program

This section should remove ambiguity for users who scroll past the hero quickly.

### 3. Projects Section Rewrite

Replace the current placeholder cards with real project cards.

Minimum structure:

- card 1: `Cat Journal` as the dominant card
- card 2: notes / learning in public
- optional card 3: future experiments or pipeline work, but only if phrased honestly as exploratory or in-progress

The Cat Journal card must be clickable and visually stronger than the rest.

### 4. About / Supporting Content Cleanup

Update site copy so it matches reality:

- homepage text should say this is a personal site with notes and one live app
- `about` page should no longer imply a generic projects area without an actual entry path
- if useful, add a dedicated `projects` page later, but it is not required for the first pass

### 5. Cat Mascot Strategy

Use a site-local cat visual rather than dynamically embedding the GitHub avatar.

Decision:

- do not depend on GitHub avatar fetching
- use a cute cat visual placed directly in the homepage hero
- the visual can be:
  - a local PNG/WebP/SVG asset
  - or a lightweight CSS/HTML illustration if it fits the existing stack

The visual should feel friendly and memorable, not childish or noisy.

## Information Architecture

Desired homepage reading order:

1. who you are
2. what the current featured app is
3. where to click to open it
4. what else exists on the site
5. recent notes and contact

Desired first-screen CTA order:

1. `Open Cat Journal`
2. `Read Notes`

## Content Design

### Homepage Tone

Tone should stay personal, concise, and technically grounded.

Avoid:

- placeholder copy
- startup hype
- inflated claims about tools not actually present

Prefer:

- plain language
- one clear sentence about the app
- direct navigation language

### Cat Journal Copy Direction

Target framing:

- a small but real app
- designed around check-ins, mood/state logging, and companion-style interaction
- especially resonant with research/student life, but not overclaimed

## Visual Design Direction

### Style

Preserve the current Quartz visual language:

- soft green palette
- rounded panels
- code-inspired accents
- calm academic tone

But increase contrast in key action areas:

- stronger hero layout
- more obvious CTA button styling
- clearer difference between clickable cards and static text blocks

### Cat Visual

The mascot should:

- feel cute and warm
- read clearly at a glance
- work against the current light background
- still look good on mobile

It should not:

- dominate the page more than the app CTA
- look like a sticker pasted onto unrelated layout
- require runtime external asset loading

## Technical Design

### Files Expected to Change

Primary content files:

- `cc-site/content/index.md`
- `cc-site/content/about.md`

Possible new content file:

- `cc-site/content/projects.md`

Primary style file:

- `quartz/styles/custom.scss`

Possible new asset location:

- `cc-site/static/` or another Quartz-served static asset location already supported by the repo

### Implementation Shape

Content stays Markdown-first with controlled inline HTML blocks where layout needs custom structure.

Styling stays in Quartz SCSS.

No React client-side homepage rebuild is needed.

### Click Path

The Cat Journal entry path should be exposed in at least two places:

- hero primary CTA
- featured app or project card CTA

The target URL is:

- `/projects/cat-journal/`

## Error Handling and Robustness

- If the cat visual asset is missing, the hero must still render cleanly with copy and buttons.
- Links must use stable internal paths so Quartz output remains portable.
- No dependency on external avatar APIs or JavaScript hydration for the homepage entry.

## Mobile Behavior

- Hero stacks vertically.
- Cat visual moves below or above CTA block without hiding the buttons.
- Primary CTA remains visible without excessive scrolling.
- Project cards collapse into a single-column list.

## Verification Plan

The implementation should be considered correct only if the following are verified:

- Quartz build completes successfully.
- Homepage visibly shows a Cat Journal entry above the fold on desktop.
- Homepage visibly shows a Cat Journal entry near the top on mobile.
- `/projects/cat-journal/` is reachable from the homepage with one click.
- The about page text no longer overpromises a vague projects area.
- The cat visual appears correctly and does not break layout.

## Scope Boundary

First pass includes:

- homepage reconstruction
- app entry surfacing
- cat mascot integration
- copy cleanup for homepage and about page

First pass does not require:

- a full projects archive
- multiple new project pages
- a redesigned note system
- changes inside the Cat Journal React app

## Chosen Recommendation

Proceed with:

- `Hero 直达型` homepage
- Cat Journal as the single featured program
- cute cat mascot in the hero
- CTA-first layout with strong discoverability

## Self-Review

- Placeholder scan: no `TODO`, `TBD`, or unresolved placeholders remain.
- Internal consistency: design consistently uses Quartz content + SCSS, not a framework rewrite.
- Scope check: this is implementable as one focused homepage redesign pass.
- Ambiguity check: mascot strategy is explicit: local cat visual, not live GitHub avatar fetching.
