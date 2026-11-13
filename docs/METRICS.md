# Metrics and event dictionary

**Task:** T6.1 (Implementation Task Plan, Phase 6) · **Version:** 0.1 draft · **Date:** 2026-11-12
**Status:** proposed. Not yet triaged by the Coordinator or reviewed by the owner.

This document defines what the Offline Course Library should measure, how each number is calculated, where the data comes from, and what must be protected. It is a definition document. It does not add any logging or analytics to the app.

## 1. What is measured today

Nothing is measured outside the learner's own device. The app is offline-first, has no server and no accounts, and stores progress per profile in the browser's IndexedDB. The plan's recommended default for decision D7 is analytics off by default and opt-in only. D7 is not yet decided, and T6.3 (opt-in analytics) has not been built.

So every aggregate number below (across learners, groups or a class) needs one of these sources first:

| Source | Plan task | What it can supply |
|---|---|---|
| The learner's own device | T6.2 | The learner's own figures only, computed from the event log. |
| Teacher's Class view | T5.4 | Figures from imported per-profile progress files. These files are a safe subset of the backup (progress, badges, XP), so event-based metrics need the files to include events. That is not decided. |
| Opt-in product analytics | T6.3 (needs D7) | Anonymous, consented events sent in batches. |
| Server-backed groups | T5.6 to T5.11 (after the T5.5 ADR) | Group and peer metrics. |

Where this document describes what the app stores today, that comes from the plan and STATUS. It was not checked against the code of `index.html`.

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
| Sample course | The example course from `examples/sample-course.md`, which T2.8 will let a learner load with one tap. Report it separately (see section 8, question 5). |
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
| M3 | Course completion rate | Learner-course | Cohort, reported at 30 and 90 days | `course_imported`, `course_completed` |
| M4 | Weekly active learners | Learner | One week | Meaningful events (T3.2, T4.2) |
| M5 | Revision completion | Review item | One week | Review schedule, `review_done` |
| M6 | Assessment improvement | Learner-course-topic | Diagnostic to now | `answer` events, T3.3 mastery |
| M7a | Return retention, D7 and D30 | Learner | Week 2 and week 5 after first active day | Active days |
| M7b | Recall retention, R7 and R30 | Learner-topic | 7 and 30 days after mastery | `retention_check_done` (T6.2) |
| M8 | Group challenge participation | Group member | One challenge | Group events (T5.8, T5.9) |
| M9 | Peer contribution | Learner | One week | Peer events (T5.11) |

"Retention" appears in T6.1 without saying which kind. This document defines both M7a and M7b (see section 8, question 1).

## 5. Metric definitions

### M1. Activation

- **Question answered:** after importing a first course, does the learner actually start?
- **Definition:** a learner is activated when, within 24 hours of the first-course import, they complete the diagnostic or open a module (Part 0 does not count).
- **Formula:** activation rate = learners with an activating event at most 24 hours after `t0` ÷ learners whose first course was imported in the period. `t0` is the time of that first import.
- **Cohort:** the cohort week of `t0`.
- **Data source:** `course_imported`, `diagnostic_completed`, `module_opened`.
- **Available today:** no. The app does not record a dated "module opened" event. The plan adds `lastPos` in T2.1, which holds the last position, not a history.
- **Privacy:** needs only dates and event names, no content. Use the 24-hour window on timestamps taken from the device clock, and accept that a changed clock can distort it.
- **Notes:** the plan says "first lesson or diagnostic". "Lesson" is not an app term, so this document reads it as "a module opened" (section 8, question 2). Report with and without the sample course.

### M2. First-module completion

- **Definition:** the first module of a course (the lowest-numbered module) is done.
- **Formula:** first-module completion = learner-courses whose first module is done ÷ learner-courses imported in the cohort week. Report the share done within 7 days of import and within 30 days of import.
- **Data source:** `course_imported`, `module_completed` (with the module number).
- **Available today:** partly. The learner's own progress shows which modules are done. The date of completion is not stated in the plan as being stored.
- **Privacy:** dates and module numbers only.
- **Notes:** this is the measure behind the Phase 2 exit check ("finish Module 1 without help" with at least five people). A course reset, or a re-import where the learner chooses "Reset progress" (T1.6), clears progress, so count a learner-course once, from its first import.

### M3. Course completion rate

- **Definition:** every module of the course is done. This is the same condition as the Course Master badge (T4.3).
- **Formula:** completion rate = learner-courses with every module done ÷ learner-courses imported in the cohort week. Report at 30 days and 90 days after import.
- **Data source:** `course_imported`, `course_completed`.
- **Available today:** partly. Completion can be worked out from progress. The date is not stated as stored.
- **Privacy:** dates and event names only.
- **Notes:** leave out removed courses and report the sample course separately. A re-import that changes the modules (T1.6) starts a new course version. Count against the version the learner finished, and say so.

### M4. Weekly active learners

- **Definition:** learners with at least one active day in the week.
- **Formula:** weekly active learners = distinct learners with one or more active days in the Monday-to-Sunday week. Also report weekly active learners ÷ learners who were active in any earlier week.
- **Data source:** meaningful events from the event log (T3.2). The active-day rule is T4.2's.
- **Available today:** no for history. A learner's own device could count active days only once events are logged.
- **Privacy:** an anonymous install ID plus a local date. No names.
- **Notes:** the unit depends on the source (profile on a device, install in analytics). Calm mode (T4.8) hides rewards and does not change what counts as active.

### M5. Revision completion

- **Definition:** of the review items that were due, how many were reviewed.
- **Formula:** revision completion = items reviewed in the week ÷ items due in the week. An item is due in the week when its due date is on or before the end of the week and it was not reviewed before the week began. Early or extra reviews of items not yet due are not counted.
- **Data source:** the review schedule (the 1/3/7/14/30-day ladder) and `review_done` events with the rating Got it, Partly or Again.
- **Available today:** the current schedule is per module (T3.8 moves it to per card). A weekly history is not available, because reviews are not logged as events.
- **Privacy:** counts and dates only. Never include card text.
- **Notes:** "Again" counts as reviewed, because this metric is about doing the revision, not about success. Recall success is a separate figure. An item that stays overdue is counted again in each later week, so the measure shows the backlog as well.

### M6. Assessment improvement

- **Definition:** how much better a learner does on a topic now than on the diagnostic.
- **Formula:** improvement(topic) = mastery now (T3.3) − diagnostic accuracy on that topic. Report the mean over the topics that have both values, with the number of topics and learners.
- **Variant for packages:** when the course has matched parallel items (`diagnostic.json`, T7.9), compare matched pre and post items and report the counts.
- **Data source:** `diagnostic_completed` (items and correct answers by topic) and `answer` events.
- **Available today:** no. Mastery needs T3.2 and T3.3.
- **Privacy:** topic names and numbers only. No question text, no answers.
- **Notes:** use the learner's first diagnostic as the baseline, even if the diagnostic is retaken (T3.6). Learners who skip the diagnostic cannot be measured, so say how many were left out. Diagnostics are short (the sample has three items), so topic baselines are coarse. Mastery needs at least three answers, so skip topics below that.

### M7a. Return retention (D7 and D30)

- **Definition:** does the learner come back to study?
- **Formula:** let `D0` be the learner's first active day. D7 retention = learners with at least one active day in days 7 to 13 after `D0` ÷ learners with a `D0` in the cohort week. D30 uses days 30 to 36.
- **Data source:** active days.
- **Available today:** no for history.
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
| `diagnostic_completed` | `t, course, items, correct, flaggedTopics[]` | Proposed | M1, M6 |
| `module_completed` | `t, course, module, via (recap/mark_done/test_out)` | Proposed | M2, M3, M4 |
| `course_completed` | `t, course` | Proposed | M3 |
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
2. **Consent before anything leaves the device.** T6.3 requires an explicit consent screen, an anonymous random ID, batched sending when online, respect for Do Not Track, a "What we collect" page, and a switch that turns it off and deletes the ID. With consent off, no network request is made.
3. **No content.** Never send course text, question text, answers, names, emails or free text. For hidden or private courses, do not send the course ID either (section 8, question 4).
4. **Coarse time.** Central analytics should receive the local date, not the exact time.
5. **Small groups.** Do not show a figure for fewer than a minimum number of learners. This document proposes 5 and asks for it to be confirmed with D7.
6. **Younger learners.** Until D5 (audience and ages) is decided, assume minors are possible. Do not publish per-person rankings, and follow the audience limits in T7.10.
7. **Backups.** Events kept on the device are included in backups (T3.2). They stay out of any sync until consent exists.

## 8. Open questions

These are choices this document made or could not settle. The owner or Coordinator can change them.

1. **Which "retention"?** T6.1 lists "7-day and 30-day retention". The plan's Phase 6 goal speaks of learners who learn and stay, and T6.2 adds retention checks. This document defines both: return retention (M7a) and recall retention (M7b).
2. **"First lesson".** Read as "a module opened". Part 0 does not count.
3. **Retention window.** D7 and D30 use a full week (days 7 to 13, days 30 to 36). A single day is stricter and noisier.
4. **Course IDs.** Should a course ID ever leave the device? The proposal is no for hidden or private courses.
5. **Sample course.** It makes activation look better because it costs the learner nothing. The proposal is to report it as its own row.
6. **Minimum group size** for a published figure. Proposed 5.
7. **Class files (T5.4).** Should the per-learner progress file include dated events? Without them a teacher can see completion, but not retention or improvement.
8. **Decision D7** (analytics: none, page-view only, or a custom endpoint) and **D5** (ages) are not made. Sections 1 and 7 depend on them.

## 9. Related tasks

T3.1 and T3.2 (events and learner model), T4.2 (active day), T5.1 and T5.4 (device and class views), T6.2 (local insights and retention checks), T6.3 (opt-in analytics), T6.6 (pilot evaluation protocol), T7.16 (pilot programme). This list is advisory. The plan's Depends column is authoritative.
