# Offline Course Library

A single-page, offline-first course library. Import a Markdown course file, read it, take module recaps and practice tests, and keep progress per profile — all stored in the browser. No server, no accounts, no build step.

Live: **https://offline-course-library.vercel.app**

## What it does

- **Library** — courses grouped by category, with hours, module count, difficulty rating, stars and progress; search across titles, categories and module titles; optional career roadmaps with per-level progress.
- **Reading** — a small Markdown subset (headings, lists, tables, code, bold/italic) with find-in-course, highlighting and match navigation.
- **Practice tests** — up to 30 random questions, unseen first, optional Starter / Builder / Expert levels driven by Bloom tags in the course file.
- **Module recaps** — 10 questions per module; 80% passes the module, earns stars (80/90/100) and unlocks the next module.
- **Diagnostic** — optional pre-course check that flags domains with repeated misses.
- **Flashcards** — a module's Recall check becomes cards with a 1/3/7/14/30-day review schedule.
- **Profiles** — separate progress per person on the same device, plus public/private course visibility (a password lock, not encryption).
- **Import/export** — courses, category packs and roadmaps in Markdown; progress report, library index, PDF and Word export.
- **Achievements and history** — completions and every practice attempt, per profile.

## Run locally

Any static server works:

```bash
npx serve .
# or
python -m http.server 8080
```

Opening `index.html` directly from disk also works, except service-worker caching (the app still runs; progress still saves).

## Deploy on Vercel

The repo is a plain static site. Vercel needs no build settings:

- Framework preset: **Other**
- Build command: none
- Output directory: repository root
- `vercel.json` adds headers, clean URLs and no-cache for `sw.js`.

The repository is already linked: every push to `main` triggers a production deployment. For a manual deploy:

```bash
vercel --prod
```

## Project layout

```
index.html            the whole app (HTML + CSS + JS)
manifest.webmanifest  installable web app metadata
icon.svg              app icon
sw.js                 offline shell cache
vercel.json           hosting config
docs/ANALYSIS.md      technical review, risks and next steps
```

## Where data lives

State is one JSON object in IndexedDB (`olib` → `kv` → key `s`), with an in-memory fallback when storage is blocked. Clearing site data deletes the library, so use **Export** for backups.

## Course file format (short version)

Start from [`examples/sample-course.md`](examples/sample-course.md) — it parses with no errors and covers every question type.

```markdown
# Course title

Intro text with the estimate in parentheses, like (about 2 hours).

## Module 1 · Something
**link:** D1
...notes...

### Recall check
How many bits are in a byte? (1) Eight. (2) Four.

### Remember
A byte is eight bits.

## Practice Lab

**Q1.** Question text (mcq) A. first · B. second · C. third · D. fourth

## Answer Key

| Q | Answer | Domain | Why |
| --- | --- | --- | --- |
| 1 | B | D1 | explanation |

## Library Data

| ID | Kind | Label | Parent | Bloom |
| --- | --- | --- | --- | --- |
| c1 | module | Module 1 | | |
| q1 | question | Q1 | c1 | analyze |
```

Rules the parser enforces:

- The question stem **and its options must be on one line** — the Practice Lab and diagnostic are read line by line. Options on the next line are silently read as "no options", so the question is shown but never scored.
- `A.`–`E.` options, `·` separators optional; at least four are needed for a choice question.
- Question types: `mcq`, `select two`, `numeric` (`32 ± 0` for a tolerance), `short answer`, `rubric`, `code` — the last three are self-check and are never scored.
- `## Library Data` (Schema v1) supplies stable question IDs, module links and Bloom levels; without it, difficulty levels are unavailable and modules are matched by question domain.
- The hours estimate is only read when written as `(about N hours)`.

A misread key never fails silently: the import report lists it as a warning and excludes the question from scoring.

## Limitations

- Progress is per browser profile and per device; there is no sync.
- Password visibility uses a fast non-cryptographic hash. It is a lock against casual access, not encryption.
- Data is not encrypted at rest.
- No sync conflicts, no multi-user accounts, no server-side backup.

## License

MIT License — see [LICENSE](LICENSE) for details.
