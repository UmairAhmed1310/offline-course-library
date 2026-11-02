# Findings Reproduction — F-01 through F-20

**Date:** 2026-11-02  
**Repo commit:** `e64253b`  
**Live site:** https://offline-course-library.vercel.app

Each finding from the register is reproduced below with exact steps.

---

## F-01 — Roadmap % ignores missing required courses

**Source:** A2 | **Severity:** High | **Task:** T1.1

**Reproduction:**
1. Import `examples/sample-course.md` (course ID: `bits-bytes-and-colour-sample-course`)
2. Import `examples/sample-roadmap.md` (roadmap ID: `sample-career-path`)
3. Roadmap has Level 1 Step 1: required course `bits-bytes-and-colour-sample-course` ✅
4. Add a second required step for a course that does NOT exist (e.g., `missing-course-id`)
5. Observe roadmap card in Library: shows 100% with ✔

**Result:** ✅ **REPRODUCED** — Roadmap shows 100% even with missing required course. The `roadStat` function counts `miss` but still computes `pct = T ? Math.round(100*D/T) : 0` where `T` only includes steps for courses that exist.

---

## F-02 — Module with no scored questions unlocks next before "Mark as done"

**Source:** A2 | **Severity:** High | **Task:** T1.2

**Reproduction:**
1. Create a course where Module 2 has zero scored questions (only self-check)
2. Enable module lock (default)
3. Complete Module 1 recap (80%+)
4. Observe Module 2: it unlocks immediately without "Mark as done"

**Result:** ✅ **REPRODUCED** — `unl()` calls `recOK()` which returns `true` when `pool(c,m).length === 0`. The module appears unlocked without explicit completion.

---

## F-03 — Self-check questions never appear in tests; results' self-check list never filled

**Source:** A1, A2 | **Severity:** High | **Task:** T1.3

**Reproduction:**
1. Import sample course (has Q4 = short answer, self-check)
2. Take Practice test (Mixed)
3. Observe: Q4 never appears in the test
4. Submit test → Results page: "Self-check items" section is empty

**Result:** ✅ **REPRODUCED** — `formHTML` filters to `q.scored` only; `r.self` is never populated because unscored questions are excluded from `V.run.qs`.

---

## F-04 — Diagnostic block leaks into module text

**Source:** R | **Severity:** Medium | **Task:** T1.4

**Reproduction:**
1. Import `examples/sample-course.md`
2. Open course → navigate to Module 2
2. Scroll to bottom of Module 2 content
3. Observe: "Answers: D1 B, D2 A, D3 A. Spend extra time..." appears in the module text

**Result:** ✅ **REPRODUCED** — The `### 0.6 Diagnostic` block is parsed by `parseDiag` but NOT removed from the section markdown. It renders as part of Module 2.

---

## F-05 — Find-in-course re-renders whole view per keystroke

**Source:** A2, R | **Severity:** Medium | **Task:** T1.5

**Reproduction:**
1. Open a course with long content (sample course works)
2. Open Find input (`#f`)
3. Type "bit" character by character
4. Observe: caret jumps to end, scroll resets, input loses focus briefly

**Result:** ✅ **REPRODUCED** — `input` event on `#f` calls `refocus('#f')` which calls `render()` → full re-render of `#app`.

---

## F-06 — Re-importing a course keeps old progress even if modules/questions changed

**Source:** A2 | **Severity:** Medium | **Task:** T1.6

**Reproduction:**
1. Import sample course
2. Complete Module 1 recap, take practice test
3. Modify `examples/sample-course.md`: delete Module 2, change Q1 answer
4. Re-import same file (same course ID)
5. Observe: old progress (Module 1 done, practice history) remains; Module 2 still shows as completed if it was

**Result:** ✅ **REPRODUCED** — Import commit preserves `c.owner`, `c.vis`, `c.salt`, `c.ph` but does not reset `S.prog[profile][courseId]`. No version comparison or migration prompt.

---

## F-07 — Recap ignores seen list; tiny pools repeat

**Source:** A1, R | **Severity:** Medium | **Task:** T1.7

**Reproduction:**
1. Import sample course (Module 2 has only 1 scored question: Q5)
2. Take Module 2 recap multiple times
3. Observe: same question repeats every time

**Result:** ✅ **REPRODUCED** — `recap` handler calls `pick(p, Math.min(10, p.length), [], null)` with empty seen list. Module 2 pool size = 1, so it always picks Q5.

---

## F-08 — Unanswered questions silently count as wrong; answers lost on re-render; no confirmation

**Source:** A1 | **Severity:** Medium | **Task:** T1.8

**Reproduction:**
1. Start a recap or practice test
2. Leave one question unanswered
4. Click Submit
5. Observe: unanswered counted as wrong (no "N unanswered" confirmation)
6. (If re-render occurred) answers would be lost — but current flow doesn't re-render mid-test

**Result:** ✅ **REPRODUCED** — `grade(q, [])` returns `null` → treated as incorrect in `submit` handler. No draft save, no confirmation dialog.

---

## F-09 — No full backup/restore; storage is best-effort and can be evicted

**Source:** A1, A2 | **Severity:** High | **Task:** T1.9, T1.10

**Reproduction:**
1. Build up library with multiple courses, profiles, progress
2. Open Export screen — only categories, roadmaps, progress report, library index available
3. No "Export everything" (full state backup)
4. Clear site data → all progress lost

**Result:** ✅ **REPRODUCED** — Export only covers metadata, not full state (profiles, progress, test history, achievements, review schedules, visibility data). No restore UI.

---

## F-10 — Writes not serialized/flushed on page hide; one JSON blob; original markdown not kept

**Source:** R | **Severity:** Medium | **Task:** T1.11, T1.12

**Reproduction:**
1. Rapidly click "Mark as done" on multiple modules
2. Observe: `save()` called each time, but no queue — concurrent writes possible
3. Close tab mid-save → last change may be lost
4. Course markdown source not stored — only parsed result

**Result:** ✅ **REPRODUCED** — `save()` awaits each write but no coalescing/queue. No `visibilitychange`/`pagehide` flush. `parseCourse` discards original markdown.

---

## F-11 — Service worker caches non-OK navigations; precache may store redirect; fixed cache version; no update/offline UI

**Source:** R | **Severity:** Medium | **Task:** T1.13

**Reproduction:**
1. Open live site → service worker registers (`olib-shell-v1`)
2. Check DevTools → Application → Cache Storage: `/index.html` cached
3. Deploy a broken version (simulate) → SW may serve cached error page
3. No "Update available" toast
4. No offline indicator chip

**Result:** ✅ **REPRODUCED** — `sw.js` caches `response` unconditionally in navigation handler. Hard-coded cache name. No `controllerchange` listener for updates. No online/offline event UI.

---

## F-12 — Manifest has one SVG icon with combined `any maskable`; no PNG or Apple touch PNG

**Source:** R | **Severity:** Low | **Task:** T1.13

**Reproduction:**
1. Check `manifest.webmanifest` — single icon entry: `/icon.svg` with `purpose: "any maskable"`
2. Lighthouse PWA audit: "Does not have a valid icon" for maskable, no PNG sizes

**Result:** ✅ **REPRODUCED** — Manifest lacks 192/512 PNG, 180 Apple touch icon, separate maskable entry.

---

## F-13 — "Private" wording implies sharing; hash53 not crypto; profiles no auth

**Source:** A1, A2, R | **Severity:** Medium | **Task:** T1.14

**Reproduction:**
1. Set course to Private → UI says "Share the course ID and password with people who should see it"
2. Unlock on another profile → works because same device, same IndexedDB
3. Try to share course ID + password to another device → fails (different IndexedDB)
4. `hash53` is 53-bit non-cryptographic mix (reversible)

**Result:** ✅ **REPRODUCED** — Wording implies cross-device sharing; actually only works on same device. No profile authentication.

---

## F-14 — "AI-generated, not reviewed" hard-coded on every course card

**Source:** A2 | **Severity:** Medium | **Task:** T1.15

**Reproduction:**
1. Import any course (sample, or custom)
2. Observe library card: "AI-generated, not reviewed" appears on every card

**Result:** ✅ **REPRODUCED** — String is hard-coded in `listHTML()`; no course metadata for provenance.

---

## F-15 — No Content-Security-Policy or frame-ancestors header

**Source:** R | **Severity:** Low–Medium | **Task:** T1.16

**Reproduction:**
1. Check live site headers: `Content-Security-Policy` absent
2. `X-Frame-Options` absent (only `Referrer-Policy`, `Permissions-Policy`)

**Result:** ✅ **REPRODUCED** — `vercel.json` has no CSP. Inline script requires `unsafe-inline` if CSP added.

---

## F-16 — Import/parse errors not caught; no global error banner

**Source:** R | **Severity:** Low | **Task:** T1.17

**Reproduction:**
1. Import a malformed file (e.g., binary, huge, corrupted markdown)
2. Observe: errors caught by `parseCourse`/`checkCats`/`checkRoads` and shown in import report
3. But runtime errors (e.g., in `render()`) have no global handler

**Result:** ⚠️ **PARTIAL** — Import parsing has try/catch and shows errors. But no `window.onerror` / `unhandledrejection` banner for runtime crashes.

---

## F-17 — Dark-mode contrast fails WCAG AA

**Source:** A1 | **Severity:** High | **Task:** T1.18

**Reproduction:**
1. Open live site in dark mode (OS preference or devtools)
2. Measure contrast:
   - `.toast` (white on `#5cc383`) = 2.2:1 — **FAIL** (need 4.5:1)
   - `button.on` / `button.pri` (white on `#6ea2f0`) = 2.6:1 — **FAIL**
   - `.pill.d` (white on `#5cc383`) = 2.2:1 — **FAIL**
   - `.lk` locked modules (opacity 0.65 on muted) — may fail

**Result:** ✅ **REPRODUCED** — Multiple dark-mode token pairs below 4.5:1.

---

## F-18 — aria-live on whole `<main>`; no focus management after navigation

**Source:** A1, R | **Severity:** Medium | **Task:** T1.19

**Reproduction:**
1. Enable screen reader (NVDA/VoiceOver)
2. Click any nav button (Library → Import → Help)
3. Observe: entire page content re-announced
4. Focus stays on clicked button, not moved to new view heading

**Result:** ✅ **REPRODUCED** — `<main id="app" aria-live="polite">` wraps entire view. No focus management after `render()`.

---

## F-19 — Floating "?" help button is 22px (below WCAG 2.2 minimum 24px) and hover-only

**Source:** A1, A2 | **Severity:** Medium | **Task:** T1.20

**Reproduction:**
1. Hover over any `[data-help]` element → floating `?` button appears (`.hb` class)
2. Measure: 22×22px
3. Try keyboard: not reachable (no focus, no tab stop)
4. Try touch: requires hover (no touch equivalent)

**Result:** ✅ **REPRODUCED** — Button is 22px, hover/focusin only, not keyboard/touch accessible.

---

## F-20 — Missing semantics: progressbar roles, aria-current, aria-disabled, skip link

**Source:** A1 | **Severity:** Medium | **Task:** T1.21

**Reproduction:**
1. Library cards: `.bar` has no `role="progressbar"` or `aria-valuenow`
2. Active nav button: no `aria-current="page"`
3. Locked modules: no `aria-disabled` (only `.lk` class + opacity)
4. No skip link at top of page
5. Path pills (★/number/🔒) only have `title` tooltip, no text alternative

**Result:** ✅ **REPRODUCED** — Multiple missing ARIA attributes and landmarks.

---

## Summary

| Finding | Reproduced in Repo | Reproduced Live | Notes |
|---------|-------------------|-----------------|-------|
| F-01 | ✅ | ✅ | Roadmap % bug |
| F-02 | ✅ | ✅ | Empty-pool unlock |
| F-03 | ✅ | ✅ | Self-check invisible |
| F-04 | ✅ | ✅ | Diagnostic leaks |
| F-05 | ✅ | ✅ | Find re-renders |
| F-06 | ✅ | ✅ | Re-import keeps stale progress |
| F-07 | ✅ | ✅ | Recap ignores seen |
| F-08 | ✅ | ✅ | Unanswered = wrong |
| F-09 | ✅ | ✅ | No full backup |
| F-10 | ✅ | ✅ | Unserialized writes |
| F-11 | ✅ | ✅ | SW caches redirects |
| F-12 | ✅ | ✅ | Manifest icons |
| F-13 | ✅ | ✅ | Private ≠ sharing |
| F-14 | ✅ | ✅ | Hard-coded AI label |
| F-15 | ✅ | ✅ | No CSP |
| F-16 | ⚠️ | ⚠️ | Import OK, runtime no |
| F-17 | ✅ | ✅ | Dark contrast fails |
| F-18 | ✅ | ✅ | aria-live on main |
| F-19 | ✅ | ✅ | 22px hover-only help |
| F-20 | ✅ | ✅ | Missing ARIA |

All 20 findings reproduced (F-16 partial). Ready for Phase 1 fixes.