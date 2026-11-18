# Metrics and event dictionary

**Task:** T6.1, follow-up T6.1b (Implementation Task Plan, Phase 6) · **Version:** 0.2 draft · **Date:** 2026-11-16
**Status:** the Coordinator has triaged v0.1, and the owner's answers of 2026-11-13 are applied (section 8). Owner review of this version is pending.

This document defines what the Offline Course Library should measure, how each number is calculated, where the data comes from, and what must be protected. It is a definition document. It does not add any logging or analytics to the app.

**Changes from v0.1**

- The owner's answers are recorded in section 8: hidden and private courses never leave the device, a minimum group size of 5 (provisional), class files without raw event logs in v1, D7 and D5 at the plan defaults, and both retention metrics kept.
- Section 1.1 is new. It lists the dated records the app keeps on the device today, checked against the code of `index.html`. "Available today" lines now follow it.
- M3 now means the app's own completion record. "Every module done" is reported beside it (M3b).
- M6 compares like with like: the diagnostic baseline and the later mastery use one estimator.
- The numbering of the open questions matches the question entry for v0.1, and the sample course is question 8.

## 1. What is measured today

Nothing is measured outside the learner's own device. The app is offline-first, has no server and no online accounts (profiles live only on the device), and stores progress per profile in the browser's IndexedDB. The owner has set decision D7 to the plan's default: analytics are off and opt-in only. T6.3 (opt-in analytics) has not been built.

So every aggregate number below (across learners, groups or a class) needs one of these sources first:

| Source | Plan task | What it can supply |
|---|---|---|
| The learner's own device | T6.2 | The learner's own figures only, computed from the event log. |
| Teacher's Class view | T5.4 | Figures from imported per-profile progress files. Owner decision (2026-11-13): a file holds the plan's safe subset (progress, badges, XP), plus dates the app already stores and per-topic summaries, and no raw event logs in v1. So the Class view can show completion, dates and topic summaries. Event-based figures (M4, M5, M7a, M7b) are out of its reach until a later version. Whether M6 can be shown depends on what the per-topic summaries hold, which T5.4 decides. |
| Opt-in product analytics | T6.3 (D7: off, opt-in) | Anonymous, consented events sent in batches. |
| Server-backed groups | T5.6 to T5.11 (after the T5.5 ADR) | Group and peer metrics. |

### 1.1 What the app stores on the device today

**How this was checked.** On 2026-11-16 I read `index.html` from the Drive mirror. It is 72802 bytes with SHA-256 `44aea7087fca3a9f0052b98bf7a60f3473b881f87485e590f850a53d36ced8ff`, which is the value RELEASE_v0014 gives for `index.html` at main commit `4a260700c4572a3fce223f0272aeeba193910f79`. I searched the file for the places where each field is written. I found no network call (`fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`) in this file, and the progress is kept through IndexedDB. The service worker `sw.js` was not read. I did not run the app, run the tests or open a browser, so this is a reading of the code and not a test of behaviour. Other files were not compared. Names below are the code's own names, so a later change to the code can make this table out of date.

Per learner and course (`cp`, kept per profile):

| Field | What it holds | Written when | Kept or lost |
|---|---|---|---|
| `imported` (on the course record) | Time of the latest import. | Every import commit sets it, including a re-import of the same course. | Overwritten by a re-import, so the first-import time is not kept. |
| `done[module]` | The module is done now. | A recap scored 80% or more, or "Mark as done". "Mark as not done" removes it. | Cleared by a course reset. |
| `dt[module]` | Time the module was first done. | Set once, the first time the module becomes done. | Kept when the module is later marked not done. Cleared by a course reset. |
| `rec[module]` | Best recap score and number of tries. No date. | Each recap attempt. | Cleared by a course reset. |
| `att[]` | Practice-test attempts only: time, correct, total, judge version, level, attempt number (`run`). Recap attempts are not in it. | Each practice test (a test with no module scope). | Kept by a course reset. |
| `diag` | The latest diagnostic only: time, correct, total, the ids of the missed items and the flagged topics. | Each diagnostic submit. | Overwritten by a retake. Deleted by a course reset. Per-topic counts are not stored, but for the latest attempt they can be worked out from the missed ids and the `dom` of each diagnostic item in the stored course. |
| `rv[module]` | Review stage, next due time and last review time, for the module. Latest review only. The ladder is 1, 3, 7, 14 and 30 days. | When a flashcard session on a finished module is completed. | Overwritten each time. Cleared by a course reset. |
| `ach[]` | A completion record: time, attempt number, stars, best practice-test score. | After a recap or a practice test is submitted, when every module is done and the best practice-test score in the current attempt is 80% or more. Once per attempt. | Kept by a course reset. |
| `seen[]` | Keys of the questions the learner has seen. No dates, no correctness. | Each submit. | Cleared by a course reset. |
| `run` | The attempt number of the course. | A course reset adds one. | Kept. |

**Not stored today:** a "module opened" event, any history of reading positions (T2.1 will add only the last position), per-answer correctness, the date of a recap attempt, the history of reviews, active days, and the first diagnostic after a retake.

**What follows for the metrics.**

- Completion (M2, M3) can be read from a device today, with dates, because `dt` and `ach` are dated.
- Anything that needs a history (M4, M5, M7a, M7b, and the first-diagnostic baseline of M6) needs the event log (T3.2).
- A course reset clears most of this, and a re-import overwrites `imported`. A cohort figure must say which one it uses (see M2 and M3).
- A course reset clears the per-attempt fields (`done`, `dt`, `rec`, `seen`, `rv`, `diag`) and keeps `att` and `ach`. Metrics that cross a reset must use `run`.

Where this document describes things the app does not do yet (events, groups, retention checks), those come from the plan.

## 2. Principles

1. **Measure learning and return visits, not time in the app.** Minutes spent, session length and clicks are not metrics. The plan says time in the app is not the primary metric.
2. **XP, badges and streak lengths are not metrics.** They are rewards and can be tuned. The measures below do not change when XP values change.
3. **Learner means one profile.** The app has no accounts. One person with two profiles counts twice, and one shared device with several people counts as several learners. Central analytics (T6.3) would count installs through an anonymous random ID, which is a different unit. State the unit next to every published number.
4. **Local calendar.** Days and weeks use the device's local date. Weeks run Monday to Sunday, the same as the weekly quests (T4.4) and the weekly leaderboard (T5.1). Rules that depend on a date must survive daylight-saving and month changes (tested with fake clocks, T4.2).
5. **Cohorts, with time to mature.** Report outcomes by the week a learner started (the cohort week). Do not read a cohort until the longest window it needs has passed (for example 30 days for 30-day retention), or late finishers are counted as failures.
6. **Show the count behind every figure.** Report the number of learners (n) and the number of items behind each rate. A rate on a handful of learners is not a finding.

## 3. Terms

| Term | Meaning |
|---|---|
| Learner | One profile on one device (see principle 3). |
| Learner-course | One learner and one course. Most course metrics are counted per learner-course. |
| First course | The first course a learner's profile imports. |
| Sample course | The example course from `examples/sample-course.md`, which T2.8 will let a learner load with one tap. Report it separately (see section 8, question 8). |
| Module | A numbered module of a course. Part 0 (the About text and the diagnostic) is not a module. |
| Module done | The module's gate is met: the recap is passed at 80% or more, or, for a module with no scored questions, the learner pressed "Mark as done" (T1.2). Passing by test-out (T3.6) also counts. |
| Meaningful event | A recap attempt, five reviewed cards, or a finished module. This is the T4.2 rule for an active day, reused so that the metrics and the streak agree. |
| Active day | A local calendar day with at least one meaningful event. |
| Topic | The course domain (`dom`), or the `Skill` value when the course has one (T3.1). |
| Cohort week | The Monday-to-Sunday week in which the learner-course (or learner) started. |

## 4. Summary of the metrics

| # | Metric | Unit | Window | Needs |
|---|---|---|---|---|
| M1 | Activation | Learner | 24 hours after first import | `course_imported`, `diagnostic_completed` or `module_opened` |
| M2 | First-module completion | Learner-course | Cohort, reported at 7 and 30 days | `course_imported`, `module_completed` |
| M3 | Course completion rate (with M3b, modules finished) | Learner-course | Cohort, reported at 30 and 90 days | `course_imported`, `course_completed` |
| M4 | Weekly active learners | Learner | One week | Meaningful events (T3.2, T4.2) |
| M5 | Revision completion | Review item | One week | Review schedule, `review_done` |
| M6 | Assessment improvement | Learner-course-topic | Diagnostic to now | `answer` events, T3.3 mastery |
| M7a | Return retention, D7 and D30 | Learner | Week 2 and week 5 after first active day | Active days |
| M7b | Recall retention, R7 and R30 | Learner-topic | 7 and 30 days after mastery | `retention_check_done` (T6.2) |
| M8 | Group challenge participation | Group member | One challenge | Group events (T5.8, T5.9) |
| M9 | Peer contribution | Learner | One week | Peer events (T5.11) |

"Retention" appears in T6.1 without saying which kind. This document defines both M7a and M7b, and the owner has decided that both stay (section 8, question 1).

## 5. Metric definitions

### M1. Activation

- **Question answered:** after importing a first course, does the learner actually start?
- **Definition:** a learner is activated when, within 24 hours of the first-course import, they complete the diagnostic or open a module (Part 0 does not count).
- **Formula:** activation rate = learners with an activating event at most 24 hours after `t0` ÷ learners whose first course was imported in the period. `t0` is the time of that first import.
- **Cohort:** the cohort week of `t0`.
- **Data source:** `course_imported`, `diagnostic_completed`, `module_opened`.
- **Available today:** partly, and only for the diagnostic route. The latest diagnostic time (`diag`) and the latest import time (`imported`) exist (section 1.1). A "module opened" event is not recorded. The plan adds `lastPos` in T2.1, which holds the last position, not a history. Neither time is a first-event time if the course was re-imported or the diagnostic retaken.
- **Privacy:** needs only dates and event names, no content. Use the 24-hour window on timestamps taken from the device clock, and accept that a changed clock can distort it.
- **Notes:** the plan says "first lesson or diagnostic". "Lesson" is not an app term, so this document reads it as "a module opened" (section 8, question 2). Report with and without the sample course.

### M2. First-module completion

- **Definition:** the first module of a course (the lowest-numbered module) is done.
- **Formula:** first-module completion = learner-courses whose first module is done ÷ learner-courses imported in the cohort week. Report the share done within 7 days of import and within 30 days of import.
- **Data source:** `course_imported`, `module_completed` (with the module number).
- **Available today:** partly. The date a module was first done is stored (`dt`, section 1.1), and it is kept if the module is later marked not done. The import date is the time of the latest import, so "within 7 days of import" is right only for a course that was imported once. A course reset clears `dt`.
- **Privacy:** dates and module numbers only.
- **Notes:** this is the measure behind the Phase 2 exit check ("finish Module 1 without help" with at least five people). A course reset, or a re-import where the learner chooses "Reset progress" (T1.6), clears progress, so count a learner-course once, from its first import.

### M3. Course completion rate

- **Definition:** the app's own record of a completed course. Every module is done, and a practice test of 80% or more has been scored in the same attempt (`run`) of the course. This is the condition behind the "Course completed" message and the Achievements page, so a figure from this document agrees with what the learner sees.
- **Formula:** completion rate = learner-courses with a completion record in their first attempt ÷ learner-courses imported in the cohort week. Report at 30 days and 90 days after import.
- **Secondary line, M3b (modules finished):** learner-courses whose every module is done, whether or not the practice test was passed, over the same denominator and windows. The gap between M3b and M3 is the learners who finished the modules but did not take, or did not pass, the practice test. Report both and say which is which.
- **Data source:** `course_imported`, `course_completed`. On a device today, the completion record (`ach`) and the module records (`done`, `dt`).
- **Available today:** yes, on the learner's own device, with dates (section 1.1). `ach` is written once per attempt and kept when the course is reset. For M3b, take the date of the last module to be first done from `dt`.
- **Privacy:** dates and event names only.
- **Notes:**
  - "Every module is done" includes modules marked done by hand (a module with no scored questions is finished that way) and, later, modules passed by test-out (T3.6). The recap-passed rule is the usual way, not the only way.
  - The Course Master badge is described in the plan (T4.3) as "course completed". It should use the same record. Check this when T4.3 is built.
  - A course reset starts a new attempt and keeps `ach`. Count the first attempt for the cohort rate and report later attempts separately. This is a proposal (section 8, question 9).
  - Leave out removed courses and report the sample course separately. A re-import that changes the modules (T1.6) starts a new course version. Count against the version the learner finished, and say so.

### M4. Weekly active learners

- **Definition:** learners with at least one active day in the week.
- **Formula:** weekly active learners = distinct learners with one or more active days in the Monday-to-Sunday week. Also report weekly active learners ÷ learners who were active in any earlier week.
- **Data source:** meaningful events from the event log (T3.2). The active-day rule is T4.2's.
- **Available today:** no for history. Some dated records exist (`dt`, `att`, `ach`, `diag`, and the last review time in `rv`), but recap attempts have no date and only the latest review per module is kept, so active days cannot be rebuilt from today's data (section 1.1). A learner's own device can count them reliably only once events are logged.
- **Privacy:** an anonymous install ID plus a local date. No names.
- **Notes:** the unit depends on the source (profile on a device, install in analytics). Calm mode (T4.8) hides rewards and does not change what counts as active.

### M5. Revision completion

- **Definition:** of the review items that were due, how many were reviewed.
- **Formula:** revision completion = items reviewed in the week ÷ items due in the week. An item is due in the week when its due date is on or before the end of the week and it was not reviewed before the week began. Early or extra reviews of items not yet due are not counted.
- **Data source:** the review schedule (the 1/3/7/14/30-day ladder) and `review_done` events with the rating Got it, Partly or Again.
- **Available today:** partly. The schedule is per module (T3.8 moves it to per card). Each module has its stage, next due time and last review time (`rv`), for the latest review only. So "due now" can be counted today, but a weekly history of reviews done ÷ due cannot, because reviews are not logged as events.
- **Privacy:** counts and dates only. Never include card text.
- **Notes:** "Again" counts as reviewed, because this metric is about doing the revision, not about success. Recall success is a separate figure. An item that stays overdue is counted again in each later week, so the measure shows the backlog as well.

### M6. Assessment improvement

- **Definition:** how much better a learner does on a topic now than on the diagnostic.
- **Formula:** improvement(topic) = mastery now − baseline(topic). Both sides use the same estimator: the topic mastery of T3.3 (recency-weighted accuracy with a small prior, at least 3 answers). The baseline is that same calculation applied to the diagnostic answers as they stood on the diagnostic date. Report the mean over the topics that have both values, with the number of topics and learners.
- **Why one estimator:** the plan words it as "later score minus diagnostic score on the same topics". Mastery in T3.3 is shrunk toward a prior and weights recent answers, and raw diagnostic accuracy (correct ÷ items) is not. A difference of the two mixes the estimators, and the prior alone can show a gain or a loss that is not learning. If a baseline can only be raw accuracy, label the figure "mixed estimator" and do not publish it as improvement.
- **Variant for packages:** when the course has matched parallel items (`diagnostic.json`, T7.9), compare matched pre and post items and report the counts. This avoids the estimator question, because both sides are raw accuracy on matched items.
- **Data source:** `diagnostic_completed` (items and correct answers by topic) and `answer` events.
- **Available today:** partly for the baseline, and no for mastery. The latest diagnostic is stored: totals, the ids of the missed items and the flagged topics. Per-topic counts can be worked out for that attempt from the missed ids and the `dom` of each diagnostic item in the stored course. A retake overwrites it and a course reset deletes it, so the first diagnostic is not kept today. Per-answer correctness is not stored, so mastery needs T3.2 and T3.3.
- **Privacy:** topic names and numbers only. No question text, no answers.
- **Notes:** use the learner's first diagnostic as the baseline, even if the diagnostic is retaken (T3.6). For that, every diagnostic attempt must be logged (T3.2), because the stored record is overwritten. Learners who skip the diagnostic cannot be measured, so say how many were left out. Diagnostics are short (the sample has three items), so topic baselines are coarse. A baseline needs at least three answers, so skip topics below that.

### M7a. Return retention (D7 and D30)

- **Definition:** does the learner come back to study?
- **Formula:** let `D0` be the learner's first active day. D7 retention = learners with at least one active day in days 7 to 13 after `D0` ÷ learners with a `D0` in the cohort week. D30 uses days 30 to 36.
- **Data source:** active days.
- **Available today:** no for history (see M4 and section 1.1).
- **Privacy:** an anonymous install ID plus local dates.
- **Notes:** the window is a full week, not a single day, because spaced revision is scheduled on days 1, 3, 7, 14 and 30 and learners rarely study on one exact day (section 8, question 3). Read a cohort only after its window has closed.

### M7b. Recall retention (R7 and R30)

- **Definition:** does the learner still remember what they mastered?
- **Formula:** recall retention at 7 days = correct answers ÷ items asked in retention checks run about 7 days after the topic was mastered. R30 is the same at about 30 days. A retention check is a short quiz of five items the learner answered correctly earlier (T6.2).
- **Data source:** `retention_check_done`.
- **Available today:** no. It depends on T6.2.
- **Privacy:** topic and counts only.
- **Notes:** report the number of checks behind each rate. A learner who does not take the check is a missing value, not a failure.

### M8. Group challenge participation

- **Definition:** members who took part in a shared challenge.
- **Formula:** participation = members who contributed at least one qualifying activity during the challenge ÷ members of the group at the challenge start. Also report whether the collective target was reached (yes or no).
- **Data source:** `group_challenge_joined`, `group_challenge_contribution`.
- **Available today:** no. Group challenges need the backend (T5.9, after the T5.5 ADR).
- **Offline stand-ins (Phase 5A):** the team goal across profiles on one device (T5.1) and challenge codes (T5.2). Participation can be measured on one device, but codes sent to other devices cannot be counted without a server.
- **Privacy:** show individual contribution to the group, and never rank by default (T5.9). Audience limits apply: no social features for the youngest audiences (T7.10).

### M9. Peer contribution

- **Definition:** learners who help each other in peer Q&A.
- **Formula:** peer contribution rate = learners who posted at least one answer in the week ÷ weekly active learners in groups with Q&A switched on. Helpful rate = answers marked helpful ÷ answers posted.
- **Data source:** `peer_post` events (kind: question, answer, helpful mark).
- **Available today:** no. This needs the backend and moderation (T5.11).
- **Privacy:** count posts and marks only. Never copy post text into analytics. Leave out posts that were removed or reported.

## 6. Event dictionary (proposed)

These are candidate events. None is implemented. T3.1 and T3.2 own the learner-model event schema, and T6.3 owns what is ever sent off the device. If they differ, they win, and this table should be updated. "Planned" means the plan already describes the event. "Proposed" means this document suggests it.

| Event | Fields | Status | Used by |
|---|---|---|---|
| `answer` | `t, course, q, topic, correct (true/false/null), mode (diag/recap/practice/smart/card), conf (0 to 2 or null), ms, run` | Planned (T3.2) | M4, M6 |
| `course_imported` | `t, course, source (file/sample/package), isSample` | Proposed | M1 to M3 |
| `module_opened` | `t, course, module` | Proposed | M1 |
| `diagnostic_completed` | `t, course, items, correct, flaggedTopics[], attempt` | Proposed. Log every attempt: the app keeps only the latest today | M1, M6 |
| `module_completed` | `t, course, module, via (recap/mark_done/test_out)` | Proposed. Today only the first-done date is stored (`dt`) | M2, M3, M3b, M4 |
| `course_completed` | `t, course, run` | Proposed. The app already keeps a dated record (`ach`, section 1.1) | M3 |
| `review_done` | `t, course, item, rating (got/partly/again), dueAt` | Proposed (card ratings are inside T3.2) | M4, M5 |
| `retention_check_done` | `t, course, topic, horizon (7/30), n, correct` | Proposed (T6.2) | M7b |
| `group_challenge_joined` | `t, group, challenge` | Proposed (T5.9) | M8 |
| `group_challenge_contribution` | `t, group, challenge, activity` | Proposed (T5.9) | M8 |
| `peer_post` | `t, group, kind (question/answer/helpful)` | Proposed (T5.11) | M9 |
| `analytics_consent_changed` | `t, state (on/off)` | Proposed (T6.3) | All central figures |

Derived, not logged: `active_day` (computed from meaningful events, T4.2) and "review due" (computed from the schedule).

Deliberately not recorded: session length, screen time, scroll or click events, free text, and answer content.

## 7. Privacy rules for any measurement

1. **Local first.** Compute on the device whenever the figure is only for the learner (T6.2).
2. **Consent before anything leaves the device.** Analytics are off by default and opt-in only (D7, plan default). T6.3 requires an explicit consent screen, an anonymous random ID, batched sending when online, respect for Do Not Track, a "What we collect" page, and a switch that turns it off and deletes the ID. With consent off, no network request is made.
3. **No content.** Never send course text, question text, answers, names, emails or free text. Hidden and private courses never leave the device: do not send their course ID either (owner decision, 2026-11-13).
4. **Coarse time.** Central analytics should receive the local date, not the exact time.
5. **Small groups.** Do not show a figure for fewer than 5 learners. The number 5 is provisional (owner decision, 2026-11-13) and will be revisited in the T5.5 ADR.
6. **Younger learners.** D5 (audience and ages) follows the plan default, so assume minors are possible. Do not publish per-person rankings, and follow the audience limits in T7.10.
7. **Backups.** Events kept on the device are included in backups (T3.2). They stay out of any sync until consent exists.
8. **Class files (T5.4).** A per-learner progress file holds the plan's safe subset, plus dates the app already stores and per-topic summaries. It holds no raw event logs in v1 (owner decision, 2026-11-13).

## 8. Decisions and open questions

The numbering is the same as in the question entry for v0.1. Questions 1 to 7 were put to the Coordinator and the owner. Question 8 was added in the document. "Owner" below means a decision recorded in STATUS_v0010 on 2026-11-13. "Coordinator" means the triage of v0.1.

| # | Question | Outcome |
|---|---|---|
| 1 | Which "retention"? | Both stay: M7a (return) and M7b (recall). Owner. |
| 2 | "First lesson" | Read as "a module opened" (Part 0 excluded). Accepted. Coordinator. |
| 3 | Return-retention window | A full week (days 7 to 13, days 30 to 36). Accepted as a proposal. Coordinator. |
| 4 | Course IDs | Hidden and private courses never leave the device. Owner. |
| 5 | Minimum group size | 5, provisional, to be revisited in the T5.5 ADR. Owner. |
| 6 | Class files (T5.4) | The plan's safe subset plus already-stored dates and per-topic summaries, no raw event logs in v1. Owner. |
| 7 | D7 and D5 | D7: the plan default (off, opt-in). D5: the plan default (minors possible). Owner. |
| 8 | Sample course | Reported as its own row. Accepted. Coordinator. |

**Still open**

9. **Attempts and M3.** This version counts the first attempt of a course for the cohort rate and reports later attempts separately. Is that right, or should a completion in any attempt count?
10. **M3 and hand-marked modules.** M3 follows the app's rule, which counts a module marked done by hand. If the owner wants only recap-passed modules, the rule needs a change in the app, not here.
11. **M6 baseline.** Computing the baseline with the T3.3 estimator needs the T3.3 function to be callable on diagnostic answers. T3.3 should be written with that in mind. If not, M6 will be reported as "mixed estimator".
12. **Code-checked facts.** Section 1.1 was checked against one version of `index.html` (main 4a260700). After any later change to the code, or after T1.12 changes how progress is stored, it must be checked again.

## 9. Related tasks

T3.1 and T3.2 (events and learner model), T3.3 (mastery), T4.2 (active day), T4.3 (badges), T5.1 and T5.4 (device and class views), T5.5 (backend ADR), T6.2 (local insights and retention checks), T6.3 (opt-in analytics), T6.6 and T6.6b (pilot evaluation protocol), T6.7 (pilot results export), T7.16 (pilot programme). This list is advisory. The plan's Depends column is authoritative.
