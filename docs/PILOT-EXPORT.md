# Pilot results file: format specification

**Task:** T6.7s revision 2 (Implementation Task Plan, Phase 6) · **Version:** 0.2 draft · **Date:** 2026-11-20
**Status:** proposed, for review before T6.7 builds anything. It replaces v0.1 (never merged, never built). Not yet triaged by the Coordinator.

This document fixes the format of the small file that a learner exports on purpose and hands to the pilot lead, so that the pilot evaluation (`docs/EVALUATION.md`) can compute improvement (METRICS M6), recall retention (M7b), completion (M2, M3, M3b) and, at week level, return (M4, M7a). It is a specification. It changes no code. T6.7 builds the export (builder in lane A, button and consent text in lane B, owner approval before merge).

Anything marked **Proposal** is a choice made by this document because no earlier document or decision gives a value. Section 13 lists what a reviewer must confirm. Nothing marked Proposal is decided.

**What changed from v0.1** (owner answers of 2026-11-20, recorded in the Coordinator's triage 0022):

| Point | v0.1 | v0.2 |
|---|---|---|
| Pilot course list | Open question | Decided by the owner: the course ids of a roadmap marked as a pilot roadmap. Section 5 says how, after reading the app and the skill. With no pilot roadmap on the device the export is not offered. |
| Activity | A list of study days | Week level only: `first_active_on`, `active_weeks` (Mondays), `returned_d7`, `returned_d30` (section 4.6). The device works out the return flags by the METRICS rule. Off switch kept, default on. |
| M5 (revision completion) | Open question | Out of the v1 file. Reported as "not measured in this pilot". |
| Exit questions 3 and 4, pilot code format | Proposals | Kept, and accepted as proposals until the pilot lead is named. |
| Names | Placeholders | The owner's placeholder forms (section 8.1). A gate: no Stage B enrolment before the pilot lead is named and the ethics answer is known (section 8.4). |
| Format id | `olib-pilot-results/1` | Stays `olib-pilot-results/1` (section 3). |
| Limits | 1 to 10 courses, 100 KB | 1 to 60 courses, 200 KB (the pilot roadmap may hold about 34 courses). |
| New fields | none | `pilot.roadmap_id`, `pilot.roadmap_version`. |

**Dependencies, stated plainly.** The file is made from data that the app does not store today (per-answer events, topic mastery, retention checks, the list of active days). It needs T3.2, T3.3 and T6.2 first. `docs/LEARNER-MODEL.md` v0.1 (T3.1) defines the mastery figure and the list of days (`days`); it is submitted but **not merged yet** (Batch 4), so this document cites it as "LEARNER-MODEL v0.1, pending merge". `docs/CONTRACTS.md` v0.1 (T7.20a) is in the same position. Statements about the app are from reading `index.html` (the Drive mirror at 8f1e287f; the file is unchanged since 181219dc) and METRICS section 1.1. The app was not run.

## 1. Purpose and what this file is not

**Purpose.** One file per learner, produced on the learner's device, carrying only numbers, codes and dates. The learner looks at it, chooses to save it, and gives it to the pilot lead themselves.

**It is not:**

| Not this | Why |
|---|---|
| The class progress file of T5.4 | That file holds the plan's safe subset plus already-stored dates and per-topic summaries, with no raw event logs (owner, 2026-11-13). It has no pre/post figures or retention counts, so it cannot answer the pilot questions. The two files are separate and have separate formats. |
| Analytics (T6.3) | Nothing is sent. Analytics stay off and opt-in (D7, plan default). |
| A backup (T1.9) | A backup restores a learner's progress. This file cannot be restored from. |
| A record of learning content | See section 6. |

## 2. Principles

1. **Closed list.** The file has exactly the fields in section 4. A field that is not listed is not allowed, and a reader rejects the file (section 9). Privacy comes from what the format cannot hold, not from a promise.
2. **Numbers, codes and local dates only.** No course text, no question text, no answers, no names, no free text, no exact times.
3. **Manual and visible.** The learner presses a button, sees a plain-language summary of what is in the file, and saves it. The app does not send it anywhere (EVALUATION section 7.4).
4. **Raw counts, not only derived figures.** The file carries counts (`n`, `correct`) next to each mastery figure so that the analysis can recompute and check it, and so that METRICS principle 6 ("show the count behind every figure") holds.
5. **Same estimator both sides (METRICS M6).** The "before" figure and the "after" figure use the same formula (LEARNER-MODEL v0.1, section 6).
6. **Only pilot courses.** The file holds figures for the courses of the pilot roadmap and nothing about any other course on the device, including days studied (sections 4.6 and 5).
7. **Coarse where the measure allows.** Activity is week level, not day level (section 4.6).

## 3. File basics

| Item | Value (Proposal) |
|---|---|
| Format | JSON, UTF-8, no byte order mark. Numbers as JSON numbers. |
| Name | `olib-pilot-<pilot code>-<exported_on>.json`, for example `olib-pilot-P7K3QX9-2027-03-08.json`. The name carries no title or person. |
| Format id | `"format": "olib-pilot-results/1"`. **It stays `/1` in v0.2** (Proposal): v0.1 was never built or merged, so no file in that shape exists. From the first build on, the major number changes when a field is removed or its meaning changes, and the reader refuses an unknown major number. A later addition such as M5 would be `/2`. |
| Dates | Local calendar dates as `YYYY-MM-DD`. No time and no time zone (METRICS principle 4 and section 7 rule 4). |
| Fractions | Decimals with at most 4 places (0.8251), between 0 and 1. |
| Size | About 1.5 KB per course with figures, and under 0.5 KB for a course that is imported and not yet started. A pilot roadmap of about 34 courses stays under about 50 KB. |
| One file per export | A later export replaces an earlier one. `exported_on` and `seq` (a counter that starts at 1) tell which is newer. |

## 4. Fields

### 4.1 Top level

| Field | Type | Meaning |
|---|---|---|
| `format` | string | `"olib-pilot-results/1"` |
| `spec` | string | `"docs/PILOT-EXPORT.md v0.2"` (the spec the app followed) |
| `seq` | integer, 1 or more | Export counter on this device for this pilot code |
| `exported_on` | date | The learner's local date of the export |
| `pilot` | object | See 4.2 |
| `courses` | array, 1 to 60 | One entry per pilot course that the learner has imported (4.3) |
| `activity` | object, optional | 4.6 |
| `exit` | object, optional | 4.7 |

### 4.2 `pilot`

| Field | Type | Meaning |
|---|---|---|
| `code` | string | The pilot code the pilot lead gave the learner, entered on the consent screen. Letters A to Z and digits only, 6 to 12 characters (accepted as a proposal until the pilot lead is named). It identifies no one except through the pilot lead's separate list. |
| `stage` | `"A"` or `"B"` | Stage A is the usability pilot (5 to 8 learners), Stage B the learning pilot (about 45; provisional). Chosen on the consent screen from what the pilot lead told the learner (section 5). |
| `roadmap_id` | string | The id of the pilot roadmap (section 5). A roadmap id is a catalogue label, not course content. |
| `roadmap_version` | string | The roadmap's `version` text (for example `0.1.0`), or an empty string if it has none. |
| `cohort_week` | date | The Monday of the week in which the learner first imported a pilot course (METRICS principle 5). |
| `consent_on` | date | The date the learner accepted the consent screen in the app (section 8). It does not replace the pilot lead's own consent record. |
| `consent_text` | string | The version id of the consent text the learner saw, for example `"c1"`. It comes from the app build (the text is part of T6.7). The text itself is not in the file. |

### 4.3 `courses[]`

One entry for each pilot course (section 5) that the learner has imported. A course that is imported and not started has `first_module_done_on` null, `diagnostic` null and empty `topics` and `retention`.

| Field | Type | Meaning |
|---|---|---|
| `course_id` | string | The app's course id (`slug(title)` today). A course id is not course content. It is included only for pilot courses (section 5). |
| `run` | integer | The learner's current attempt number of the course |
| `imported_on` | date | When the course was imported (METRICS M1 to M3) |
| `first_module_done_on` | date or null | The date the first module was done, or `null` (M2) |
| `modules_total` | integer | Modules in the course |
| `modules_done` | integer | Modules done in the current attempt (M3b counts a course whose `modules_done` equals `modules_total`) |
| `last_module_done_on` | date or null | The date of the most recent module done |
| `completions` | array | One `{ "run": n, "on": date }` for each attempt the app's own completion record marks as complete (METRICS M3). Empty if none. |
| `diagnostic` | object or null | 4.4. `null` if the learner never took the diagnostic (counted as "left out", EVALUATION 4.2). |
| `topics` | array | One entry for each topic (course domain) the learner has at least one counted answer in (4.5) |
| `retention` | array | Recall checks done (4.5) |

### 4.4 `diagnostic`

Records the learner's **first** diagnostic, even if it was retaken (METRICS M6 notes; LEARNER-MODEL v0.1 section 8).

| Field | Type | Meaning |
|---|---|---|
| `first_on` | date | Date of the first diagnostic |
| `items` | integer | Items in it |
| `correct` | number | Sum of the item scores (0, 0.5 or 1 each; LEARNER-MODEL section 4) |
| `attempts` | integer | Diagnostic attempts made (needs the event log from T3.2) |
| `approx` | boolean | `true` if the first diagnostic was taken before the app logged attempts, so the baseline is the latest one (LEARNER-MODEL section 8) |

### 4.5 `topics[]` and `retention[]`

A topic is the course domain, `General` when a question has none (LEARNER-MODEL section 2).

`topics[]` entry:

| Field | Type | Meaning |
|---|---|---|
| `topic` | string | The domain code, such as `D1`. No topic name or description. |
| `pre` | object | The "before" figure: `{ "n": integer, "correct": number, "mastery": number or null }`. Computed from the first diagnostic's answers as they stood on the diagnostic date. `mastery` is `null` if `n` is below 3 (the M6 rule). |
| `post` | object | The "after" figure at export: `{ "n": integer, "correct": number, "mastery": number or null, "band": string or null }`. `n` and `correct` count every counted answer ever (LEARNER-MODEL section 5, fields `n` and `correct`). `mastery` is the LEARNER-MODEL figure read on `exported_on`. `band` is `"needs-support"`, `"developing"` or `"mastered"`, or `null` if `n` is below 3. |
| `matched` | object, optional | Only if the course has a diagnostic map with parallel items (T7.9): `{ "pairs": integer, "pre_correct": integer, "post_correct": integer }`. Raw accuracy on matched pre and post items, so that the estimator question does not arise (METRICS M6, variant for packages). `pairs` is the number of pairs where both items were answered. |

`retention[]` entry (METRICS M7b; T6.2):

| Field | Type | Meaning |
|---|---|---|
| `topic` | string | The domain code |
| `horizon` | 7 or 30 | Days after the topic was mastered |
| `on` | date | The date of the check |
| `n` | integer | Items asked (five by definition; fewer if the pool was small) |
| `correct` | integer | Items answered correctly |

Retention is counted per check. A check not taken has no entry. It is a missing value and not a failure.

### 4.6 `activity` (optional, week level)

The owner decided (2026-11-20) that study activity is kept at **week level**, with an off switch. The file holds no list of days.

| Field | Type | Meaning |
|---|---|---|
| `first_active_on` | date or null | D0: the learner's first **active day** on or after the date of the first pilot import. `null` if the learner has had no active day yet. |
| `active_weeks` | array of dates | The Mondays of the Monday-to-Sunday weeks (local calendar) that hold at least one active day, ascending, no duplicates, from the week of `first_active_on` to the week of `exported_on`. Empty if `first_active_on` is null. Answers M4. |
| `returned_d7` | boolean or null | Return after 7 days (M7a): at least one active day in days 7 to 13 after D0 (D0 is day 0). `null` until the window has closed (below). |
| `returned_d30` | boolean or null | The same for days 30 to 36 after D0. |

**Active day.** A local day with a meaningful event: a recap attempt, five reviewed cards, or a finished module (METRICS section 3, and the `days` list of LEARNER-MODEL v0.1 section 5). **For the pilot file, only events in pilot courses count** (Proposal). METRICS counts activity in any course; here a day on which the learner studied only a personal or private course must not appear, even as a week, so the file does not leak that. The consequence: M4 and M7a from this file are "pilot-course" figures, and the report must say so (section 10).

**D0.** The first active day on or after the first pilot import. METRICS says "the learner's first active day"; this document states the pilot reading, because the file starts at the pilot import.

**The device works out the two flags.** M7a counts days from D0. Monday-to-Sunday weeks do not line up with day offsets from D0, so `returned_d7` and `returned_d30` cannot be recomputed from `active_weeks`. The app computes them from the day-level data that stays on the device (the active-day list of the learner model) by the METRICS rule, then writes only the result. T6.7 must test this with fake clocks across a daylight-saving change (section 11).

**When the window is closed (Proposal).** The Coordinator's brief says `null` until `exported_on` is at least 13 days after D0 (36 days for D30). This document uses **14 and 37 days**, because day 13 (or day 36) is the last day of its window and an export made on that day could be followed by a later active day the same day, which would turn a recorded `false` into a wrong answer. In date terms:

- `returned_d7` is `null` while `exported_on` is less than 14 days after `first_active_on`. When the window has closed it is `true` if any active day falls in days 7 to 13, and `false` otherwise.
- `returned_d30` is `null` while `exported_on` is less than 37 days after `first_active_on`. When closed, it is `true` if any active day falls in days 30 to 36, and `false` otherwise.
- A later export (higher `seq`) replaces an earlier one, so a `null` is filled in by the next export. This follows METRICS principle 5 (do not read a cohort before its window has closed). If the Coordinator prefers 13 and 36, the change is two numbers here and in section 9, and the example in section 7 still holds.

**Switch.** The learner can turn `activity` off on the summary screen (default on). If it is off the whole `activity` object is left out, and M4 and M7a are missing for that learner (section 10).

### 4.7 `exit` (optional)

The answers to the structured exit questions of EVALUATION section 4.5. Free text is never in the file. These two questions as optional fixed choices are **accepted as proposals until the pilot lead is named** (owner, 2026-11-20).

| Field | Type | Meaning |
|---|---|---|
| `studied_elsewhere` | `"yes"`, `"no"` or `null` | Question 3: studied the same topics elsewhere during the pilot |
| `would_use_again` | `"yes"`, `"maybe"`, `"no"` or `null` | Question 4 |

Questions 1 and 2 (which courses were stopped and why; what was unclear, wrong or too hard) are not in the file. Question 1 can be worked out from `completions` and `modules_done`. Question 2 is free text, and EVALUATION section 4.5 says it is not sent automatically. The pilot lead collects it on a separate form.

## 5. Which courses are in the file

**Owner decision (2026-11-20).** The pilot courses are the courses of a roadmap marked as a **pilot roadmap**. The marker is used only if it needs no change to the roadmap format; otherwise a small pilot setup list is used. Hidden, private and non-pilot courses are never included. The summary screen lists the included courses by title. With no pilot roadmap (or setup) on the device, the export is not offered.

### 5.1 Can a roadmap carry a marker without a format change? Yes

What I read (reading only; nothing was run):

| Where | What it shows |
|---|---|
| `index.html` (mirror at 8f1e287f; unchanged since 181219dc), function `parseRoads` | After a `# Roadmap:` heading, every row of the Field/Value table before the first `##` heading is stored as `meta[<field>] = <value>`. There is no list of allowed fields, and no field is rejected or warned about. `Field` header rows are skipped. |
| the same file, the roadmap import commit | The whole parsed roadmap, `meta` included, is put into the library list `S.roads`, replacing a roadmap with the same `id`, and the library is saved. The roadmap export writes every `meta` key back. So an extra row is kept, stored and exported. |
| the skill: `references/catalog-and-roadmaps.md` section 4, and `scripts/validate_catalog.py` (the roadmap checks) | The validator checks `pack_type`, `id`, `version` and `programme_status` (or `status`) and the levels and steps. It does not flag any other meta row. The skill itself already puts extra rows in the meta table (`placeholder_slots`, `milestones` and the career-guidance fields), so extra rows are an established use. |
| the skill: `scripts/workbook_to_packs.py` (the roadmap writer) | It writes `roadmaps/pilot.md`, "the pilot programme as a roadmap". Its block is the same as the programme's block in the school file, with the **same `id`**. It writes no `pilot` row today. |
| `docs/CONTRACTS.md` v0.1 section 9 (mine, not merged) | Says the same about `parseRoads`: `programme_status` and `region` are kept and not used. |
| sor `Claude_2504_C1__0016` (T1.9a, the submitted entry; **I did not read the patch**) | The backup cleaners keep only listed fields and drop unknown keys, and a test guards the parser's course, section, question and diagnostic keys. Whether the cleaners keep unknown keys inside a roadmap's `meta` is **not known to me**. |

**Conclusion.** A marker row needs no change to the roadmap format, to the app's parser, or (as far as the validator's rules show) to the skill's validator. Two things do need action: the skill must put the row in (by hand, or a small change to the converter, which is the skill owner's decision), and T6.7 must make sure the T1.9a cleaners keep it (below).

### 5.2 The marker (Proposal)

One row in the roadmap's Field/Value table:

```text
| pilot | yes |
```

- A roadmap is a **pilot roadmap** if its `meta.pilot` is `yes`, ignoring case and spaces. Any other value, or no row, means it is not.
- The pilot lead gives the learner the pilot roadmap file (the programme's roadmap with this row added), the pilot code and the stage. The pilot code, the stage and the consent text id are not in the roadmap. They come from the consent step (section 8.1).
- **Give the pilot roadmap its own `id`** (for example the programme id followed by `-pilot`), not the programme's id. The import commit replaces a roadmap with the same `id` as a whole, `meta` included. If the learner later imported the programme's own roadmap file (same id as the skill's `pilot.md` writes), the marker would be lost without notice and the export would disappear. With its own id the two can coexist.
- If the device holds more than one pilot roadmap, the consent screen asks the learner to choose which one this file is for. The file covers one pilot roadmap.
- The marker row is visible to anyone who opens the file. It holds no personal data.

**Fallback: a pilot setup list** (used only if the marker cannot be used, for example if the T1.9a cleaners cannot keep it or the skill owner objects). A small JSON file from the pilot lead: `{ "stage": "B", "consent_text": "c1", "roadmap_id": "...", "courses": ["course-id", ...] }`, no other keys, imported once on the consent step and stored with the library. Source: the pilot lead, handed to the learner with the pilot code. This adds a stored field, so it needs the same cleaner change as below. T6.7 builds one of the two, not both.

### 5.3 Which courses go in the file (Proposal)

A course is in `courses[]` only if **all** of these are true:

1. Its course id is the Course ID of a step in the pilot roadmap (any level; required or not).
2. The learner has imported it, and it is visible to the active profile. The roadmap screen's own lookup is `S.courses.find(c => c.id === id && vis(c))`, so a hidden or private course is "missing" for the roadmap (I did not read `vis`).
3. The learner has not hidden it and has not made it private (owner decision, 2026-11-13: such courses never leave the device, and their course id does not leave either).

A course that fails any test is left out **entirely**: no entry, no count of left-out courses, no hint that it exists. Personal and other courses on the device never appear, and their events do not count in `activity` (section 4.6).

**When the export is offered.** Only if a pilot roadmap is on the device **and** at least one of its courses passes the tests. Otherwise the button is not shown (or says "no pilot course on this device yet"); the learner can still use the app.

**The summary screen** lists the included courses **by title**, on the screen only. Titles are never in the file.

### 5.4 What T6.7 must do for the backup cleaners

T1.9a (owner-approved, merging soon) drops any stored field it does not list. A new roadmap key, or a new stored setup list, must be added to the cleaners **in the same PR as T6.7**, with a test that a pilot roadmap survives a backup and restore with its marker (section 11). Its drift guard watches the parser's course keys, not roadmap meta, so nothing will fail on its own if this is forgotten.

## 6. What is never in the file

| Never | Where this is stated |
|---|---|
| Course text, module text, question or option text, the diagnostic, the answer key | METRICS section 7 rule 3; EVALUATION 7.3 |
| The learner's answers (which option was chosen) | The same |
| Names, emails, ages, dates of birth, device or install identifiers | EVALUATION 7.3 (pilot code only) |
| Free text of any kind | The same |
| Exact times and time zones | METRICS section 7 rule 4 |
| Raw event logs (the `log` of LEARNER-MODEL section 5) | Owner, 2026-11-13: no raw event logs in v1 |
| Question ids, or per-question results | Not needed. Per-topic counts are enough, and a question id is a handle on content. |
| Hidden and private courses, including their ids | Owner, 2026-11-13 |
| Anything about a course not in the pilot roadmap, including days studied only in such a course | Sections 4.6 and 5 |
| Confidence ratings, response times and XP, badges and streak lengths | Not pilot measures (METRICS principles 1 and 2) |

## 7. Worked example

This is an **invented** file, with an invented course, roadmap and dates (a Monday cohort week in 2027). It is for the T6.7 tests and for reading practice. It does not describe a real learner.

The learner answered three diagnostic items in `D1` and `D2` on the first day and two in `D3`. Later answers in each topic (by day of the study period) are in the note under the file.

```json
{
  "format": "olib-pilot-results/1",
  "spec": "docs/PILOT-EXPORT.md v0.2",
  "seq": 1,
  "exported_on": "2027-03-08",
  "pilot": {
    "code": "P7K3QX9",
    "stage": "B",
    "roadmap_id": "ug-example-pilot",
    "roadmap_version": "0.1.0",
    "cohort_week": "2027-02-01",
    "consent_on": "2027-02-01",
    "consent_text": "c1"
  },
  "courses": [
    {
      "course_id": "intro-networking",
      "run": 1,
      "imported_on": "2027-02-01",
      "first_module_done_on": "2027-02-07",
      "modules_total": 8,
      "modules_done": 6,
      "last_module_done_on": "2027-03-06",
      "completions": [],
      "diagnostic": {
        "first_on": "2027-02-01",
        "items": 8,
        "correct": 4,
        "attempts": 1,
        "approx": false
      },
      "topics": [
        {
          "topic": "D1",
          "pre": { "n": 3, "correct": 1, "mastery": 0.375 },
          "post": { "n": 17, "correct": 13, "mastery": 0.8251, "band": "mastered" },
          "matched": { "pairs": 3, "pre_correct": 1, "post_correct": 3 }
        },
        {
          "topic": "D2",
          "pre": { "n": 3, "correct": 2, "mastery": 0.625 },
          "post": { "n": 12, "correct": 10, "mastery": 0.7752, "band": "developing" }
        },
        {
          "topic": "D3",
          "pre": { "n": 2, "correct": 1, "mastery": null },
          "post": { "n": 8, "correct": 6, "mastery": 0.7912, "band": "developing" }
        }
      ],
      "retention": [
        { "topic": "D1", "horizon": 7, "on": "2027-03-01", "n": 5, "correct": 4 }
      ]
    }
  ],
  "activity": {
    "first_active_on": "2027-02-01",
    "active_weeks": ["2027-02-01", "2027-02-15", "2027-03-01"],
    "returned_d7": false,
    "returned_d30": null
  },
  "exit": { "studied_elsewhere": "no", "would_use_again": "yes" }
}
```

**How the numbers in the example arise** (LEARNER-MODEL v0.1 section 6: half-life 14 days, a prior of one answer at 0.5, at least 3 answers; read on day 35, `exported_on`):

| Topic | Answers (day: right/asked) | `pre` | `post` |
|---|---|---|---|
| D1 | day 0: 1/3; day 6: 3/4; day 20: 5/6; day 33: 4/4 | 3 answers, 1 right: (1 + 0.5) / (3 + 1) = 0.375 | 17 answers, 13 right; faded: 0.8251, "mastered" |
| D2 | day 0: 2/3; day 8: 4/4; day 30: 4/5 | 2/3 gives 0.625 | 12 answers, 10 right: 0.7752, "developing" |
| D3 | day 0: 1/2; day 12: 2/3; day 31: 3/3 | only 2 answers: `mastery` is `null` | 8 answers, 6 right: 0.7912, "developing" |

The values were computed by running the formula of LEARNER-MODEL v0.1 section 6 in a scratch script. The T6.7 tests should recompute them from the stated answers.

**How `activity` arises.** The learner's active days in pilot courses (device data, not in the file) were 2027-02-01, 02-03, 02-07, 02-21 and 03-06. D0 is 2027-02-01. The Mondays of those days' weeks are 02-01 (for 02-01, 02-03 and 02-07), 02-15 (for 02-21, a Sunday) and 03-01 (for 03-06, a Saturday). Days 7 to 13 after D0 are 02-08 to 02-14: none is active, and the window has closed (the export is 35 days after D0, more than 14), so `returned_d7` is `false`. Days 30 to 36 are 03-03 to 03-09: 03-06 is active, but the export (03-08, day 35) is less than 37 days after D0, so the window has not closed and `returned_d30` is `null`; a later export would give `true`. This example uses both a `false` and a `null` on purpose.

**Reading the example (M6).** `D3` is skipped (no baseline). `D1` improves by 0.8251 − 0.375 = 0.4501 and `D2` by 0.7752 − 0.625 = 0.1502. The learner's mean over the two topics is 0.3002 (about 30 percentage points), from 2 topics. The matched variant for `D1` reads 1 of 3 right before and 3 of 3 after. **Reading M7b:** one recall check at 7 days: 4 of 5. **Reading M2:** the first module was done on 2027-02-07. **M3:** no completion (`completions` is empty), but 6 of 8 modules are done, so M3b is "not finished". **Reading M4 and M7a:** the learner was active in 3 weeks (the weeks starting 02-01, 02-15 and 03-01) and did not return in days 7 to 13; the return after 30 days is not yet known.

## 8. What the learner sees (consent and the summary screen)

The button, the screens and their wording belong to lane B in T6.7, with the pilot lead's consent text. This section fixes **what the screens must say and show**, so that the file's contents match what the learner agreed to.

**8.1 Consent screen (shown before the pilot starts and before any file is made).** The screen also asks for the **pilot code** and the **stage** (A or B) that the pilot lead gave the learner, and shows the id of the consent text (`consent_text`). The wording below is a **draft** for the pilot lead to adapt. It is not legal advice and does not replace the university's form. Items in square brackets are not decided; the three names use the owner's placeholder form (2026-11-20):

- pilot lead: [NAME, ROLE, CONTACT or "to be named by DATE"]
- product lead contact: [NAME]
- ethics contact: [NAME, OFFICE or "to be named by DATE"]

> **Share your pilot results (optional)**
> You can save a small file with your results and give it to [pilot lead: NAME, ROLE, CONTACT] yourself. The app does not send it anywhere.
> **What is in the file:** a pilot code (not your name), for each pilot course the topics you practised with how many answers you gave and how many were right, before and after; the dates you started and finished modules; short recall checks; and, if you leave it on, the weeks you studied and whether you came back after 7 and after 30 days.
> **What is not in the file:** your name or email, the course text, the questions, your answers, anything you typed, the exact time, any course you hid or made private, any other course on your device, or any study you did in those other courses.
> **Who sees it:** [pilot lead: NAME] and [evaluation team]. Questions: [product lead contact: NAME]; [ethics contact: NAME, OFFICE]. Results are only reported for groups of [5] or more. They are used to improve the library and the courses, not to judge you.
> **How long it is kept:** [until the evaluation report is accepted, then deleted; university may set another rule].
> **You can say no** or stop at any time. Saying no has no effect on your marks, attendance or standing. You can ask for your file to be deleted.
> [If you are under 18, a parent or guardian must also agree. The pilot lead records this outside the app.]

The app records only that consent was accepted, the date, and the id of the text shown (`consent_on`, `consent_text`). It does not know who the learner is. The pilot lead records consent outside the app (EVALUATION 7.2).

**8.2 Summary screen (shown every time before the file is saved).** The learner sees, in plain language and before saving: the pilot code; each included course with its topics and the before and after figures; the recall checks; the dates; and the exit answers. The courses are listed **by title** (titles are on the screen only; the file has course ids). A switch labelled "the weeks I studied, and whether I came back" (`activity`) is shown on this screen, **on by default**; when it is off, the file has no `activity` object at all. A learner can also choose "Don't save". Nothing is saved to the device's files until the learner presses "Save".

**8.3 After saving.** The screen tells the learner the file name and says how to hand it over (the pilot lead names the way: for example by email, a class upload, or a memory stick), and how to withdraw and have the file deleted. The app does not delete the pilot lead's copy. The pilot lead does.

**8.4 Gate before Stage B (owner, 2026-11-20).** **No Stage B enrolment until the pilot lead is named and the ethics answer (research or programme evaluation) is known.** The ethics answer may change what may be collected, and then this specification changes. The names stay as placeholders in the consent text until then. Stage A (the usability pilot of 5 to 8 learners) is not under this gate, but follows EVALUATION section 7.1 for anything beyond it.

## 9. How a reader checks the file

A reader is the analysis script of the evaluation, or a later class view. The T6.7 builder has the same checks as a unit test on its own output.

1. **Parse** as JSON. Refuse a file larger than 200 KB.
2. **Format.** `format` must be `olib-pilot-results/1`. Refuse any other major number.
3. **Closed list.** Every key in the file must be one in section 4. An unknown key means the file is **refused**, not partly read. (A later minor change adds keys by raising the format number.)
4. **Types and ranges.** Dates are real calendar dates in `YYYY-MM-DD`. `correct` is not above `n`. Fractions are between 0 and 1. `horizon` is 7 or 30. `band` agrees with `mastery` (below 0.5, 0.5 to below 0.8, 0.8 and above). `mastery` is `null` exactly when `n` is below 3.
5. **Order.** `imported_on` is not after `first_module_done_on`, which is not after `last_module_done_on`, which is not after `exported_on`. `cohort_week` is a Monday and is not after the first `imported_on`. `courses` holds 1 to 60 entries.
6. **Nothing that looks like content.** Reject any string value longer than 40 characters, and any string field outside its list (`stage`, `band`, `exit` answers). The only free strings are `code`, `course_id`, `topic`, `consent_text`, `roadmap_id` and `roadmap_version`.
7. **Duplicates.** One entry per `course_id`; one entry per `topic` within a course. If two files have the same `pilot.code`, keep the one with the higher `seq`, then the later `exported_on`.

8. **Activity (week level).** If `activity` is present: `active_weeks` are real Mondays, in ascending order, with no duplicates, none before `cohort_week` and none after the Monday of the week of `exported_on`. If `first_active_on` is a date, its own Monday is the first entry of `active_weeks`, and `first_active_on` is not before `cohort_week` and not after `exported_on`. If `first_active_on` is `null`, `active_weeks` is empty and both flags are `null`. `returned_d7` is `null` exactly when `exported_on` is less than 14 days after `first_active_on`, and `returned_d30` exactly when it is less than 37 days after. A `true` flag needs at least one entry in `active_weeks` on or after the Monday of D0 plus 7 days (D7) or plus 30 days (D30). A `false` flag cannot be checked from the file, and the reader does not try.

A refused file is reported to the pilot lead with the reason. The reader does not repair it.

## 10. How the evaluation reads it

This follows `docs/METRICS.md` v0.2 and `docs/EVALUATION.md` and adds no new definition, with one stated difference for M4 and M7a (pilot-course days only).

| Measure | From the file |
|---|---|
| M6 improvement | For each topic with `pre.mastery` and `post.mastery` both not null: `post.mastery − pre.mastery`. A learner's figure is the mean over those topics; the report gives the number of topics and learners. If `diagnostic.approx` is true, flag the figure. Where `matched` is present, report matched pre and post raw accuracy (`pre_correct` and `post_correct` out of `pairs`) separately. Learners with `diagnostic` of `null`, or no topic with both figures, are counted as left out. |
| M7b R7 and R30 | Sum `correct` and `n` over `retention` entries with the same `horizon`, across learners: R7 = total correct ÷ total asked. Report the number of checks and learners behind each. A learner with no entry is a missing value. |
| M2 | `first_module_done_on` set, within 7 and within 30 days of `imported_on`, per cohort week. |
| M3 | A `completions` entry with `run` equal to 1, per learner-course. Later runs are reported separately (METRICS question 9). |
| M3b | `modules_done` equal to `modules_total`, whether or not a completion is recorded. |
| M1 | `imported_on` and (`diagnostic.first_on` or `first_module_done_on`) within 24 hours: **not available at day precision**, because the file holds dates and not times. M1 is therefore reported as "same day" and labelled so. |
| M4 | Learners with `activity.active_weeks` that includes a given Monday, per week. **A pilot-course figure**: it counts only activity in the pilot courses (section 4.6), so it can be lower than METRICS M4 for the same learners. Label it so. A learner with `activity` off, or `null`, is missing. |
| M7a | `returned_d7` and `returned_d30`: learners with `true` ÷ learners whose flag is not `null`, per cohort week (METRICS principle 5: a `null` flag is a window not closed, and is left out, not counted as a failure). The same pilot-course note applies. A learner with `activity` off is missing. |
| M5 | **Not measured in this pilot** (owner, 2026-11-20). The review schedule is not exported. M5 may be added in format `/2` later. |
| Exit | Counts of each answer. |

**Small groups.** The reader publishes a figure only for a group of at least 5 learners (owner, 2026-11-13; provisional, revisited in the T5.5 ADR). With a small pilot, publish totals only and say n. A group is a cohort week, a course, or any other split. The rule is applied by the reader, not by the file.

**Re-identification.** A pilot of 5 to 8 learners with dates in the file could be identified by someone who knows the class. So the raw files stay with the pilot lead and the evaluation team; no per-person result is published or shown to a teacher without that learner's consent (EVALUATION 7.6); the list linking codes to people is kept apart from the files; and the report uses aggregates.

**A class view (T5.4).** The class view reads the class progress file, not this one. A pilot results file given to a class view is refused (different `format` id). If a pilot class view is wanted later, it reads this format by the rules of section 9 and shows only groups of at least 5.

## 11. What T6.7 must test

T6.7 owns its tests. This is the list the spec requires, so that the builder cannot drift from it.

1. The example in section 7 passes every check in section 9.
2. A file with one extra key is refused. A file with a `text`, `title` or `answers` key is refused.
3. A hidden course and a private course are absent, with no trace (no entry, no count, no id), and so is a course that is not a step of the pilot roadmap.
4. No string longer than 40 characters is in the output.
5. `n`, `correct` and `mastery` match LEARNER-MODEL's fixtures (F1 to F9) when built from the same answers.
6. `pre` is built from the first diagnostic after a second diagnostic is taken, and `approx` is true when only seeded events exist.
7. A date is a local date near midnight and across a daylight-saving change (fake clocks).
8. Withdrawing consent or choosing "Don't save" writes no file.
9. No network request is made during the export.
10. A reset of a course keeps `topics` (LEARNER-MODEL: a reset keeps `lm`) and starts a new `run`.
11. **Marker.** A roadmap with `pilot` = `yes` (also `Yes` and ` yes `) is a pilot roadmap; one with `no`, another value, or no row is not. With no pilot roadmap, or a pilot roadmap and no imported pilot course, no export is offered.
12. **Marker survives.** A pilot roadmap's `meta.pilot` survives a backup and restore (T1.9a functions) and an export and re-import of roadmaps. T6.7 extends the T1.9a cleaners in the same PR if it does not (section 5.4).
13. **Own id.** Importing the programme's roadmap file does not remove the pilot roadmap, because the pilot roadmap has its own `id` (section 5.2). Importing a roadmap with the same id as the pilot roadmap and no marker removes the export offer; the test checks that this is visible to the learner and does not produce a file.
14. **Activity flags.** The device computes `first_active_on`, `active_weeks`, `returned_d7` and `returned_d30` from day-level active days by the METRICS rule. Cases: no active day (all `null`); activity only in a non-pilot course (counts nothing); a window that has not closed gives `null`, and the same data a day later gives the right value; D0 day 13 and day 14 boundaries; a week that crosses a daylight-saving change; and the example of section 7.
15. **Switch.** With the switch off, the file has no `activity` key at all.
16. **Stage and code.** The code and stage come from the consent step; they are not read from the roadmap.

## 12. Edge cases

| Case | What the file does |
|---|---|
| Learner skipped the diagnostic | `diagnostic` is `null`. Topics may still carry `post`; `pre` has `n` 0 and `mastery` null. |
| Topic with fewer than 3 answers after the diagnostic | `mastery` and `band` are `null`; the counts are still given. |
| Topic with no counted answer | Not listed. |
| Course imported, nothing else done | `first_module_done_on` null, `diagnostic` null, `topics` empty, `retention` empty. The course is still listed. |
| No active day in a pilot course yet | With `activity` on: `first_active_on` null, `active_weeks` empty, both flags null. |
| Activity only in other courses | Counts nothing. The file does not show that other study happened. |
| Export before a return window closes | The flag is `null`. A later export fills it in. |
| Pilot roadmap replaced by an import with the same id and no marker | The export offer disappears. Nothing is sent or lost; the learner can import the pilot roadmap file again. |
| More than one pilot roadmap on the device | The consent screen asks which one the file is for. |
| Several attempts of a course (reset) | `run` is the current attempt. `completions` lists every attempt the completion record marks complete. The topic figures cover all answers, because a reset keeps the learner model. |
| Two profiles on one device | The export is for the active profile only. The pilot code is per learner (METRICS principle 3). |
| Learner exports twice | The later file replaces the earlier (`seq`). |
| The learner changes the pilot code | Not allowed in the app after the first export (Proposal): the code is entered once, in the consent step. |
| Clock set wrongly on the device | Dates will be wrong. The ordering checks in section 9 catch some cases only. The pilot lead is told. |

## 13. Open questions for the reviewer

**Closed by the owner (2026-11-20, triage 0022):** the pilot course list (a roadmap marked as a pilot roadmap; section 5), week-level activity with an off switch (section 4.6; was question 4), M5 out of the v1 file (section 10; was question 5). **Accepted as proposals until the pilot lead is named:** the exit questions 3 and 4 as optional fixed choices (was question 6) and the pilot code format of 6 to 12 letters and digits (was question 2).

Still open:

1. **The marker row and its source.** This document proposes `| pilot | yes |` in the roadmap's Field/Value table, with its own roadmap id. It needs no roadmap format change (section 5.1), but the skill's converter does not write it. Does the skill owner add it (for example a `--pilot` option on `workbook_to_packs.py`), or does the pilot lead add the row by hand? This touches the generator-skill questions that STATUS carries (a roadmap `schema_version`).
2. **The T1.9a cleaners and roadmap `meta`.** I did not read the T1.9a patch, so I do not know whether it keeps unknown keys inside a roadmap's `meta`. T6.7 must check this and extend the cleaners in the same PR (section 5.4). If the cleaners cannot keep the marker, the fallback is the pilot setup list (section 5.2).
3. **Window closing: 13 and 36 days, or 14 and 37.** The Coordinator's brief says 13 and 36. This document uses 14 and 37 (section 4.6), so that an export on the last day of a window cannot record a wrong `false`. Confirm which.
4. **Pilot-course days only.** Activity counts only events in pilot courses (section 4.6), so M4 and M7a are pilot-course figures and can differ from METRICS. Confirm, or accept that the file would otherwise show a week of study in a personal course.
5. **Stage on the consent screen.** The learner picks stage A or B from what the pilot lead said. Should the pilot lead put the stage in the pilot code (a code that starts with `A` or `B`) so the learner cannot choose wrongly? That is a format decision for the pilot lead.
6. **Which courses count.** Every distinct Course ID in the pilot roadmap, required or not (section 5.3, Proposal). Confirm.
7. **Matched pairs.** `matched` is optional and needs T7.9. Is the pilot expected to have any course with matched items? If not, M6 uses mastery on both sides, and EVALUATION 4.2 says to label the comparison weaker.
8. **Minimum group size.** 5 is provisional (owner, 2026-11-13). This spec applies it in the reader only. If the T5.5 ADR changes it, section 10 changes and the file does not.
9. **Names and the ethics answer.** The pilot lead, product lead contact and ethics contact are placeholders (section 8.1). **No Stage B enrolment until the pilot lead is named and the ethics answer is known** (section 8.4). The answer may change what may be collected, and then this spec changes.
10. **EVALUATION.md edits.** The merged EVALUATION v0.2 needs edits to agree with this revision (task T6.6c). The list is in the submitted entry for this revision.
11. **Code-checked facts.** Sections 5.1 and the "stored today" statements depend on `index.html` at 8f1e287f (the same file as 181219dc) and METRICS section 1.1 (checked at 4a260700). T1.9a, T1.12 and T3.2 change how progress is stored; check again before T6.7 starts. The skill facts are from the skill files in `agent-hub/sources/` (version as in Drive; not run).
12. **Approvals.** T6.7 needs the owner's approval before merge (STATUS). This document does not replace that.

## 14. Related tasks

T1.9 (backup; separate), T3.1 to T3.3 (`docs/LEARNER-MODEL.md`: events and mastery), T5.4 (class progress file; separate format), T5.5 (backend ADR, minimum group size), T6.1 and T6.1b (`docs/METRICS.md`), T6.2 (retention checks), T6.3 (opt-in analytics; not used), T6.4 and T6.5 (dashboard and item analysis; they may read this format later), T6.6, T6.6b and T6.6c (`docs/EVALUATION.md`), T6.7 (the export itself), T7.9 (diagnostic map, matched items), T7.16 (the pilot programme). Decisions D5, D7, D15. This list is advisory. The plan's Depends column is authoritative.
