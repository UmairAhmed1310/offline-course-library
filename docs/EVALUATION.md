# Pilot evaluation protocol

**Task:** T6.6 (Implementation Task Plan, Phase 6) · **Version:** 0.1 draft · **Date:** 2026-11-13
**Status:** proposed. Not yet triaged by the Coordinator or reviewed by the owner.

This document says how the Offline Course Library should be tested with real learners, what counts as success, how learners are protected, and how the results change the roadmap. It is a protocol. It does not add any code, logging or analytics to the app, and it does not start a pilot.

Anything marked **Proposal** is a choice made by this draft because the plan gives no value. It needs the owner's confirmation before a pilot starts (section 10 lists them).

## 1. Purpose and the two pilots

The plan asks for two different things that are easy to mix up:

| | Stage A: usability pilot | Stage B: learning pilot (this protocol) |
|---|---|---|
| Question | Can a learner use the app and the pilot courses without help? | Do learners know more after the course, and do they still know it later? |
| Plan task | T7.16 (usability session with at least five learners, `docs/PILOT-REPORT.md`) | T6.6 (this document) |
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

**Programme.** The plan's decision D13 names UG-001 BS Computer Science as the pilot programme, and T7.16 generates its first wave (34 titles: 29 courses and 5 project templates).

**Courses.** Use only courses a subject expert has reviewed (decision D18 and T7.19). A course that is not reviewed does not enter the pilot. T7.19 is a draft, so the state names may change.

**Size.**

| Stage | Proposal |
|---|---|
| A: usability | 5 to 8 learners (T7.16 sets a minimum of 5). |
| B: learning | Enrol 45 learners, so that about 34 finish the delayed test. |

Why 34: a before-and-after comparison on the same learners needs about 34 pairs to detect a medium-sized improvement (a standardised effect of 0.5) with the usual 80% power and a 5% significance level. This is a rule of thumb and not a guarantee. Enrolling 45 allows for about a quarter of learners dropping out before the delayed test. If fewer than 20 learners finish, report the results as a pilot signal only and do not apply the thresholds as pass or fail.

**Who is in.** Learners on the pilot programme who volunteer and consent (section 7). Do not recruit through marks or attendance. Record only a pilot code for each learner (section 7).

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

### 4.4 Optional comparison group (Proposal: only if enough learners)

If at least 60 learners can be enrolled, split them by a random draw (or by whole class sections if a draw is not possible) into two groups: one starts at once, the other starts after the first group's post-test (a waitlist). Compare the two groups' change on the pre-test to post-test period. This is the only part of the design that lets the report say more than "learners improved". Do not run it with fewer learners, because the groups would be too small to compare.

### 4.5 Exit questions

A short form at the end, with no names:

1. Which courses did you finish, and which did you stop? Why?
2. Was anything unclear, wrong or too hard? (Free text. Not sent anywhere automatically, see section 7.)
3. Did you study anywhere else on the same topics during the pilot (class, book, video)? This tells the report how much to trust the improvement.
4. Would you use the library again?

## 5. What is measured

All measures come from `docs/METRICS.md`. The pilot adds no new definitions.

| Pilot question | Measure | Notes |
|---|---|---|
| Did they improve? | M6 Assessment improvement | Primary measure. Matched items where available. |
| Do they remember? | M7b Recall retention, R7 and R30 | Primary measure. |
| Did they get through it? | M2 First-module completion, M3 Course completion rate | METRICS defines M3 as every module done. The follow-up T6.1b may change that; use its final wording (section 10, question 10). |
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

This section assumes minors are possible, as the plan's decision table says until D5 is decided. It is not legal advice. The university's ethics process and the privacy law that applies decide the final rules.

### 7.1 Before the pilot

- Get approval from the university's ethics or research committee, or a written statement from them that none is needed. The pilot lead does this, not the app.
- If any participant may be under 18, get a parent or guardian's consent as well as the learner's, and follow the local rules on minors. If the pilot is limited to adults, record how age is checked. D5 decides this.
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
- Do not publish results for any group smaller than the minimum group size (METRICS proposes 5). With a small pilot, publish totals only.
- No per-person ranking or comparison between named learners. Learners can see their own results.

### 7.4 How data leaves the device

- No network request is sent unless the learner has consented and the owner has decided D7. Section 8 proposes a manual export of a small results file that the learner hands over themselves. This keeps the pilot inside the app's offline-first rule and does not depend on T6.3.
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
| Pilot courses, reviewed, and the pilot roadmap | T7.16, T7.19 | In progress |
| **A way to get a learner's results off the device with consent** | **No task** | **Gap** |
| Consent text and ethics approval | Pilot lead | Not started |

The gap: the Class view (T5.4) imports per-profile progress files, but METRICS (section 8, question 7) notes that it is not decided whether they carry dated events. Without dated events there is no pre/post or retention. The simplest option is a small **pilot results file** the learner exports on purpose: pilot code, per-topic pre and post figures, recall check counts and completion dates, with no content. The Coordinator may want a task for this. It is raised as a question, not assumed.

## 9. How results change the roadmap

The plan already ties several decisions to the pilot. Results are read against these.

| Finding | Roadmap change |
|---|---|
| **Go** on the primary thresholds | Generate the next waves (T7.18, only after the pilot report). Tune XP values and level thresholds with the pilot data (D11). |
| Social learning: learners ask for it, or completion is low for lack of it | Decide whether to build the group features (D6: "do 5A now; decide 5B after pilot results"). Do not decide this from enthusiasm alone. Use M2, M3 and the exit answers. |
| Improvement low on topics with matched items | Review the diagnostic and the remediation paths (T3.6, T7.9) and the content of those modules, before adding courses. |
| Recall low (R7 or R30 under threshold) | Review revision spacing (1/3/7/14/30 days), the size of the review sessions and the retention checks (T6.2) before changing content. |
| Completion low | Review the 80% module gate (including the tiny-pool rule, D8), the amount of content per module, and the first-run experience. |
| Many problems classed as content problems | Send them to the course reviewers (T7.19) and to the generator's standards (T7.20), not to app work. |
| Many problems classed as app problems | Create targeted fixes in the app lanes. List them in the report with their numbers. |
| Per-question skill, difficulty and prerequisite columns | Decide D15 ("decide after the pilot; use the diagnostic map meanwhile") with the diagnostic's measured quality. |

**Reporting.** Write the Stage B results in an evaluation report with the same honesty rules as the plan: state the numbers, the n behind them, what was missing, and which limits in section 2 apply. Say which thresholds were met. Do not report a threshold as met when n is under 20. Where the report goes (a section of `docs/PILOT-REPORT.md` or a separate file) is an open question.

## 10. Open questions

These are choices this document made or could not settle. The owner or Coordinator can change them.

1. **Pilot size.** Proposed: Stage A 5 to 8 learners; Stage B 45 enrolled, about 34 finishing. Confirm or change.
2. **Success thresholds.** Proposed values in section 6. The plan gives none. Confirm them before the pilot, and do not change them afterwards.
3. **Study period.** Proposed four weeks. The right length depends on the course length, which is not known until T7.16 measures time per course.
4. **Comparison group.** Proposed only if at least 60 learners can be enrolled. Is a waitlist acceptable to the university?
5. **Audience and ages (D5).** The ethics section assumes minors are possible. If the pilot is adults only, section 7.1 can be shortened.
6. **How results leave the device.** The proposal is a manual pilot results file, because D7 (analytics) is undecided. This needs a task, which the plan does not have. Or use T6.3 if D7 allows it.
7. **Who approves ethics, and who is the pilot lead?** The plan names no owner for either.
8. **Retention of raw data.** Proposed: delete after the report is accepted. The university may require a different rule.
9. **Where the report goes.** A section of `docs/PILOT-REPORT.md` (T7.16) or a separate file.
10. **M3 meaning.** `docs/METRICS.md` (draft) defines course completion as every module done. The Coordinator's follow-up T6.1b may align it with the app's own rule (all recaps passed plus a practice test of at least 80%). The pilot should use the final wording.
11. **Review state names.** Section 3 relies on the review states of `docs/REVIEW-WORKFLOW.md` (T7.19), which is a draft.
12. **Dependence on `docs/METRICS.md`.** This document uses the metric IDs M1 to M7b from T6.1, which is not merged yet. If the owner's answers change a definition, this document may need a small update.

## 11. Related tasks

T3.1 to T3.3 (learner model, events, mastery), T3.6 (diagnostic-driven path), T5.4 (Class view), T6.1 (metrics), T6.2 (retention checks), T6.3 (opt-in analytics), T7.9 (diagnostic map and matched items), T7.16 (pilot programme end to end), T7.18 (scale waves), T7.19 (review workflow). Decisions D5, D6, D7, D11, D13, D15, D18. This list is advisory. The plan's Depends column is authoritative.
