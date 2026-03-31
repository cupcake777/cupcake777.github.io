# Cat Journal Whole-Site Redesign Design

Date: 2026-03-31
Repo: `/home/lyc/work/cupcake777.github.io`
App: `/home/lyc/work/cupcake777.github.io/project`
Status: approved in chat, awaiting written-spec review

## Goal

Rebuild the Cat Journal site into a coherent product with two clearly separated layers:

- an outer public layer that explains the product and leads first-time users into registration
- an inner logged-in workspace optimized for fast daily logging and lightweight review

The redesign should fix the current state where the app feels visually and structurally mixed together:

- auth looks like an isolated floating form
- the logged-in app mixes daily logging, research, reports, profile, and mascot tone at the same level
- global styling still carries template defaults that conflict with the product UI

The first screen after login should make one thing obvious:

- the primary job of the app is to record today quickly
- review is the second job
- AI and research are supporting utilities, not the main center of gravity

## Approved Product Direction

The product direction validated in chat is:

- overall strategy: whole-site reorganization, not cosmetic cleanup only
- tone: mixed mode
  - outer layer has brand personality
  - core workspace is calmer and more tool-like
- device priority: desktop and mobile both matter
- primary user flow: daily logging and mood/state tracking
- navigation pattern after login:
  - top utility bar
  - bottom primary tabs
  - no permanent left sidebar
- auth pattern:
  - first use should register
  - repeat visits should default to auto-login via persistent device session
- visual reference:
  - match the upstream personal site language
  - white base, fresh mint-green accent system, light borders, calm academic-product tone

## Non-Goals

- Replace Supabase with a new auth backend.
- Add passwordless email, social login, or multi-device account management in this pass.
- Expand the research module into a larger feature set.
- Add brand-new analytics infrastructure or server-side rendering.
- Rebuild the app around a different framework.
- Introduce dark mode if it complicates visual alignment with the reference site.

## Information Architecture

### Public Layer

Purpose:

- explain what Cat Journal is
- communicate value quickly
- send first-time users to registration

Structure:

1. hero
2. value explanation
3. feature preview
4. primary CTA to start using the app

This layer should not try to expose the full logged-in information architecture.

### Auth Layer

Purpose:

- bridge first-time user intent into account creation
- keep returning-user entry available without treating it as the primary action

Structure:

- registration-first layout
- secondary existing-user login path
- trust and product context content beside the form

The auth page should feel like part of the same product as the public page and the app workspace.

### Logged-In Workspace

Purpose:

- make recording today the default action
- make time-based review easy
- demote secondary utilities into clearly supporting positions

Primary navigation:

- `今日`
- `时间线`
- `洞察`
- `AI`
- `我的`

High-frequency utilities belong in the top bar:

- quick add
- search
- account menu
- utility menu entries for research access, AI settings, and account actions

The current `research` tab should not remain a top-level primary destination.

## Navigation Design

### Top Utility Bar

The logged-in workspace should open with a compact top utility bar containing:

- brand mark / product title
- current page context or lightweight today summary
- quick-add entry
- search entry
- avatar or utility menu trigger

Visual treatment:

- use a soft mint-tinted header shell
- avoid a heavy dashboard header
- keep it aligned with the reference site's light, thin-border, mint-accent language

### Bottom Tabs

Bottom tabs remain the primary first-level navigation on mobile and should also be available in desktop layout.

Rationale:

- preserves the app-like ease of navigation
- avoids the heaviness of a persistent left rail
- matches the approved "toolbar plus expandable tools" direction

### Utility Menu

Secondary items should move behind a menu or overflow panel:

- research module
- export actions
- AI settings
- account actions

This keeps the main workspace focused without deleting existing capabilities.

## Core Workspace Design

### Default Landing: `今日`

After login, the app should default to `今日`.

The recommended reading order inside `今日` is:

1. lightweight greeting and today summary
2. primary quick-log card
3. today's timeline
4. this-week review snapshot

This replaces the current card stack where many unrelated modules compete for attention.

### Quick-Log Priority

The quick-log card is the most important component in the product.

It should compress the current check-in flow so users can capture the essentials quickly:

- what they are doing now
- current mood or state
- next intended action

Additional fields can remain available, but the first interaction should feel shorter and clearer than the current multi-step emphasis.

### Timeline

`时间线` should replace the current "archive" feel with a more usable review surface:

- recent entries in chronological order
- tap/click into entry detail
- structure preserved so search and filtering can be added later without redoing page hierarchy

The label should communicate active review, not passive storage.

### Insights

`洞察` should absorb the current digest/report role.

It should hold:

- heatmap or consistency views
- weekly and monthly summaries
- mood and completion trends
- AI-generated digest entry points if retained

This creates one coherent review area instead of splitting "report" from "history."

### AI

`AI` remains visible, but as a helper layer rather than the product center.

It can contain:

- contextual suggestions
- digest generation
- supportive reflection prompts

AI should not displace the logging workflow from the homepage.

### Profile / My

`我的` should absorb:

- profile editing
- session/account controls
- personalization and AI settings where appropriate

This is where the mascot-style identity can stay strongest without dominating the full workspace.

## Authentication Flow

The approved auth behavior is:

### First-Time User

- primary CTA from the public page leads to registration
- registration is the default auth action
- successful registration establishes a persistent Supabase session
- user lands directly in `今日`

### Returning User

- if a valid session exists on the device, open the workspace directly
- do not force repeat password entry on normal revisit

### Explicit Login Path

- if the user has logged out or the session expires, show the login path
- existing-user login remains available on the auth page as a secondary action

This is device-session-first auth, not passwordless auth.

## Visual Design System

### Source of Truth

The redesign should visually align with the upstream personal site theme defined in:

- `/home/lyc/work/cupcake777.github.io/quartz.config.ts`
- `/home/lyc/work/cupcake777.github.io/cc-site/custom.scss`

Key inherited values:

- base background near `#fffdfa`
- border and light surface near `#edf3ef`
- muted text near `#567064`
- dark text near `#12231b`
- mint accent near `#2c8c72`
- deeper accent near `#1f6b56`
- highlight layers as low-opacity mint tint

### Public and Auth Pages

The public page and auth page should feel closest to the reference site:

- mostly white background
- generous spacing
- thin borders
- mint used for eyebrow text, links, buttons, and small highlights
- small code-like labels or metadata where useful

Avoid:

- sugary pet-app gradients
- warm brown/gold as the main identity
- oversized mascot decoration

### Logged-In Workspace

The approved color organization for the workspace is:

- soft mint-tinted top bar shell
- white main content area
- light gray-green borders
- mint reserved for active states, buttons, selected controls, and key review cards

This corresponds to the "mist mint top bar + white content area" direction approved in chat.

It should feel product-like but still obviously part of the same family as the reference site.

### Brand Character

The cat identity remains in the product, but should move from global decoration to controlled expression:

- microcopy
- selected icons or illustrations
- profile/personal area
- occasional empty states

It should not dominate the entire logged-in UI with emoji-heavy visual noise.

## State Design

The redesign must explicitly support these states:

### Auth States

- first-time registration
- existing-user login
- existing device session auto-entry
- auth loading
- auth error

### Workspace States

- no records yet
- no record for today
- at least one record for today
- insufficient data for insights
- AI key or provider not configured
- saving / generating / loading states

These states should be designed, not left as accidental leftovers from old layout code.

## Technical Design

### Expected Refactor Direction

The current `src/components/App/MainApp.jsx` is too large and mixes:

- design tokens
- layout logic
- navigation logic
- page-level features
- shared UI primitives

The redesign should split this into clearer modules.

Recommended structure:

- shared layout and design-token utilities
- auth page components
- workspace shell
- page modules for `today`, `timeline`, `insights`, `ai`, `my`
- reusable UI primitives for cards, buttons, inputs, badges, status blocks

### Existing Capabilities to Preserve

Keep:

- Supabase session auth
- local data storage behavior unless directly incompatible with new layout
- existing AI configuration support

Do not expand backend scope in this pass.

### Styling Direction

The app currently mixes:

- `src/index.css` template-like defaults
- component-local `<style>` injection
- large volumes of inline style objects

The redesign should move toward a more centralized design-token system and clearer shared styling patterns, even if inline React styles remain in some places for speed.

At minimum:

- root colors and typography must be unified
- template purple defaults must be removed from the product experience
- page shells should not each invent separate visual rules

## Files Expected to Change

High-probability files:

- `project/src/App.jsx`
- `project/src/index.css`
- `project/src/components/Auth/AuthPage.jsx`
- `project/src/components/Auth/LoginForm.jsx`
- `project/src/components/Auth/RegisterForm.jsx`
- `project/src/components/App/MainApp.jsx`
- `project/src/hooks/useAuth.js`

Likely new files or directories:

- `project/src/components/layout/`
- `project/src/components/workspace/`
- `project/src/components/ui/`
- `project/src/styles/` or equivalent shared style organization

## Mobile and Desktop Behavior

### Mobile

- bottom tab bar remains the main navigation surface
- quick log stays visible near the top
- top utility bar remains compact
- cards stack naturally without dense dashboard layout

### Desktop

- content width can expand beyond the current narrow centered-template feel
- bottom tabs may remain visible, but layout should not feel like a stretched mobile-only mock
- top utility bar and content grouping should provide enough structure that a permanent left rail is unnecessary

## Verification Plan

The redesign should only be considered complete if the following are verified:

- returning users with a valid session bypass auth and land in the workspace
- first-time users can register and land in `今日`
- logged-in default landing is `今日`
- primary navigation reflects `今日 / 时间线 / 洞察 / AI / 我的`
- research is no longer a top-level peer with daily logging
- public, auth, and workspace layers share one coherent mint-based visual system
- old purple/template defaults are no longer visible in the product UI
- mobile and desktop both render without broken layout

## Scope Boundary

This pass includes:

- public page redesign
- auth redesign
- logged-in workspace shell redesign
- navigation reorganization
- visual-system unification
- refactor of the oversized app shell into clearer modules as needed

This pass does not require:

- passwordless auth
- multi-device auth product features
- expanding the research feature set
- new backend services
- unrelated changes to the parent Quartz site itself
