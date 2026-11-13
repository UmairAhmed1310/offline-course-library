# Course review workflow

**Task:** T7.19 (Implementation Task Plan, Addendum A, Part D) · **Version:** 0.1 draft · **Date:** 2026-11-12
**Status:** proposed. Not yet triaged by the Coordinator or reviewed by the owner.

This document says how a generated course gets reviewed before the app may show it as reviewed. It defines who reviews, what they check, the four review states, and where the state is recorded. It does not change the app. The app shows the state later (T1.15, T7.15).

## 1. Rules that never change

1. Generated courses start as `not-reviewed`.
2. No course is shown as reviewed unless a named subject expert has reviewed it (plan decision D18, recommended default).
3. The state comes from the course's own metadata. If it is missing, the app says "Source not stated" and does not claim anything (T1.15).
4. No screen or text may suggest approval, accreditation or a licence unless the data says so (T7.15). A reviewed course is not an accredited course.
5. Course review state and programme status are different things. A roadmap can be "Proposed, not approved" (T7.13) while some of its courses are reviewed.

## 2. Who reviews

| Role | Who | Does what |
|---|---|---|
| Author | The person or process that generated or wrote the course | Fixes what the reviewer returns. Cannot mark their own course `reviewed`. |
| Reviewer | A named subject expert for the course's field (D18 default). The reviewer's name goes in the course metadata. | Works through the checklist in section 4 and sets the state. |
| Review coordinator | The owner, or whoever the owner names | Assigns reviewers, keeps the catalogue state current, and decides disputes. |

The plan does not say who the named experts are. D18 is not decided, and this document must be updated when it is.

## 3. States

| State | Meaning | Who sets it | Shown to learners as |
|---|---|---|---|
| `not-reviewed` | No review has started. Every generated course begins here. | Set when the course is created | "Not reviewed" |
| `in-review` | A reviewer has accepted the course and is working through the checklist, or has returned it to the author for changes. | Reviewer or review coordinator | "Review in progress" |
| `reviewed` | A named expert passed every checklist item for this version of the course. | Reviewer only | "Reviewed by <name>, <date>" |
| `rejected` | The reviewer found problems that cannot be fixed by small edits (for example, wrong content or unsafe material). | Reviewer | "Not approved for use" (never shown as a quality grade) |

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
| Accuracy | Facts, definitions, formulas and worked examples are correct and current. Answer keys are correct. Claims that sound like rules or laws are right for the stated region. |
| Sources | Sources are listed, real and relevant. Anything the course cannot source is marked as such. Resources marked verified have a verified date (T7.8). |
| Item quality | Each question has one defensible answer. Distractors are plausible, not trick wording. Explanations say why, and match the key. The diagnostic items test what the modules teach. Item difficulty is not mislabelled. |
| Accessibility | Text alternatives for images and charts. Reading level fits the stated audience. No meaning carried by colour or emoji alone. Activities that need dragging or timing have a keyboard or text alternative. |
| Safety | Nothing harmful, discriminatory or age-inappropriate for the stated audience. Practical tasks are safe to do. No personal data in examples. Advice that could cause harm (health, law, money, electrical or chemical work) is handled with care or removed. |

Where a course has activities, packages or simulations (Phase 7), the reviewer also checks that each one matches the lesson it belongs to. How much of that a human can check is left to the review coordinator.

## 5. Where the state is recorded

| Place | Field | Notes |
|---|---|---|
| Course metadata table (T1.15) | `status`, `reviewer`, `updated`, `version` | This is what the app reads. The reviewer's name and the date are part of the record. |
| Catalogue (T7.17) | the catalogue's `status` column | The plan says to keep this column current. It may already be used for generation status. See question 2 in section 8. |

The state recorded must always be for a specific `version` of the course. A state with no version is not valid.

## 6. When a course changes

- Any change to lesson text, questions, answer keys, resources or activities after a review means the course needs review again. Return it to `in-review` before showing it as `reviewed`.
- Typo-only changes: the reviewer may confirm them without a full re-run, and notes this in the record. The reviewer decides, not the author.
- A re-import that changes modules or questions (T1.6) is a new version and follows the same rule.

## 7. Scale and sampling

- Pilot (T7.16): every course gets a subject-expert review, and the review state is recorded.
- Later waves (T7.18): the plan asks for at least 10% of each wave to be reviewed by an expert. Courses that were not sampled stay `not-reviewed`. They are not "reviewed by sampling".
- A rate of `rejected` or failed items across a sample is a signal to fix the generator and its standards. Record the finding with the review notes.

## 8. Open questions

1. **Status vocabulary.** T1.15 lists `ai-generated`, `review-pending` and `teacher-verified`. T7.19 lists the four states above. Addendum A4 says to use the generator's `review_status`, whose values were not available to me. This document proposes this mapping, to be confirmed:

   | T7.19 state | T1.15 status |
   |---|---|
   | `not-reviewed` | `ai-generated` |
   | `in-review` | `review-pending` |
   | `reviewed` | `teacher-verified` |
   | `rejected` | no match; the app would need a new value |

   "Teacher-verified" is narrower than "reviewed by a subject expert". Pick one set of words.
2. **Catalogue `status` column.** Is it the same thing as review state, or generation state?
3. **Who are the named experts, and who coordinates?** D18 is not decided.
4. **Reviewer independence.** This document says the author cannot mark their own course reviewed. Confirm.
5. **Re-review rule.** Section 6 returns any content change to `in-review`. Confirm, or set a lighter rule for small changes.

## 9. Related tasks

T1.15 (provenance metadata), T7.15 (status shown in the app), T7.16 and T7.18 (pilot and waves), T7.17 (catalogue data), D18 (who reviews). This list is advisory. The plan's Depends column is authoritative.
