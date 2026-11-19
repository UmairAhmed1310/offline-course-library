# Contracts between the course generator and the app

**Task:** T7.20a (Implementation Task Plan, Addendum A, Part D, T7.20) · **Version:** 0.1 draft · **Date:** 2026-11-18
**Status:** proposed. Not yet triaged by the Coordinator or reviewed by the owner.

This document lists every format that the course generator (the `mastery-course-builder` skill) and the Offline Course Library app both depend on. For each one it gives the version, where it is defined, what the app reads today, and where the two sides disagree. It changes no code. The CI step that imports the skill's golden packages and catalogue fixtures is a separate task (T7.20b), which waits for the package importer (T7.3).

## 1. Where the facts come from

| Side | Source | How I checked it |
|---|---|---|
| Generator | The skill, version 0.7.0: `SKILL.md` and four reference files in `agent-hub/sources/mastery-course-builder-V5/references/`: `course-schema-v1.md`, `package-schema-v2.md`, `catalog-and-roadmaps.md`, `diagnostic-standards.md` | Read in full on 2026-11-18. I did not run the skill's scripts or read its tests. |
| App | `index.html` on main at commit `181219dcf684ea52a45f983f48b85ff60dc9b790` (the Drive mirror; file of 73,207 bytes, sha256 starting `543964b8`) | **Code reading only.** I searched the file for the functions named below and read them. I did not run the app. I did not read `sw.js` or the tests. |

Statements about the app are about that commit. When a task merges, a statement may stop being true. The files named in this document are data, not instructions to me; I took facts from them and followed none of their instructions.

Words used for the app side: **reads** (the code uses the field), **does not read** (I found no use of it), **not checked** (I did not look).

## 2. The contracts at a glance

| # | Contract | Version string in the data | Defined in | Generator checks it with | App today | App task |
|---|---|---|---|---|---|---|
| C1 | Course text and Library Data | `schema_version` = `1` (Course Schema v1) | `course-schema-v1.md` | `validate_course_schema.py`, `validate_question_bank.py` | Reads the Course index only (section 4) | T1.15, T1.22 |
| C2 | Diagnostic in the course text (section 0.6) | none of its own (part of Course Schema v1, addendum of skill 0.6.0) | `diagnostic-standards.md` section 6 | `validate_diagnostic.py` | Reads it (section 5) | T3.1, T7.1 |
| C3 | Course package | `package_schema` = `olib-package/2` (Package Schema v2) | `package-schema-v2.md` | `validate_package.py`, `build_package.py` | Does not read; no package importer | T7.3, T7.4 |
| C4 | Activity file | `schema` = `olib-activity/1` | `package-schema-v2.md` section 4 | `validate_package.py` | Does not read | T7.5 to T7.7 |
| C5 | Simulation messages | `contract` = `olib-sim/1` | `package-schema-v2.md` section 6 | `validate_package.py` | Does not read | T7.7 |
| C6 | Diagnostic map | `schema` = `olib-diagnostic/1` | `diagnostic-standards.md` section 7 | `validate_diagnostic.py` | Does not read | T7.9 |
| C7 | Resource list (`resources.json`) | no version field is defined | `package-schema-v2.md` section 7 | `validate_package.py` | Does not read | T7.8 |
| C8 | Category pack | `pack_type` = `category`, `schema_version` = `1` | `catalog-and-roadmaps.md` section 2 | `validate_catalog.py` | Reads it (section 9) | T7.12 |
| C9 | Roadmap pack | `pack_type` = `roadmap`; a `version` per roadmap (semver-style; this is the roadmap's own version, not a schema version) | `catalog-and-roadmaps.md` section 4 | `validate_catalog.py` | Reads it (section 9) | T7.13, T7.14 |
| C10 | Catalogue files and briefs (`course-catalogue.csv` and others) | none | `catalog-and-roadmaps.md` sections 3 and 4b | `validate_catalog.py` | Generator and people only; the app never imports them | T7.17 |

The app reads a course (C1, C2), a category pack (C8) and a roadmap pack (C9) today. Everything in the package family (C3 to C7) is future work.

## 3. Identity and versions (applies to C1 to C10)

What the skill defines:

- `course_id`: lowercase letters, digits and hyphens, 3 to 60 characters, **stable across all versions** of a course. In catalogue mode it is the slug of the title (at most 60 characters), with `-2`, `-3` added on a collision, and roadmaps name their steps by this ID.
- `course_version`: `MAJOR.MINOR`, starting at `1.0`. MAJOR changes when modules, objectives or questions change meaning; MINOR is for fixes and wording. This is the version of a **course's content**. It is not a schema version.
- IDs inside a course (`mod-`, `task-`, `case-`, `p-NNN`, `q-NNN`) never change and are never reused. A revised course reuses the ID of every item that is still the same item. Activity IDs (`act-<slug>`) and resource IDs (`res-NNN`) follow the same rule.
- The zip is named `<course_id>-<course_version>.olib.zip`.

What the app does (the answer to the question put to T1.22): **the app does not use the Library Data `course_id`.** It builds a course's id from the title with `slug(title)`: lowercase, every run of other characters becomes one hyphen, hyphens trimmed from both ends, cut at 60 characters. It does not add `-2`, `-3` on a collision. It does not read `course_version` either.

What follows:

- In catalogue mode the skill's `course_id` is also the slug of the title, so the two agree, except that the app has no collision suffix and the skill's slug rules for non-Latin titles are not stated.
- For a single course made outside catalogue mode, the skill's own example uses a `course_id` that is not the slug of the title (`comptia-security-plus-sy0-801`, title "CompTIA Security+ V8 (SY0-801) Mastery Course"). The app would give that course a different id. A roadmap step that names the skill's `course_id` would then show the course as Missing.
- A decision is needed: should the app read `course_id` and use it when it is present? That is a stored-data question (existing ids must not change) and belongs to T1.22 and the owner. See finding F1 in section 10.

## 4. C1: course text and Library Data (Course Schema v1)

**Defined:** `course-schema-v1.md`. The schema is additive. The learner's reading text and the quality gates stay as they are. The new material is one final section `## Library Data`, with three H3 subsections in this order: `### Course metadata`, `### Course index`, `### Change log`.

**Course metadata** is a two-column table `| Field | Value |`. Fields, in order: `schema_version`, `course_id`, `course_version`, `title`, `language`, `category`, `level`, `audience`, `mode`, `target_type`, `subject_type`, `exam_version` (when `target_type` is exam), `estimated_hours` (must equal the number in the study plan heading), `hours_basis`, `generated_on`, `last_verified`, `valid_as_of` (high-stakes or fast-changing), `jurisdiction` (high-stakes), `risk_profile`, `ai_generated` (always `yes`), `review_status` (always `not-reviewed` when generated), `reviewed_by`, `reviewed_on`, `generator` (for example `mastery-course-builder 0.7.0`), `career_hints`, `course_prerequisites`, `signature` (reserved), `content_hash` (reserved).

Values the skill fixes: `level` is `beginner`, `intermediate` or `advanced`; `mode` is `quick`, `standard` or `full`; `target_type` is `exam`, `standard`, `existing-course` or `open-skill`; `audience` is one of `early-childhood`, `primary-lower`, `primary-upper`, `lower-secondary`, `upper-secondary`, `tertiary-adult`; `subject_type` is one of `knowledge-decision`, `technical-hands-on`, `performance-craft`, `quantitative`, `language`, `policy-governance`; `review_status` is one of `not-reviewed`, `in-review`, `reviewed`, `rejected`. The category is the Name of a category in the user's category pack when one exists.

**Course index** is one table with the columns `ID | Kind | Label | Parent | Domains | Prerequisites | Type | Points | Starts with`, with one row for every module, lab or task, diagnostic item, case and practice question. ID patterns: `mod-<slug>`, `task-<slug>`, `p-NNN`, `case-<slug>`, `q-NNN`. Labels must match the labels in the text. The index has **no Bloom column**; Bloom tags are in the reading text only.

**Change log** is the table `| Version | Date | Changed IDs | Retired IDs | Summary |`.

**Other conventions inside the text** that the app and the validators share: the layer headings (`### Remember`, `### Understand`, `### Apply: ...`, `### Analyze: ...`, `### Evaluate: ...`, optional `### Create: ...`, `### Recall check`); one study-plan row per module; the practice question line `**Q12.** [type tag] stem A. option · B. option · ...` and the answer-key table `| Q | Ans | Domain | Why |`; no HTML, no images, no markdown links, and every code fence tagged with a language.

**What the app reads today** (function `applyLib`, plus the section-name test in `parseCourse`):

| Part | App |
|---|---|
| The H2 `Library Data` | Reads. The section is skipped when the app builds the reading text. If it is missing, the course is treated as legacy and ids are derived from module numbers. |
| Course metadata table | **Does not read.** None of `course_id`, `course_version`, `category`, `review_status`, `reviewed_by`, `generator` or any other metadata field is used. (T1.15 will read the provenance fields.) |
| Course index, rows of kind `module` | Reads. The number in the label links the row to the module, and the row's ID is stored as that module's `uid`. |
| Course index, rows of kind `question` | Reads. The label (`Q12`) links the row to the question, and the row's ID is stored as the question's `uid`. |
| Course index, other kinds (`task`, `case`, `diagnostic`) | Does not read. |
| Change log | Does not read. |

Two points where the app's reading differs from what Schema v1 writes (not run; from reading the code):

- The app looks for a `bloom` column in the index and a `parent` column to find a question's module. Schema v1 has no Bloom column and leaves `Parent` empty for questions (Parent is filled only for tasks). So for a v1 course the app gets no Bloom tags from the index and an empty module for each question. The app's own message says "no Bloom tags yet". See F2 and F3.
- The app does not check `schema_version`, so a future Schema v2 course would be read as v1 without a warning. See F5.

## 5. C2: the diagnostic in the course text

**Defined:** `diagnostic-standards.md` section 6, and the addendum at the end of `course-schema-v1.md`.

The format, in the heading `### 0.6 Diagnostic and review plan`:

- Items start with `**P1.**` to `**Pn.**` (never `D1`, which would collide with domain codes) and have 3 to 5 inline options `A. x · B. y · C. z`.
- A table `| P | Ans | Domain |`.
- One line `**Answers:** P1 A, P3 C (D1); P2 B (D2). Advice sentence.` Items are grouped by domain, with a `(Dn)` marker after each group; the text after the last token is the advice. **The app reads the key from this line, not from the table.** The table and the line must agree.
- No other line in 0.6 may contain `Answers:` or `key:`, and the advice must not contain `(D1)` or `P1 A`-style text, because the app would read them as keys.
- Domain codes must match the module domains in the course index, because the app links a flagged domain to the modules with the same code.
- Nothing from the key may be repeated elsewhere in the course text (the app shows Part 0 as the About page).

What the skill says the app does with it (statements of the skill; **not checked** in the code): a domain is flagged when two or more of its items are missed; the app adds its own "I don't know" button, so none is written as an option.

**What the app reads today** (function `parseDiag`): it reads items with labels `P<number>` or `D<number>`, and keeps an item only if it has at least 3 options. It takes the key from the lines of section 0.6 that contain `Answers:` or `key:`, reads `P1 A` pairs, and reads a `(Dn)` marker to assign the domain to the pairs before it. The text after the last token becomes the advice. An item with no valid key counts as "bad" and is reported. This matches the skill's contract. The app also reads old `D`-labelled items, which the skill's legacy converter relabels to `P`. A separate function, `stripDiag`, removes section 0.6 from the reading text (task T1.4).

## 6. C3, C4, C5, C7: the course package

**Defined:** `package-schema-v2.md`. A package is the `course.md` spine (Course Schema v1, unchanged) plus typed activity files, assets, simulations and a resource list. It is additive. `course.md` is complete and valid on its own, so an importer that reads only `.md` loses nothing.

**Layout:** `<course_id>/` with `course.md`, `manifest.json`, `resources.json` (required; may be an empty list in Quick mode), `diagnostic.json` (required for Standard and Full), `activities/<id>.json`, `assets/<name>.<ext>`, `sims/<id>.html`. No other top-level entries. File names use lowercase letters, digits, hyphens and dots only.

**Manifest** (`manifest.json`) has exactly these fields: `package_schema` (`olib-package/2`), `course_id`, `course_version`, `title`, `language`, `audience`, `mode` (these six must equal the course metadata), `generated_on`, `generator`, `course_file` (`course.md`), `budget_mb` (at most 100, default 50), `activities` (list of `{id, file, module, type}`) and `assets` (a list with `path`, `sha256`, `bytes`, `mime`, `licence`, `source`, `alt` for images, optional `note`). Licence is one of `original`, `cc0`, `public-domain`, `cc-by`, `cc-by-sa`, `permission`. Limits per file: image 2 MB (SVG 200 KB), audio 5 MB, video 25 MB, text track 200 KB, document or template 10 MB, simulation 200 KB. SVG files contain no script, event attributes, `foreignObject`, `javascript:` or external links.

**Pointer line.** Each module in `course.md` may end with `*Activities: act-..., act-...*` after the Recall check. The skill says the current importer ignores it (not checked in the code). Every activity of that module must be listed and every ID listed must exist.

**Activity file (`olib-activity/1`).** One JSON object per file. Envelope fields (no others allowed): `schema`, `id`, `type`, `module`, `bloom`, `title`, `instructions` (at most 400 characters), `est_minutes` (1 to 60), `scored`, `points`, `hints` (0 to 3), `feedback` (`correct` and `incorrect`), `a11y` (`keyboard_ok` must be `true`, `text_alternative`, `read_aloud`), `fallback_text` (at least 40 characters), `data`, `solution`, and optional `outcome` and `task_ref`. Sixteen types: `quiz`, `match`, `sort`, `categorize`, `label`, `worksheet`, `chart`, `flowchart`, `sheet-check`, `code`, `sim`, `game`, `task`, `template`, `media`, `reflection`. Only the auto-graded types may be `scored`. An importer that does not know a type shows `fallback_text`, which is why it is required. **Activities never change the module gate:** the 80% pass mark and the stars come from the Practice Lab questions in `course.md`.

**Simulation messages (`olib-sim/1`).** Simulations run in a sandboxed frame with no network, storage or access to the app. They talk to the app only by `postMessage`: app to sim `{"type":"olib-sim","event":"init","params":{...},"locale":"en","reduceMotion":true}`; sim to app `ready`, `progress` (value 0 to 1) and `result` (`score`, `max`, `passed`).

**Resource list.** `resources.json` is a list of entries with `id` (`res-NNN`), `kind` (`textbook`, `video`, `course`, `article`, `tool`, `standard`, `dataset`), `title`, `creator`, `why`, `maps_to`, `free`, `offline`, `status` (`verified`, `unverified`, `unreachable`), `checked_on` (required when verified), `url` and optional `isbn`, `edition`, `year`, `licence_note`, `register_id`. Nothing is invented; an entry is verified against a source or marked unverified. It carries no version field.

**What the app does today:** it has no package importer. I found no zip or manifest handling in `index.html`; the only mention of a manifest is the web app manifest link, and the only `olib` is the name of the browser database. The package family waits for T7.3 (import a package), T7.4 (storage for packages), T7.5 to T7.7 (activity player and renderers) and T7.8 (resources).

## 7. C6: the diagnostic map (`diagnostic.json`)

**Defined:** `diagnostic-standards.md` section 7. Required for Standard and Full packages, optional for Quick. Fields: `schema` (`olib-diagnostic/1`), `course_id`, `adaptive`, `items` (each with `p`, `module`, `domain`, `skill`, `tier`, `parallel`, `misconception`) and, for early childhood only, `checklist`. Tier is `foundation`, `core` or `stretch` (difficulty 1, 2, 3 for the learner model). `skill` is a lowercase slug of at most 40 characters and is the unit of mastery the learner model will track. `parallel` names a practice-lab question that tests the same skill, for matched pre/post comparison. The skill's scoring bands per domain are: Needs support below 50%, Developing 50 to 79%, Strong 80% and above, shown only with at least three answered items in the domain.

**App today:** does not read the map. It uses the `Answers:` line and the domain codes only (section 5). The learner-model task T3.1 and the diagnostic-map task T7.9 depend on this contract.

## 8. C10: catalogue files and briefs

These are generator-side and people-side files. The app never imports them.

- `catalog/course-catalogue.csv`: one row per distinct title. Columns: `course_id`, `kind` (`course`, `project`, `milestone`, `placeholder`), `wave`, `mode`, `field_id`, `field_name`, `field_confidence`, `stage_level`, `credit_hours`, `hint_contact_hours`, `programmes`, `schools`, `levels`, `semester_min` and `semester_max`, `role_in_workbook`, `status`.
- `status` is a **build state**: `todo`, `drafted`, `validated`, `delivered` or `not-generated`. It is not the review state. The review state lives in each course's own metadata (`review_status`); see `docs/REVIEW-WORKFLOW.md`.
- Other files: `catalog/programme-courses.csv`, `catalog/prerequisites-inferred.csv` (only prerequisites inferred from numbered series, and labelled so), `catalog/data-quality.md` (the report the user reads; nothing is silently fixed), and `briefs/<course_id>.json` for the chosen waves.
- Waves: `0` is every course and project of the pilot programme; `1` is used in 10 or more programmes; `2` is 5 to 9; `3` is 2 to 4; `4` is exactly one programme; `P` is project templates outside the pilot; `X` is placeholders and milestones, never generated.
- Placeholders and milestones are never turned into courses. Programme status (for example "Proposed - not approved") travels through every roadmap and brief.

## 9. C8 and C9: category pack and roadmap pack

**Category pack.** A file `# Categories` with a Field/Value table (`pack_type` = `category`, `schema_version` = `1`) and a table `| ID | Name | Parent | Description |`. Rules the skill's validator applies: IDs are lowercase slugs and unique; **names are unique, ignoring case** (the library finds a course's category by ID or by name); every parent exists; no loops; at most 3 levels; every row has a description. A course's `category` metadata is the category Name.

**Roadmap pack.** A file may hold many `# Roadmap: <title>` blocks. Each has a Field/Value table (`pack_type` = `roadmap`, `id`, `version`, `region`, `programme_status`, and more), then one `## <level>` heading per level with a table `| Step | Course ID | Required | Covers | Note |`. Rules: unique slug `id`; semver-style `version`; at least one level and one step per level; steps numbered 1, 2, 3; Course ID is a lowercase slug; Required is `yes` or `no`; Covers is `all`, `Module N`, `mN` or a domain code `Dn`; a Course ID appears once per level; `programme_status` should be present. Placeholder slots and milestones are recorded in meta fields, never as steps. Career roadmaps keep extra guidance in the meta table (`early_titles`, `evidence_to_build`, `recognition_check` and others) because the app has no step types for portfolio, experience, registration or examination yet. Import order in the library: categories, courses, roadmaps.

**What the app reads today** (functions `parseCats` and `parseRoads`):

| Part | App |
|---|---|
| Category rows | Reads `ID`, `Name`, `Parent`, `Description`. A duplicate ID is a warning and the last one wins. The Field/Value rows (`pack_type`, `schema_version`) are not checked. |
| Roadmap block | Reads the `# Roadmap:` heading, then Field/Value rows into a meta table. The id is `slug(meta.id or title)`; `version` is read from the meta table. |
| `programme_status` and `region` | Kept in the meta table but **not used** for any decision or display that I found. |
| Levels | Reads each `## ` heading as a level, except a heading that starts with `Sources`, which the app ignores. |
| Steps | A row counts as a step only when the first cell is a number. The Course ID is lower-cased. **Required** is true when the cell starts with `y`, `yes`, `true` or `required`, and false for anything else. Covers defaults to `all`. |
| Lookup | A step is matched to a course by `courses.find(c => c.id === step.course)`, so it depends on the id of section 3. A step whose course is missing is shown as Missing and is not counted. |
| Covers | Module forms (`Module 3`, `m3`) are read. Domain codes `Dn`: **not checked.** |

The skill says the same about the percentage: it counts only courses that are in the library, so a roadmap can look more complete than it is (T1.1b added a count line for this).

## 10. Findings: where the two sides disagree today

These are statements of fact from reading, not decisions. None of them is fixed by this document. Each names who decides.

| # | Finding | Evidence | Matters for | Who decides |
|---|---|---|---|---|
| F1 | The app does not read the Library Data `course_id`. It uses `slug(title)`, with no collision suffix. For a course whose `course_id` is not the slug of its title, a roadmap step that names the skill's `course_id` shows as Missing. | `parseCourse` sets the id from the title; `applyLib` reads only the Course index. | T1.22, T7.14 | The owner and the T1.22 worker. Existing ids must not change. |
| F2 | The app takes a question's module from the index `Parent` column. Schema v1 leaves `Parent` empty for questions. | `applyLib` | T3.1, T3.5 | Lane A, with the skill's owner if the schema should change. |
| F3 | The app reads a `bloom` column that the v1 index does not have. Bloom tags are only in the reading text, which the app does not read. | `applyLib`; the schema addendum on Bloom tags | T3.5 | The owner (a schema change needs the importer and the skill changed together, as the skill says). |
| F4 | Course metadata (including `review_status`, `reviewed_by`, `programme_status`) is not read. Roadmap `programme_status` is stored but unused. | `applyLib`, `parseRoads` | T1.15, T7.15 | Already planned (T1.15, T7.15). |
| F5 | No schema version is checked on import. A category pack states `schema_version` 1; the roadmap pack has `pack_type` and a roadmap `version` but no schema version. | `parseCats`, `parseRoads` | T7.20b, every future schema change | The owner and the skill's owner (proposal 2 in section 11). |
| F6 | The app ignores a roadmap level named `Sources...`. Required values other than `y`, `yes`, `true`, `required` are read as `no`. The skill defines only `yes` and `no`. | `parseRoads` | T7.13 | Lane A. Low risk. |
| F7 | The skill adds `-2`, `-3` to colliding course IDs in the catalogue. The app's `slug` does not, so two titles that slug the same would collide in the app. | `slug`, catalogue rules | T1.22, T7.18 | T1.22 worker and the owner. |
| F8 | The app cannot import a package, so the skill's golden packages cannot be tested against it yet. | No zip or manifest handling in `index.html` | T7.20b | Waits for T7.3. |

## 11. Version rule and who declares what

The plan's rule (T7.20): a breaking change to a schema gets a new version number and a migration; the skill and the app each declare what they support. This document turns that into steps. **Everything in this section is a proposal** for the owner; nothing here is decided.

1. **One list.** This document is the list of contracts and versions (section 2). A change to any contract, on either side, updates this document in the same change.
2. **Every contract has a version string in the data.** Today C9 (roadmap pack), C7 (resource list) and C10 (catalogue files) have none. The skill's owner would add one (for example `schema_version` in the roadmap Field/Value table), and the app would ignore an unknown field until it supports it.
3. **The skill declares** the schemas it writes: `schema_version` in Library Data, `package_schema` in the manifest, `schema` in each activity file and in `diagnostic.json`, and `generator` in the metadata.
4. **The app declares** the versions it can read, in one place in the code, and shows a clear message for a version it cannot read ("This file uses a newer format"). Today it declares nothing and checks nothing (F5).
5. **What counts as breaking.** A new required field, a changed meaning of a field, a removed field or a changed ID rule is breaking and needs a new version number and a migration note. A new optional field that a current reader can ignore is additive. The skill's own schemas are additive by rule.
6. **Do not mix the two kinds of version.** `course_version` (MAJOR.MINOR) versions a course's content. `schema_version`, `package_schema` and the `olib-...` strings version a format. A MAJOR course change is not a schema change.
7. **How a change is announced.** A worker who finds a disagreement writes a `question` or `concern` entry in the hub, naming the contract number from section 2. The Coordinator forwards it to the owner. A contract change that touches stored data needs the owner's approval before merge, as the plan already requires for storage.
8. **Fixtures and CI** (T7.20b, later): the skill's golden packages and catalogue fixtures are imported with the app's importer in CI. This depends on T7.3 and is not part of this document.

## 12. Open questions

1. **`course_id`.** Should the app read the Library Data `course_id` and use it as the course id when present, keeping existing ids unchanged? (F1, T1.22.)
2. **Schema version for roadmaps.** May the skill add a `schema_version` field to the roadmap pack, and should the app start checking versions on import? (F5.)
3. **Question parent and Bloom column.** Is the intended fix on the skill side (fill `Parent` for questions, add a `bloom` column to the index) or on the app side (read what v1 writes today)? Either is a schema or importer change. (F2, F3.)
4. **Reviewed version.** `review_status` and `reviewed_on` do not say which `course_version` was reviewed. STATUS_v0015 asks the owner whether the generator should add a field such as `reviewed_version`. If yes, it is a Course Schema change (see `docs/REVIEW-WORKFLOW.md`, open question 7).
5. **Who owns this document** after v0.1: the Coordinator, the owner, or the lane D worker who made the last change to a contract?
6. **Statements marked not checked** (the "I don't know" button, the two-missed-items flag rule, the `Dn` form in Covers): to be checked when a code lane touches those functions.

## 13. Related tasks

T1.15 (provenance fields), T1.22 (course id), T3.1 (learner model), T7.1 and T7.2 (diagnostic key), T7.3 to T7.9 (package import, storage, player, resources, diagnostic map), T7.12 to T7.15 (categories, roadmaps, provenance display), T7.17 (catalogue data), T7.19 (`docs/REVIEW-WORKFLOW.md`), T7.20b (CI step). This list is advisory. The plan's Depends column is authoritative.
