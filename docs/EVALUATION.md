# Pilot evaluation protocol

**Task:** T6.6b (follow-up to T6.6, Implementation Task Plan, Phase 6) · **Version:** 0.2 draft · **Date:** 2026-11-17
**Status:** proposed. Replaces v0.1 (triaged ready-for-release by the Coordinator). The owner's answers of 2026-11-13 and 2026-11-17 are applied (section 10). The names of the pilot lead and the ethics contact are still to be given.

This document says how the Offline Course Library should be tested with real learners, what counts as success, how learners are protected, and how the results change the roadmap. It is a protocol. It does not add any code, logging or analytics to the app, and it does not start a pilot.

Anything marked **Proposal** is a choice made by this document because the plan gives no value. The owner has marked the numbers in sections 3, 4 and 6 as **provisional**: they are the working values, to be confirmed before the first learner outside the usability pilot is enrolled (section 10).

## 1. Purpose and the two pilots

The plan asks for two different things that are easy to mix up:

| | Stage A: usability pilot | Stage B: learning pilot (this protocol) |
|---|---|---|
| Question | Can a learner use the app and the pilot courses without help? | Do learners know more after the course, and do they still know it later? |
| Plan task | T7.16 (usability session with at least five learners, `docs/PILOT-REPORT.md`). T7.16 is a people task and has not started. | T6.6 and T6.6b (this document) |
| Needs | Pilot courses and roadmap imported | Learner events, mastery and retention checks (section 8) |
| Output | Time per course, rework rate, learner problems | Improvement and retention numbers against the thresholds in section 6 |

Stage A comes first. A learning result is not meaningful if learners could not get through the app. This protocol covers Stage B and describes how Stage A feeds it.

## 2. What this pilot can and cannot show

The pilot measures what happens to learners who use the library on the pilot programme. It does not prove that the library caused the change.

- **No control group in the base design.** A learner who improves may have improved from other study, a lecture or a textbook. The base design is a before-and-after comparison (section 4). A waitlist comparison is optional (section 4.4).
- **Self-selection.** Volunteers are usually more motivated than the average student.
- **Short diagnostics.** The sample course has three diagnostic items. A topic baseline from a few items is coarse. Say so in the report.
- **Practice effect.** Seeing the same items twice raises scores for reasons that are not learning. Use matched parallel items where they exist (section 4.2).
- **Small groups.** Report the number of learners (n) next to every figure. A rate on a few learners is not a finding.

These limits go in the report. They do not stop the pilot, but they do limit what the report may claim.

## 3. Who and how many

**Programme.** The plan's decision D13 names UG-001 BS Computer Science as the pilot programme, and T7.16 step 2 generates wave 0 (34 titles: 29 courses and 5 project templates). The numbers are the plan's. I have not checked them against the catalogue data, and they may change when the university confirms the taxonomy (T7.16 step 1).

**Courses.** Use only courses a subject expert has reviewed (decision D18 and `docs/REVIEW-WORKFLOW.md`). A course that is not reviewed does not enter the pilot. The review states are the generator's own: `not-reviewed`, `in-review`, `reviewed`, `rejected` (field `review_status`). The owner names the review experts at T7.16 step 1.

**Size.**

| Stage | Proposal |
|---|---|
| A: usability | 5 to 8 learners (T7.16 sets a minimum of 5). |
| B: learning | Enrol 45 learners, so that about 34 finish the delayed test. Provisional (owner, 2026-11-13). |

Why 34: a before-and-after comparison on the same learners needs about 34 pairs to detect a medium-sized improvement (a standardised effect of 0.5) with the usual 80% power and a 5% significance level. This is a rule of thumb and not a guarantee. Enrolling 45 allows for about a quarter of learners dropping out before the delayed test. If fewer than 20 learners finish, report the results as a pilot signal only and do not apply the thresholds as pass or fail.

**Who is in.** Learners on the pilot programme who volunteer and consent (section 7). Do not recruit through marks or attendance. Record only a pilot code for each learner (section 7). The pilot lead (section 7.1) recruits the learners and runs the consent step. Minors are possible (owner, 2026-11-13), so the consent rules in section 7 assume that some learners may be under 18.

**Unit.** One profile on one device is one learner (METRICS principle 3). Ask learners to use one profile and one device for the pilot. Record the number of learners who shared a device or used two profiles, if known.

## 4. Design

### 4.1 Timeline (Proposal)

Time is stated in steps, not calendar dates. The plan says not to estimate calendar time until the pilot has measured time per course.

| Step | What happens |
|---|---|
| 0 | Consent (section 7). The learner gets a pilot code and imports the pilot courses and roadmap. |
| 1 | **Pre-test.** The learner completes each pilot course's diagnostic before starting its modules. |
| 2 | **Study period.** The learner studies as they wish. The period is set by the course length. Proposal: four weeks from the pre-test. |
| 3 | **Post-test** at the end of the study period, or at course completion if sooner. |
| 4 | **Retention check at about 7 days** after the post-test (M7b, R7). |
| 5 | **Retention check at about 30 days** after the post-test (M7b, R30). |
| 6 | **Exit questions** (section 4.5) and export of the pilot results file (section 8). |

Each learner has their own clock. Steps are counted from the learner's own pre-test, not from a shared date.

### 4.2 Pre/post using the diagnostic

- **Pre-test:** the course diagnostic, taken before any module. This is the baseline used by M6 in `docs/METRICS.md`: the learner's first diagnostic, even if it is retaken later.
- **Post-test:** the plan has the diagnostic and the "practice test". The pilot needs a post-test that does not repeat the pre-test items.
  - **Preferred:** matched parallel items, where the course package provides them (T7.9: "compare matched pre/post items and report counts"). Compare matched pairs only.
  - **Fallback:** when a course has no parallel items, use the learner's mastery per topic (T3.3) as the post measure, as M6 does, and say in the report that the comparison is weaker.
- **Topics:** compare by topic (`dom`, or `Skill` where the course has one). Skip a topic with fewer than three answers, the same rule as M6.
- **Missing diagnostic:** a learner who skips the diagnostic cannot be measured. Report how many were left out.

### 4.3 Delayed retention test

Use M7b exactly as `docs/METRICS.md` defines it: a short quiz of five items the learner answered correctly earlier (T6.2), asked about 7 and about 30 days after the topic was mastered. This measures forgetting of things that were known. It does not measure new learning.

Optional, when matched parallel items remain unused: a delayed test of unseen matched items at 30 days. This is stricter, because it cannot be passed by remembering the answers.

A learner who does not take the check is a missing value, not a failure. Report how many were missing.

### 4.4 Optional comparison group (Proposal: only if enough learners; the university's answer is unknown)

If at least 60 learners can be enrolled, split them by a random draw (or by whole class sections if a draw is not possible) into two groups: one starts at once, the other starts after the first group's post-test (a waitlist). Compare the two groups' change on the pre-test to post-test period. This is the only part of the design that lets the report say more than "learners improved". Do not run it with fewer learners, because the groups would be too small to compare. Whether the university accepts a waitlist is not known (owner, 2026-11-13), so the base design is the before-and-after comparison. Ask the pilot lead early; the answer decides this section.

### 4.5 Exit questions

A short form at the end, with no names:

1. Which courses did you finish, and which did you stop? Why?
2. Was anything unclear, wrong or too hard? (Free text. Not sent anywhere automatically, see section 7.)
3. Did you study anywhere else on the same topics during the pilot (class, book, video)? This tells the report how much to trust the improvement.
4. Would you use the library again?

## 5. What is measured

All measures come from `docs/METRICS.md` (merged as v0.1; v0.2 is ready for release). The metric IDs M1 to M7b are the same in both. The pilot adds no new definitions.

| Pilot question | Measure | Notes |
|---|---|---|
| Did they improve? | M6 Assessment improvement | Primary measure. Matched items where available. |
| Do they remember? | M7b Recall retention, R7 and R30 | Primary measure. |
| Did they get through it? | M2 First-module completion, M3 Course completion rate, M3b modules finished | M3 is the app's own completion record: every module done and a practice test of 80% or more in the same attempt of the course. The rate counts each learner-course's first attempt. M3b is the secondary line: every module done, whether or not the practice test was passed. Report both and say which is which. Wording from `docs/METRICS.md` v0.2, section 5. |
| Did they keep revising? | M5 Revision completion | Supporting. |
| Did they come back? | M7a Return retention | Supporting. |
| Did they start at all? | M1 Activation | Supporting. The sample course is reported separately. |

Group challenge participation (M8) and peer contribution (M9) are not part of this pilot. Social features are not built and decision D6 waits for the pilot's results.

Usability measures from Stage A (time to finish Module 1, learner problems, rework rate) are taken from T7.16's `docs/PILOT-REPORT.md`.

## 6. Success thresholds

**Proposal.** The numbers below are starting values. They must be confirmed by the owner before the first learner enrols and must not be changed after the data is seen.

### 6.1 Primary thresholds

| Measure | Threshold | Why this value |
|---|---|---|
| Improvement (M6) | Mean improvement of at least 15 percentage points over the pre-test, and the 95% interval for the mean is above zero | A gain that clearly cannot be explained by noise, and large enough to matter. |
| Share who improved | At least 70% of learners score higher after than before | Guards against a mean pulled up by a few learners. |
| Recall at 7 days (M7b, R7) | At least 80% of checked items correct | Spaced revision is meant to hold knowledge. |
| Recall at 30 days (M7b, R30) | At least 70% of checked items correct | Forgetting is expected, but most knowledge should remain. |
| Module 1 without help (Stage A, from T7.16) | A learner finishes Module 1 of three pilot courses without help | This is T7.16's own "done when". |
| First-module completion (M2) | At least 60% of learners who start a course finish its first module within 30 days | Shows the app does not lose learners early. |

### 6.2 Reading the result

| Outcome | Reading |
|---|---|
| **Go.** All primary thresholds met, with n of at least 20. | The approach works for this programme. Continue to the next waves (T7.18) and to the decisions in section 9. |
| **Adjust.** Improvement met, but recall or completion is not. | Learners learn but do not keep it, or do not finish. Fix the cause (section 9), then repeat a smaller pilot. |
| **Rethink.** Mean improvement below 5 points, or fewer than half the learners improve. | The courses or the diagnostic are not doing their job. Stop adding courses and review the content and the tests first. |
| **Inconclusive.** Fewer than 20 learners finish. | Report what was seen. Do not use it to pass or fail the thresholds. Enrol more. |

Between "Rethink" and "Go" (for example, improvement of 5 to 14 points) the result is "Adjust", unless n is under 20.

### 6.3 Content quality (supporting)

- No accuracy fault found by a reviewer or reported by learners that was not fixed within the pilot.
- Share of reported problems that are content problems, as against app problems. Use it to decide where work goes next.

## 7. Ethics, consent and data protection

This section assumes minors are possible, as the owner decided on 2026-11-13 (D5 plan default). It is not legal advice. The university's ethics process and the privacy law that applies decide the final rules.

### 7.1 Before the pilot

- **Two named roles** (owner, 2026-11-17). A **pilot lead** at the partner university: a lecturer or programme coordinator who can speak for the course, recruits the learners, runs the consent step and signs off the results. The owner is the **product lead**. **The names are still to be given.**
- **Ethics step.** Ask the university's research ethics committee (or equivalent) early whether this counts as research or as programme evaluation, and get the answer **in writing before any learner outside the usability pilot is enrolled**. If they say it needs approval, get the approval. If they say none is needed, keep that statement. The pilot lead does this, not the app. Appendix A lists what to send them.
- Minors are possible (owner, 2026-11-13; D5 plan default). If any participant may be under 18, get a parent or guardian's consent as well as the learner's, and follow the local rules on minors. If the pilot is limited to adults, record how age is checked.
- Only courses a subject expert has reviewed are used (section 3).

### 7.2 Consent

- Voluntary. Joining or leaving has no effect on marks, attendance or standing.
- Plain language, in the learner's language, shown before step 0. It says: what is measured, what is not, who sees it, how long it is kept, and how to withdraw.
- The learner can withdraw at any time and ask for their pilot data to be deleted, with no reason needed.
- Consent is recorded by the pilot lead, outside the app. The app does not need to know a learner's identity.

### 7.3 What is collected

- Collect only the measures in section 5 and the exit questions. No course text, no question text, no answers and no free text leaves the device through the app (METRICS section 7).
- Identify a learner by a pilot code only. Keep the table that links codes to people in a separate place from the data, held by the pilot lead.
- Use the local date, not the exact time (METRICS section 7).
- Courses the learner has hidden or made private never leave the device and are not in any results file (owner decision, 2026-11-13).
- Do not publish results for any group smaller than the minimum group size. The owner set it at 5, provisionally; it is revisited in the T5.5 ADR. With a small pilot, publish totals only.
- No per-person ranking or comparison between named learners. Learners can see their own results.

### 7.4 How data leaves the device

- No network request is sent unless the learner has consented and the owner has decided D7. The owner has created task **T6.7** (pilot results export) for a manual export of a small results file that the learner hands over themselves (section 8). This keeps the pilot inside the app's offline-first rule and does not depend on T6.3. Analytics are off and opt-in by default (D7, plan default).
- If the owner chooses opt-in analytics instead (T6.3), its rules apply: explicit consent screen, anonymous random ID, no content, batched sending, Do Not Track respected, a "What we collect" page and a switch that deletes the ID.

### 7.5 Keeping and deleting

**Proposal.** Keep the raw results files only until the evaluation report is accepted, then delete them. Keep the aggregate figures. Learners who withdraw have their file deleted at once. Store files only in the place the university approves.

### 7.6 Fairness and wellbeing

- A learner without a phone or a reliable device must not be disadvantaged. Offer a shared device or leave them out without penalty.
- Results are for improving the library, not for judging learners. Do not share a learner's results with their teacher without that learner's consent.
- Tell learners that the courses are generated and then expert-reviewed, and how to report a mistake.

## 8. What must exist before Stage B starts

Today the app measures nothing outside the learner's device (METRICS section 1). Stage B cannot run until these exist. This list is a readiness gate. It is not a request to build them from this document.

| Needed | Plan task | State |
|---|---|---|
| Event log (answers, module completions, review events) | T3.2 | Not built |
| Topic mastery | T3.3 | Not built |
| Retention checks at 7 and 30 days | T6.2 | Not built |
| Matched pre/post items in course packages | T7.9 (and the generator's parallel forms) | Not built |
| Pilot courses (wave 0), reviewed, and the pilot roadmap | T7.16 (a people task) | Not started. The owner names the review experts at step 1. |
| Review workflow | T7.19, T7.19b | v0.1 merged; v0.2 submitted |
| **A way to get a learner's results off the device with consent** | **T6.7** (spec first: T6.7s, docs; builder A, button and consent text B) | Pending, blocked. Needs T1.9, T6.1, T3.2, T3.3, T6.2. Owner approval before merge. Late in the order. |
| Consent text and ethics approval | Pilot lead (section 7.1) | Not started. Names to be given. |

The results export. The Class view (T5.4) imports per-profile progress files, and the owner decided that class files hold the plan's safe subset plus already-stored dates and per-topic summaries, with no raw event logs in v1. That is not enough for pre/post or retention figures on its own. The owner has therefore made a separate task, **T6.7**, for a small **pilot results file** the learner exports on purpose: pilot code, per-topic pre and post figures, recall check counts and completion dates, with no content. Its format is written first as a docs task (T6.7s), which depends on this protocol and on METRICS v0.2. Until T6.7 exists, Stage B cannot start.

## 9. How results change the roadmap

The plan already ties several decisions to the pilot. Results are read against these.

| Finding | Roadmap change |
|---|---|
| **Go** on the primary thresholds | Generate the next waves (T7.18, only after the pilot report). Tune XP values and level thresholds with the pilot data (D11). |
| Social learning: learners ask for it, or completion is low for lack of it | Decide whether to build the group features (D6: "do 5A now; decide 5B after pilot results"). Do not decide this from enthusiasm alone. Use M2, M3 and the exit answers. |
| Improvement low on topics with matched items | Review the diagnostic and the remediation paths (T3.6, T7.9) and the content of those modules, before adding courses. |
| Recall low (R7 or R30 under threshold) | Review revision spacing (1/3/7/14/30 days), the size of the review sessions and the retention checks (T6.2) before changing content. |
| Completion low | Review the 80% module gate (including the tiny-pool rule, D8), the amount of content per module, and the first-run experience. |
| Many problems classed as content problems | Send them to the course reviewers (`docs/REVIEW-WORKFLOW.md`, T7.19) and to the generator's standards (T7.20), not to app work. |
| Many problems classed as app problems | Create targeted fixes in the app lanes. List them in the report with their numbers. |
| Per-question skill, difficulty and prerequisite columns | Decide D15 ("decide after the pilot; use the diagnostic map meanwhile") with the diagnostic's measured quality. D15 must be decided before T7.18 starts. |

**Reporting.** Write the Stage B results in an evaluation report with the same honesty rules as the plan: state the numbers, the n behind them, what was missing, and which limits in section 2 apply. Say which thresholds were met. Do not report a threshold as met when n is under 20. Where the report goes (a section of `docs/PILOT-REPORT.md` or a separate file) is an open question.

## 10. Decisions and open questions

Answers of the owner (2026-11-13, recorded in STATUS_v0010, and 2026-11-17, STATUS_v0013) against the twelve questions of v0.1:

| # | Question | Answer | What it means now |
|---|---|---|---|
| 1 | Pilot size | Provisional | Stage A 5 to 8 learners; Stage B 45 enrolled, about 34 finishing. Confirm before the first Stage B learner enrols. |
| 2 | Success thresholds | Provisional | Section 6 values. Confirm before enrolment; never change them after the data is seen. |
| 3 | Study period | Provisional | Four weeks. The right length is known only after T7.16 measures time per course. |
| 4 | Comparison group | **Unknown** | Whether the university accepts a waitlist has not been asked. Base design has no comparison group (section 4.4). |
| 5 | Audience and ages (D5) | Minors possible | Section 7 assumes some learners may be under 18. |
| 6 | How results leave the device | New task **T6.7** | Pilot results export, with its format spec T6.7s (section 8). |
| 7 | Who approves ethics, who leads | **Accepted, names to be given** | A pilot lead at the partner university and the owner as product lead, plus a written ethics answer before any learner outside the usability pilot is enrolled (section 7.1). |
| 8 | Retention of raw data | Provisional | Delete raw files after the report is accepted (section 7.5). The university may set another rule. |
| 9 | Where the report goes | Provisional | A section of `docs/PILOT-REPORT.md` or a separate file. |
| 10 | M3 meaning | **Settled** | METRICS v0.2: the app's completion record, with M3b as the secondary line (section 5). |
| 11 | Review state names | **Settled** | The generator's four values (section 3). |
| 12 | Dependence on METRICS | **Settled for IDs** | M1 to M7b are unchanged between v0.1 and v0.2 of METRICS. |

Still open, and not for this document to decide:

1. **The names** of the pilot lead and the ethics contact. The owner gives them.
2. **The ethics answer**: research or programme evaluation, in writing.
3. **Waitlist** acceptable to the university (question 4).
4. **D15** (per-question skill, difficulty and prerequisite columns): decide after the pilot, and before T7.18 starts.
5. **Minimum group size 5**: provisional; revisited in the T5.5 ADR.
6. **The wave 0 numbers** (34 titles, 29 courses and 5 project templates) are the plan's and are unchecked against the catalogue. They change if the university changes the taxonomy at T7.16 step 1.

## 11. Related tasks

T3.1 to T3.3 (learner model, events, mastery), T3.6 (diagnostic-driven path), T5.4 (Class view), T5.5 (backend ADR, minimum group size), T6.1 and T6.1b (metrics), T6.2 (retention checks), T6.3 (opt-in analytics), T6.7 and T6.7s (pilot results export and its format), T7.9 (diagnostic map and matched items), T7.16 (pilot programme end to end), T7.18 (scale waves), T7.19 and T7.19b (review workflow). Decisions D5, D6, D7, D11, D13, D15, D18. This list is advisory. The plan's Depends column is authoritative.

## Appendix A. What to send the ethics office

A draft for the pilot lead to adapt and send. It is not legal advice and it does not replace the university's own form. Items in square brackets are not decided yet. The app does not yet produce the results file described below (T6.7); update this appendix when T6.7s fixes its format.

**1. Title and purpose.** A pilot evaluation of the Offline Course Library, a study app that works without internet, with courses for [programme: UG-001 BS Computer Science, to be confirmed with the university]. The purpose is to learn whether learners know more after using the courses, whether they still remember it later, and what stops them using the app. It is to improve the app and the courses, not to judge learners.

**2. Question for the office.** Does this count as research or as programme evaluation, and what do you need from us? We ask for your answer in writing before any learner outside a small usability session is enrolled.

**3. Who takes part.** Volunteers from the pilot programme. A usability session of 5 to 8 learners, then a learning pilot of about 45 learners (provisional numbers). Nobody is recruited through marks or attendance. Joining or leaving has no effect on marks, attendance or standing.

**4. Ages.** [Confirm.] Some learners may be under 18. If so, a parent or guardian's consent is collected as well as the learner's, following the local rules on minors.

**5. What is done.** Each learner takes a short diagnostic before a course, studies as they wish for about four weeks (provisional), takes it again afterwards, and answers short recall checks about 7 and 30 days later. At the end they answer a few exit questions.

**6. What data is collected.** A pilot code (no name), per-topic before and after figures, counts of recall checks, completion dates (the local date, not the exact time), and the exit answers. **Not collected:** names, course text, question text, the learner's answers, free-text notes, exact times, or anything about courses the learner has hidden or made private.

**7. Where the data stays.** On the learner's own device. Results leave the device only when the learner exports a small results file and hands it to the pilot lead themselves. The app sends nothing over the network for this pilot. The list that links pilot codes to people is held by the pilot lead in a separate place from the data. Files are stored only where the university approves.

**8. How long it is kept.** Proposal: raw files are deleted after the evaluation report is accepted; only totals are kept. [The university may require another rule.] Results are not published for any group smaller than 5 learners.

**9. Withdrawal.** A learner can withdraw at any time without giving a reason and ask for their file to be deleted. Deletion is immediate.

**10. Risks and care.** Low risk. A learner without a suitable device is offered a shared device or left out without penalty. Results are not shared with teachers without the learner's consent. Learners are told that the courses are generated and then reviewed by a subject expert, and how to report a mistake.

**11. Who to contact.** Pilot lead: [name, role, email: to be given]. Product lead: [the owner; name and email to be given]. Ethics contact at the university: [to be given].
