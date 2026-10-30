# Technical analysis

Review of `Offline Course Library · prototype (2).html` as received, followed by what changed to put it on the web.

## Shape of the thing

One 65 KB HTML file, no dependencies, no build step, no network calls. HTML, CSS and JavaScript are inline; the script is not wrapped in an IIFE, so `S`, `V`, `db`, `parseCourse` and friends are globals.

Internally it is a tiny app framework written by hand:

| Layer | How it works |
| --- | --- |
| State | One object `S` (`profiles`, `active`, `courses`, `prog`, `cats`, `roads`, `gone`, `unl`, `cfg`) persisted as a single JSON blob in IndexedDB (`olib` → `kv` → `s`), memory fallback if storage fails. |
| View state | `V` (`n` = screen, `cid` = course, `tab`, `sid` = section, `q`, `f` = find, `res`, `imp`, `run`, `fc`, …). |
| Rendering | Full re-render of `#app` via template strings on every interaction, then `tag()` and `hl()`. No diffing, no router. |
| Events | Three delegated listeners (`click`, `input`, `change`) plus one `keydown`; actions are `data-a` strings. |
| Persistence | `save()` after every mutation, awaiting the IndexedDB write. |

### Parsing

- `parseCourse()` reads `# ` for the title, splits on `## `, and routes `Practice Lab`, `Answer Key` and `Library Data` into their own streams.
- `splitOptions()` finds `A.` … `E.` markers by index, so it survives `·` separators and multi-line stems; falls back to a textarea when fewer than four options are found.
- `applyLib()` reads the Schema v1 table to attach stable IDs, parent module and Bloom level to each question — this is what enables difficulty levels and module-scoped recaps without relying on headings.
- `parseDiag()` scrapes `### 0.6` for `**D1.**` items and a free-text answer block, extracting the domain mapping from `Answers: D1 A, D2 B …` and trailing advice.
- `parseCats()` / `parseRoads()` are line scanners over pipe tables with header detection and warnings.

### Grading and progression

- `grade()` handles numeric (tolerance), single choice and select-two; unanswered returns `null` rather than wrong.
- A recap needs ≥80% to complete a module; stars are 80/90/100; the next module stays locked until then (`unl()`).
- Practice attempts append to `cp.att` with the course attempt number (`cp.run`), so resets do not corrupt history.
- `nextRv()` implements 1/3/7/14/30-day spacing; `chkAch()` awards a completion once per attempt.

## What is good

- **Genuinely offline.** State never leaves the device; there are no fetches, fonts or CDNs to depend on.
- **Careful import validation.** Every file is parsed, errors block the commit, warnings do not — a good pattern for user-supplied content.
- **Escaping is consistent.** Course text goes through `esc()` before `innerHTML`, so Markdown content cannot inject markup. `inl()` escapes first, then re-adds the allowed tags.
- **Accessibility basics are present** beyond the usual prototype: 44 px targets, `focus-visible` outlines, labelled inputs, `aria-live`, dark mode, safe-area insets, keyboard match navigation.
- **Degradation is handled.** IndexedDB failure falls back to memory and says so; self-check questions are shown but excluded from scores; unreadable keys are skipped with a warning instead of a wrong grade.

## Risks found

| # | Issue | Severity | Note |
| --- | --- | --- | --- |
| 1 | Private-course password uses `hash53()` — a 53-bit non-cryptographic mix | Medium | Documented as "a visibility lock, not encryption". Anyone with devtools can read the course anyway, so the honest fix is wording, not crypto. |
| 2 | `#app` is `aria-live="polite"` and is replaced wholesale on each render | Medium | Screen readers re-announce the entire page after every click and keystroke. A small dedicated status region is the right target. |
| 3 | Find-in-course calls `refocus()` → full `render()` on every keystroke | Low | Re-renders the article and resets scroll; fine on short courses, noticeable on long ones with images/quizzes. |
| 4 | Single JSON blob rewritten per mutation | Low | Acceptable at this size; would need split stores before thousands of questions. |
| 5 | No `beforeunload` flush, though writes are `await`ed | Low | A click that navigates away mid-write can lose that one change. |
| 6 | Globals and `/*CORE*/` markers | Info | The markers suggest the parse/grade core is shared with a generator or tests; keep them if that pairing still exists. |
| 7 | Stale copy: footer said "legacy format", Help promised unbuilt import/export | Low | Fixed in this repo. |
| 8 | `WEBSERVICE`-style features absent, but PDF/Word export relies on `window.print()` and blob downloads | Low | Fine in a normal browser; may be blocked inside an embedded preview. |

Nothing here is a blocker for hosting. The app makes no network request at all, so there is no server-side attack surface beyond static files.

## What changed for the web

Kept as a single file on purpose: the prototype *is* the app, and splitting it would break the `/*CORE*/` contract and add a build step for no gain.

1. `index.html` — the prototype renamed from its attachment name, with:
   - description, Open Graph, `color-scheme` and `theme-color` meta tags;
   - manifest, SVG favicon and Apple touch icon links;
   - a four-line service-worker registration block;
   - two stale strings corrected (footer format claim, Help placeholder paragraph).
   The Markdown, grading and state code is byte-for-byte unchanged.
2. `sw.js` — network-first for navigations (so a new deploy lands), cache-first for the shell, old caches dropped on activate.
3. `manifest.webmanifest` + `icon.svg` — installable, standalone, maskable icon.
4. `vercel.json` — zero-build static config, clean URLs, `sw.js` must-revalidate, `nosniff` / `Referrer-Policy` / `Permissions-Policy`.
5. `README.md` and this analysis.

## Recommended next steps

1. **Accessibility pass** — move `aria-live` off `#app` onto a status line, add a skip link, keep the help popover reachable by keyboard.
2. **Debounce find** — highlight in place instead of re-rendering, so long courses keep their scroll position.
3. **Storage** — split progress from course content into separate IndexedDB stores, and add an export-all/import-all backup that round-trips the full state.
4. **Sync** — if multi-device progress matters, that is the one feature that forces a backend; it would be an opt-in endpoint, keeping the offline default.
5. **Tests** — the `/*CORE*/` block is pure functions; it is ready to be extracted with a fixture course and run under `node --test`.
6. **Licence and repo hygiene** — choose a licence, add a screenshot to the README, tag a release.
