# Cat Journal Animation & Visual Enhancement Design

**Date**: 2026-03-31  
**Author**: Sisyphus (AI Agent)  
**Status**: Draft - Pending User Approval

---

## 1. Overview

Enhance the Cat Journal web application with refined motion and visual polish while maintaining the existing mint green theme. Target level: **Polished & Dynamic** — featuring scroll reveals, magnetic buttons, layout transitions, and smooth micro-interactions across all pages.

---

## 2. Design Direction

- **Visual Theme**: Refine current mint green theme — enhance depth with better glass effects, refined shadows, and subtle gradients
- **Animation Level**: Polished & Dynamic (Level 5-6)
- **Scope**: All pages (PublicHome, Auth, Workspace)

---

## 3. Color & Visual Refinements

### 3.1 Enhanced Color Palette

| Token        | Current                              | Proposed                                                                            |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------------------- |
| `base`       | `#fffdfa`                            | `#fffdfa` (keep)                                                                    |
| `surface`    | `#ffffff`                            | `#ffffff` (keep)                                                                    |
| `accent`     | `#2c8c72`                            | `#2c8c72` (keep, enhanced shadow)                                                   |
| `accentSoft` | `rgba(44, 140, 114, 0.08)`           | `rgba(44, 140, 114, 0.06)` (subtle)                                                 |
| `shadow`     | `0 18px 48px rgba(18, 35, 27, 0.08)` | `0 20px 60px rgba(18, 35, 27, 0.10), 0 8px 24px rgba(44, 140, 114, 0.08)` (layered) |

### 3.2 Glass Effects

- Header backgrounds: `backdrop-filter: blur(20px)` with `background: rgba(255, 253, 250, 0.85)`
- Modal overlays: `background: rgba(18, 35, 27, 0.20)` (slightly darker for depth)
- Surface components: Add subtle inner glow `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6)`

### 3.3 Typography Enhancement

- Font families: Keep existing (Schibsted Grotesk, Source Sans 3, IBM Plex Mono)
- Letter-spacing on large titles: `-0.03em` to `-0.04em`
- Line-height on body text: `1.65` for better readability

---

## 4. Page-Specific Enhancements

### 4.1 PublicHome (Landing Page)

#### Header

- Sticky with blur: Add subtle slide-down entrance animation
- Logo/brand: Subtle fade-in

#### Hero Section

- Split layout: Left content slides in from left, right demo card fades in with slight upward motion
- Stagger: Eyebrow → Title → Description → Buttons → Badges (100ms delay each)
- Buttons: Add scale transform on hover (1.02), subtle shadow expansion

#### Feature Cards

- Scroll reveal: Each card fades up as it enters viewport
- Stagger: 150ms delay between cards
- Hover: Subtle lift effect (translateY -4px) with enhanced shadow

#### Value Proposition Section

- Parallax-lite: Text and background have subtle depth difference on scroll

#### CTA Section

- Slide-in from bottom when visible
- Button: Pulse animation on hover (subtle scale pulse)

### 4.2 Auth Pages

#### Layout

- Two-column grid: Left panel fades in from left, right form panel from right (simultaneous)
- Stagger: Eyebrow → Title → Description → Form elements (80ms delay)

#### Tab Switcher (Register/Login)

- Active tab: Smooth background slide (using Framer Motion layout)
- Tab content: Crossfade with slight vertical motion
- Underline indicator: Smooth x-axis transition

#### Form Inputs

- Focus state: Border color transition + subtle glow (`box-shadow: 0 0 0 3px rgba(44, 140, 114, 0.12)`)
- Error state: Shake animation on validation failure
- Submit button: Loading state with spinner, disabled during submission

#### Back Button

- Hover: Subtle slide (translateX -4px)

### 4.3 Workspace (Main App)

#### Header

- Entrance: Fade + slide down (200ms)
- Search button: Magnetic effect (subtle pull toward cursor)
- Quick add button: Pulse glow effect
- Avatar: Subtle bounce on load

#### Tab Navigation (Bottom)

- Active tab: Layout transition for icon + label
- Icon: Scale up slightly when active (1.1x)
- Press state: Scale down (0.95x)

#### TodayPage

- Welcome card: Fade + scale in (0.98 → 1)
- Metrics: Stagger in (100ms delay each)
- Form sections: Fade in sequentially
- Mood selector: Scale bounce on selection
- Save button: Ripple effect on click
- Saved feedback: Checkmark animation

#### TimelinePage

- Record cards: Stagger reveal on load
- Card hover: Subtle lift + border color change
- Selected card: Border glow animation
- Search: Focus expansion animation

#### InsightsPage

- Charts: Draw-in animation
- Digest generation: Loading spinner with pulse

#### Floating Cat

- Idle animation: Gentle float (translateY oscillation)
- Walking animation: Triggered on new record
- Interaction: Reacts to scroll direction

---

## 5. Animation Specifications

### 5.1 Tools

| Category         | Tool              | Usage                                              |
| ---------------- | ----------------- | -------------------------------------------------- |
| UI transitions   | **Framer Motion** | Enter/exit, layout, scroll reveal, tab transitions |
| Hover/focus      | **CSS only**      | Button states, card hovers (zero JS cost)          |
| Perpetual motion | **Framer Motion** | Floating cat, pulsing elements                     |

### 5.2 Timing Constants

```javascript
const MOTION = {
  instant: 100, // Micro-interactions
  fast: 150, // Hover/focus states
  normal: 200, // Component entrances
  slow: 300, // Section transitions
  stagger: 80, // Between list items
}
```

### 5.3 Easing

- **Entrances**: `easeOut` (cubic-bezier: 0.16, 1, 0.3, 1)
- **Exits**: `easeIn` (cubic-bezier: 0.7, 0, 0.84, 0)
- **Spring**: `stiffness: 120, damping: 20` (for interactive elements)

### 5.4 Performance Rules

- Only animate `transform`, `opacity`, `filter` — NEVER `width`, `height`, `top`, `left`
- Use `will-change: transform` only during animation
- Respect `prefers-reduced-motion` — disable all animations
- Mobile: Disable parallax, reduce particle count

---

## 6. Implementation Dependencies

```bash
npm install framer-motion
```

No additional dependencies required. Using CSS for hover states keeps bundle small.

---

## 7. Acceptance Criteria

### Visual

- [ ] Glass effects on header and modals
- [ ] Enhanced shadows with depth layers
- [ ] Consistent spacing and typography

### Motion

- [ ] Page sections reveal on scroll
- [ ] Tab transitions are smooth (no jump)
- [ ] Buttons have tactile hover feedback
- [ ] Floating cat has continuous subtle animation

### Accessibility

- [ ] Respects `prefers-reduced-motion`
- [ ] Focus states visible
- [ ] No animations flash > 3 times/second

### Performance

- [ ] No jank on scroll
- [ ] Animations run at 60fps
- [ ] Build succeeds without errors

---

## 8. Future Considerations (Out of Scope)

- 3D/WebGL effects (Level 9-10)
- Complex scroll hijacking (horizontal scroll)
- Video backgrounds
- Complex generative art

---

**Please review and approve this design before we proceed to implementation.**
