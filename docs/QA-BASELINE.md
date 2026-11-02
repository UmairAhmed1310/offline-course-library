# QA Baseline — Live Site

**Date:** 2026-11-02  
**Deployment:** https://offline-course-library.vercel.app (commit `e64253b`)  
**Tester:** Automated + manual spot-check

---

## 1. Layouts (360, 768, 1280 px; light & dark)

| Viewport | Light | Dark | Notes |
|----------|-------|------|-------|
| 360 px   | ✅    | ✅   | Header wraps correctly; bottom tab bar on mobile |
| 768 px   | ✅    | ✅   | Split view works; sidebar collapsible |
| 1280 px  | ✅    | ✅   | Full desktop layout; all nav visible |

**Dark mode contrast issues (known F-17):**
- `.toast` (white on `#5cc383`) ≈ 2.2:1 — **FAIL** WCAG AA
- `button.on` / `button.pri` (white on `#6ea2f0`) ≈ 2.6:1 — **FAIL** WCAG AA
- `.pill.d` (white on `#5cc383`) ≈ 2.2:1 — **FAIL**
- `.lk` locked modules (opacity 0.65) — text may be too faint

---

## 2. Core Journeys

| Journey | Status | Notes |
|---------|--------|-------|
| Import sample course | ✅ | 2 modules, 5 questions, diagnostic 3 items |
| Diagnostic → read → recap pass | ✅ | Module 2 unlocks after 100% |
| Recap fail → retry | ✅ | Shows explanations, "Try again" works |
| Practice test (Mixed) | ✅ | 4 questions rendered (3 scored + 1 self-check) |
| Diagnostic tab | ✅ | 3 items, shows advice on submit |
| Flashcards (Module 1) | ✅ | Cards render, show/hide, rate Got it/Partly/Again |
| Profile switch | ✅ | Separate progress per profile |
| Private course unlock | ✅ | Password lock works (hash53, not crypto) |
| Reset course | ✅ | Clears progress, keeps history/achievements |
| Remove course (owner) | ✅ | Marks removed, keeps history |
| Export (categories, roadmaps, progress, library index) | ✅ | Markdown files download |
| Save as PDF / Word | ✅ | Print dialog / .doc download |

---

## 3. Persistence

| Test | Status | Notes |
|------|--------|-------|
| Refresh page | ✅ | Progress restored from IndexedDB |
| Close & reopen tab | ✅ | State persists |
| Restart browser | ✅ | State persists |
| Private/incognito window | ✅ | Falls back to memory; shows "Saving is unavailable" banner |

---

## 4. Offline

| Test | Status | Notes |
|------|--------|-------|
| Load once online | ✅ | Service worker registers (`olib-shell-v1`) |
| DevTools → Offline → reload | ✅ | App opens, library empty state shows |
| Open course offline | ✅ | Module content readable |
| Answer quiz offline | ✅ | Recap submits, progress updates |
| Reload again offline | ✅ | Still works |

**Known issue (F-11):** Service worker caches non-OK navigations; precache of `/index.html` may store a redirect.

---

## 5. PWA Installability

| Platform | Status | Notes |
|----------|--------|-------|
| Android Chrome | ✅ | "Install" prompt appears; standalone display works |
| Desktop Chrome/Edge | ✅ | Install button in address bar; opens as standalone window |
| Lighthouse installability | ⚠️ | **FAIL** — manifest has single SVG with `any maskable`; no PNG icons (192, 512), no Apple touch icon (180 px) |

---

## 6. Accessibility

| Check | Status | Notes |
|-------|--------|-------|
| Keyboard-only navigation | ✅ | All interactive elements reachable; focus visible |
| axe scan (library view) | ⚠️ | **FAIL** — `aria-live` on `<main>`, missing progressbar roles, missing `aria-current`, floating help button 22px (below 24px minimum) |
| NVDA (Windows) | ⚠️ | Screen reader re-announces entire page on every click (aria-live on main) |
| VoiceOver (macOS/iOS) | ⚠️ | Same as NVDA |
| 200% zoom | ✅ | No horizontal scroll; tables scroll internally |
| 400% zoom | ✅ | Usable |

---

## 7. Console Errors & Edge Cases

| Scenario | Status | Notes |
|----------|--------|-------|
| Clean console on load | ✅ | No errors |
| Storage blocked (private window) | ✅ | Banner shows "Saving is unavailable here" |
| Clear site data → reload | ✅ | Library empty; import works |
| Malformed course import | ✅ | Shows errors, does not commit |

---

## 8. Screenshots

*To be captured and added to README*

---

## Summary

| Category | Pass | Fail | Known Issues |
|----------|------|------|--------------|
| Layouts | 6 | 0 | — |
| Journeys | 12 | 0 | — |
| Persistence | 4 | 0 | — |
| Offline | 4 | 0 | F-11 (SW caches redirects) |
| PWA | 2 | 1 | F-12 (manifest icons) |
| Accessibility | 2 | 4 | F-17, F-18, F-19, F-20 |
| Edge cases | 4 | 0 | — |

**Overall:** Core functionality solid. Primary gaps are accessibility (contrast, live regions, semantics) and PWA manifest completeness — both tracked in Phase 1 tasks.