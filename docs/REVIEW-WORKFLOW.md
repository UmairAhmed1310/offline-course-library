# Course review workflow

**Task:** T7.19b (follow-up to T7.19, Implementation Task Plan, Addendum A, Part D) · **Version:** 0.2 draft · **Date:** 2026-11-17
**Status:** proposed. Replaces v0.1 (merged, accepted). The owner's answers of 2026-11-17 and the facts from the course generator's own documents are applied (section 8). Not yet triaged by the Coordinator.

This document says how a generated course gets reviewed before the app may show it as reviewed. It defines who reviews, what they check, the four review states, and where the state is recorded. It does not change the app. The app shows the state later (T1.15, T7.15).

**Where the facts come from.** The field names, values and rules in sections 3 and 5 come from the generator skill (mastery-course-builder, version 0.7.0), file `references/course-schema-v1.md` (Part A1 and the table "Implementation notes"), as listed in STATUS_v0013 (T7.19b row) and LANES_v0011 (item 3) and confirmed by the owner. I checked them against that file on 2026-11-17. Anything this document says beyond the skill (the checklist, the roles, the learner labels, the re-review rule) is a proposal.

## 1. Rules that never change

1. A generated course starts as `not-reviewed`, with `reviewed_by`, `reviewed_on`, `signature` and `content_hash` empty.
2. The generator never changes the review state. A human does (the reviewer, section 2).
3. No course is shown as reviewed unless a named subject expert has reviewed it (plan decision D18, recommended default).
4. The state comes from the course's own metadata (its Library Data). If it is missing, or has a value this document does not list, the app shows no claim about review (T1.15).
5. No screen or text may suggest approval, accreditation or a licence unless the data says so (T7.15). A reviewed course is not an accredited course.
6. Course review state and programme status are different things. A roadmap can be "Proposed - not approved" (`programme_status`, T7.13) while some of its courses are reviewed.
7. The catalogue `status` column is a build state, not a review state. It must never be used as the review record (section 5).

## 2. Who reviews

| Role | Who | Does what |
|---|---|---|
| Author | The person or process that generated or wrote the course | Fixes what the reviewer returns. Cannot mark their own course `reviewed`. |
| Reviewer | A named subject expert for the course's field (D18 default). The reviewer's name goes in `reviewed_by`. | Works through the checklist in section 4 and sets the state. |
| Review coordinator | The owner, or whoever the owner names | Assigns reviewers, keeps track of which courses are in which state, and decides disputes. |
| Publisher (later) | A human who signs off a published course | Fills `signature` and `content_hash` with a tool once such a step exists. Reserved; see section 5. |

Who the named experts are is not decided. D18 stays at the plan default: **the owner names the experts at T7.16 step 1.** This document must be updated when they are named.

## 3. States

The four values are exactly these strings, written like this in the data: `not-reviewed`, `in-review`, `reviewed`, `rejected`. They are the values of the field `review_status`.

| State | Meaning | Who sets it | Shown to learners as (proposed) |
|---|---|---|---|
| `not-reviewed` | No review has started. Every generated course begins here. | Set when the course is generated | "Not reviewed" |
| `in-review` | A reviewer has accepted the course and is working through the checklist, or has returned it to the author for changes. | Reviewer or review coordinator | "Review in progress" |
| `reviewed` | A named expert passed every checklist item for this version of the course. | Reviewer only | "Reviewed by <name>, <date>" (from `reviewed_by` and `reviewed_on`) |
| `rejected` | The reviewer found problems that cannot be fixed by small edits (for example, wrong content or unsafe material). | Reviewer | "Not approved for use" (never shown as a quality grade) |

The labels are proposals for T1.15 and T7.15. The values are not.

Allowed moves:

- `not-reviewed` → `in-review`
- `in-review` → `reviewed`, `rejected`, or back to `not-reviewed` if the reviewer withdraws
- `rejected` → `not-reviewed` once the author has produced a new version
- `reviewed` → `in-review` when the course content changes (see section 6)

Nothing goes straight from `not-reviewed` to `reviewed`.

## 4. Checklist

A course can be `reviewed` only when every item passes. The reviewer records pass, fail or not applicable, with a short note for every fail.

| Area | What the reviewer checks |
|---|---|
| Accuracy | Facts, definitions, formulas and worked examples are correct and current. Answer keys are correct. Claims that sound like rules or laws are right for the stated region (`jurisdiction`). |
| Sources | Sources are listed, real and relevant. Anything the course cannot source is marked as such. Resources marked verified have a verified date (T7.8). |
| Item quality | Each question has one defensible answer. Distractors are plausible, not trick wording. Explanations say why, and match the key. The diagnostic items test what the modules teach. Item difficulty is not mislabelled. |
| Accessibility | Text alternatives for images and charts. Reading level fits the stated audience. No meaning carried by colour or emoji alone. Activities that need dragging or timing have a keyboard or text alternative. |
| Safety | Nothing harmful, discriminatory or age-inappropriate for the stated audience. Practical tasks are safe to do. No personal data in examples. Advice that could cause harm (health, law, money, electrical or chemical work) is handled with care or removed. The course's `risk_profile` is read first, and a higher-risk course gets the closer look. |

Where a course has activities, packages or simulations (Phase 7), the reviewer also checks that each one matches the lesson it belongs to. How much of that a human can check is left to the review coordinator.

## 5. Where the state is recorded

The review state lives in **each course's own metadata** (its Library Data). That is what the app reads (T1.15).

| Field | Role in review | Who fills it |
|---|---|---|
| `review_status` | One of the four states in section 3 | Starts `not-reviewed` from the generator; then a human |
| `reviewed_by` | Name of the reviewer | A human; empty until `reviewed` |
| `reviewed_on` | Date of the review | A human; empty until `reviewed` |
| `course_version` | The version of the course the state applies to | The generator and the author |
| `ai_generated` | Always `yes` for a generated course | The generator |
| `generator` | The skill and version that wrote the course (for example `mastery-course-builder 0.7.0`) | The generator |
| `generated_on` | Date the course was generated (`YYYY-MM-DD`) | The generator |
| `signature` | **Reserved.** A human publisher fills it later. Empty today. | Not filled now |
| `content_hash` | **Reserved.** A tool fills it later. Empty today. | Not filled now |
| `last_verified` | Date the generator last verified the content (`YYYY-MM-DD`). This is not a review date. | The generator |
| `valid_as_of` | Date the content is stated to be valid for. Required for high-stakes or fast-changing courses. | The generator |
| `jurisdiction` | Where the content applies. Required for high-stakes courses. Used in the Accuracy check. | The generator |
| `risk_profile` | `none`, or a list of `high-stakes`, `contested`, `fast-changing`. Used in the Safety check. | The generator |

`reviewed_by` and `reviewed_on` are the only review fields a human fills today. `last_verified` is set by the generator and must never be shown as "reviewed".

Rules:

- The state recorded is always for a specific `course_version`. A state that cannot be tied to a version is not valid.
- `signature` and `content_hash` are not proof of anything today. No screen may present them as proof (T1.15).
- The generator's validator has a `--fresh` flag. It checks that a newly generated course has `review_status` = `not-reviewed` and empty `reviewed_by`, `reviewed_on`, `signature` and `content_hash`. It is for new courses only. A course that a human has reviewed would fail `--fresh` by design, so the flag must not be run on reviewed courses.
- `course_id` is stable across all versions of a course; `course_version` is `MAJOR.MINOR`. MAJOR changes when modules, objectives or questions change meaning; MINOR is for fixes and wording.

**Do not use the catalogue `status` column as the review record.** In the catalogue (T7.17) that column is a build state with the values `todo`, `drafted`, `validated`, `delivered` and `not-generated`. A course can be `delivered` and still `not-reviewed`. `programme_status` (for example "Proposed - not approved") is a third, separate field and is not a review state either.

If the project wants a list of review states by course in one place (for example, for the pilot report), it is made from the courses' own metadata, not from the catalogue column.

## 6. When a course changes

- Any change to lesson text, questions, answer keys, resources or activities after a review means the course needs review again. A changed course has a new `course_version`; return it to `in-review` before showing it as `reviewed`.
- Typo-only changes: the reviewer may confirm them without a full re-run, and notes this with the record. The reviewer decides, not the author.
- A re-import that changes modules or questions (T1.6) is a new version and follows the same rule.
- When `content_hash` is filled in some day, a hash that no longer matches the content means the `reviewed` state no longer holds. That rule is for later and is not in force now.

## 7. Scale and sampling

- Pilot (T7.16): every course gets a subject-expert review, and the review state is recorded. The owner names the review experts at step 1.
- Later waves (T7.18): the plan asks for at least 10% of each wave to be reviewed by an expert. Courses that were not sampled stay `not-reviewed`. They are not "reviewed by sampling".
- A rate of `rejected` or failed items across a sample is a signal to fix the generator and its standards. Record the finding with the review notes.

## 8. Decisions and open questions

Answered (owner, 2026-11-17, as recorded in STATUS_v0012 and STATUS_v0013):

1. **Status vocabulary: decided.** The plan's words in T1.15 (`ai-generated`, `review-pending`, `teacher-verified`) are replaced by the skill's real fields and values (section 5). v0.1's mapping table is removed. The words `review-pending` and `teacher-verified` do not appear in the data.
2. **Catalogue `status` column: answered.** It is a build state, not a review state (section 5).

Still open:

3. **Who are the named experts, and who coordinates?** Plan default (D18): named subject experts per field, and no course is shown as reviewed without one. The owner names the experts at T7.16 step 1. Nothing changes in this document until then.
4. **Reviewer independence.** This document says the author cannot mark their own course `reviewed`. Not yet confirmed by the owner.
5. **Re-review rule.** Section 6 returns any content change to `in-review`. Not yet confirmed. The skill's own version rule (MAJOR for changes of meaning, MINOR for fixes and wording) could support a lighter rule: a MINOR change might keep `reviewed` if the reviewer confirms it. That is a choice for the owner; nothing is set.
6. **Who can set `rejected`, and can a course go from `rejected` straight to `in-review`?** v0.1 requires a new version first (section 3). Not yet confirmed.
7. **Which `course_version` does a review cover?** `reviewed_on` records a date, not a version. Section 5 says the state is tied to a `course_version`; the data has no field that records which one the reviewer saw. Until `content_hash` is used, the review coordinator keeps that link outside the course (for example in the review notes). Needs a decision before T1.15 shows "Reviewed by" on a card.

Answered by the skill's schema (2026-11-17): what `--fresh` checks (section 5).

## 9. Related tasks

T1.15 (provenance fields and labels), T7.15 (status shown in the app), T7.16 and T7.18 (pilot and waves), T7.17 (catalogue data), T7.20a (contracts), D18 (who reviews). This list is advisory. The plan's Depends column is authoritative.
