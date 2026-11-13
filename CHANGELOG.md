# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MIT License
- Branch protection on `main` (PR required, linear history)
- Vercel preview deployments per PR

### Changed
- `.gitignore` normalized (LF, deduped, added test output dirs)
- Deploy workflow documented as PR-based

### Fixed
- Existing learners are no longer locked out of course modules that have no scored questions (T1.2b). The one-time repair runs for every profile on the device.
- Quiz answers are kept if the screen redraws; submitting with unanswered questions now asks first, and unanswered items show as "Not answered" in the results (T1.8).
- Diagnostic questions and their answer key no longer appear inside module text (reader, find-in-course, PDF and Word export) for newly imported courses (T1.4). Courses already imported keep the old text until the stored-source update (T1.12).

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