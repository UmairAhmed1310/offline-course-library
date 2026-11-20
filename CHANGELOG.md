# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MIT License
- Branch protection on `main` (PR required, linear history)
- Vercel preview deployments per PR
- docs: METRICS.md, the definitions of the product and learning metrics and a draft event dictionary (T6.1).
- docs: REVIEW-WORKFLOW.md, the course review states, checklist and where the state is recorded (T7.19).
- docs: EVALUATION.md, the pilot evaluation protocol: design, success thresholds, consent and data protection (T6.6).
- tests: edge-case fixtures and 46 parser and renderer tests, including pinned known defects (T0.5b).
- docs: CONTRACTS.md, the contracts between the course generator and the app, with versions and known mismatches (T7.20a).
- docs: LEARNER-MODEL.md, the design of topic mastery and the learner model (T3.1).
- Full backup build, validation and merge functions with tests; no screens yet (T1.9a).

### Changed
- `.gitignore` normalized (LF, deduped, added test output dirs)
- Deploy workflow documented as PR-based
- docs: METRICS.md v0.2: the owner's decisions, the dated records the app stores today, and M3 and M6 made precise (T6.1b).
- docs: REVIEW-WORKFLOW.md v0.2 uses the generator's real review fields and values (T7.19b).

### Fixed
- Existing learners are no longer locked out of course modules that have no scored questions (T1.2b). The one-time repair runs for every profile on the device.
- Quiz answers are kept if the screen redraws; submitting with unanswered questions now asks first, and unanswered items show as "Not answered" in the results (T1.8).
- Diagnostic questions and their answer key no longer appear inside module text (reader, find-in-course, PDF and Word export) for newly imported courses (T1.4). Courses already imported keep the old text until the stored-source update (T1.12).
- Roadmaps now show how many of their courses are in your library, and the roadmap Help text matches how missing courses are counted (T1.1b).
- Course files with Windows (CRLF) or old Mac line endings now import instead of stopping with “No Module N sections were found” (T1.4b).
- The roadmap percentage label says that each missing required course counts as one module (T1.1c).
- Courses with titles that have no Latin letters get their own stable id instead of sharing an empty one; the import screen says when a file will replace a course in the library (T1.22).
- Numeric keys with an exponent are read correctly; repeated module numbers give a warning; very long option lines no longer slow the import; “(about 1 hour)” is accepted (T1.23).
- The floating, hover-only "?" help button is replaced by visible "ⓘ" buttons (44 px, with a text name) next to each help topic (T1.20).

### Security
- Rotated Vercel OIDC token (old `.env.local` removed)

## [v0.1.0-baseline] - 2026-11-01

### Added
- Initial release: single-file offline course library
- Service worker (`sw.js`) with network-first navigation caching
- Web App Manifest (`manifest.webmanifest`) + SVG icon
- Vercel configuration (`vercel.json`) with security headers
- Sample course (`examples/sample-course.md`)
- Technical analysis (`docs/ANALYSIS.md`)
- Implementation task plan (`docs/IMPLEMENTATION-PLAN.md`)

### Infrastructure
- GitHub repository created and linked to Vercel
- Production deployment at https://offline-course-library.vercel.app