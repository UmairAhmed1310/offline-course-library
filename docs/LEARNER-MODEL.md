# Learner model: data design, formulas and thresholds

**Task:** T3.1 (Implementation Task Plan, Phase 3) · **Version:** 0.1 draft · **Date:** 2026-11-18
**Status:** proposed, for review before any coding (plan T3.1 step 4). Not yet triaged by the Coordinator or reviewed by the owner.

This document says what the app should remember about what a learner knows, how that is turned into a mastery figure per topic, and which numbers decide the bands. It is a design. It changes no code. T3.2 (record events) and T3.3 (topic mastery) build from it, and T3.4 to T3.9, T4.5, T6.2, T6.5 and T7.9 read from it.

Anything marked **Proposal** is a choice made by this document because the plan gives no value, or gives only an example. Section 14 lists the choices a reviewer must confirm. Nothing here is decided.

## 1. What this document covers

The plan's T3.1 has four steps. The Coordinator has narrowed the task to a document (STATUS_v0015):

| Plan step | Covered here? |
|---|---|
| 1. Define a topic as the domain `dom` or a `Skill` value, document both | **Yes**, section 2. The topic is the diagnostic domain `dom`. The `Skill` value is described as a later refinement. |
| 2. Add optional Library Data columns `Skill`, `Difficulty`, `Prereq`, `Hint` (Schema v1.1) | **No.** Deferred by decision D15 ("decide after the pilot; use the diagnostic map meanwhile"). D15 must be decided before T7.18. Section 12 says what the model uses in the meantime. |
| 3. Specify the stored structure and the event log | **Yes**, sections 4 and 5. |
| 4. Write `docs/LEARNER-MODEL.md` with formulas and thresholds | **Yes**, this document. |

The plan's "done when" also asks that the parser accepts new columns. That part is not done by this document and needs D15 and a code lane.

## 2. Topic

**Definition (Proposal).** A **topic** is a course domain: the code that the course gives to a group of modules and questions, such as `D1` or `C3`. The domain codes of one course are the same in four places, and the model relies on that:

| Where the code appears | Today's app |
|---|---|
| The module's link line (`Exam link:` or `Competency link:`) | Read as the module's `dom` |
| The Domain column of the answer key (one row per practice question) | Read as the question's `dom` |
| The `(Dn)` marker in the diagnostic `Answers:` line | Read as the diagnostic item's `dom` |
| The Domains column of the Course index | Not read by the app |

A topic is **per profile and per course**. `D1` in one course and `D1` in another are different topics.

**A question with no domain** belongs to the topic `General`. This is what the practice-test result screen does today for such a question.

**Granularity limit.** Several modules can share one domain, and a recap question is tied to a module through its domain (or through the Course index parent, which Course Schema v1 leaves empty; see `docs/CONTRACTS.md`, finding F2). So a topic's mastery cannot say which module of the domain is weak. T3.6 maps a weak domain to every module that has the same `dom`, as the skill's diagnostic standard says the app should.

**The `Skill` refinement (later).** The skill's diagnostic map (`diagnostic.json`, T7.9) gives a `skill` slug and a `tier` for each diagnostic item, and a `parallel` practice question. These cover diagnostic items and their parallel questions only, not every practice question. So a skill-level model cannot be complete without D15. This design keeps one record shape for both, and an event carries an optional `sk` (the skill slug). When the map is read, the same aggregation can run per skill. Until then there is one level: the domain.

## 3. What the app stores today (reading, not running)

Source: `docs/METRICS.md` section 1.1 (checked at main 4a260700) and a reading of `index.html` at main 181219dc for the facts marked here. The app was not run.

| Today | What it means for the model |
|---|---|
| `diag` holds the **latest** diagnostic only: time, correct, total, the ids of missed items, and the flagged domains. | The first diagnostic is lost on a retake. The baseline for METRICS M6 needs it (section 8). |
| A diagnostic flags a domain when **two or more** of its items are missed. It counts misses only, not how many items the domain had. | The model's band can differ from this flag (section 8). |
| `att[]` holds practice-test attempts: time, correct, total, level, attempt number. No per-domain figures. The result screen computes correct and total per domain, but they are not stored. | Per-domain history of practice tests does not exist yet. |
| `rec[module]` holds the best recap score and the number of tries, with no date. | Recap attempts leave no dated trace. |
| `seen[]` holds question keys, with no correctness. | It cannot seed mastery. |
| `rv[module]` holds the latest review stage and due time. The ladder is 1, 3, 7, 14 and 30 days. | Review history is not kept. |
| `run` is the attempt number. A course reset adds one and clears `done`, `dt`, `rec`, `seen`, `rv` and `diag`, and keeps `att` and `ach`. | The model must decide whether a reset clears it (open question 5). |

**Not stored today:** correctness of any single answer, the date of a recap attempt, any answer to a flashcard, response time, confidence.

## 4. The event record (what T3.2 writes)

One record for every answer to a scored or self-rated item. T3.2 owns the writing, the cap and the compaction. This section fixes the meaning of each field so that T3.3 to T3.9 and the metrics read the same thing.

| Field | Meaning | Rule |
|---|---|---|
| `t` | Time of the answer, in milliseconds since 1970 | From the device clock, like `att[].t`. |
| `q` | The item answered | The Library Data ID (`q-NNN`, `p-NNN`) when the course has it. Otherwise the label (`Q12`, `P3`). For a flashcard, the card ID that T3.8 defines; until then the module ID. |
| `topic` | The topic of the item | The question's `dom`, or `General`. |
| `sk` | The skill slug | Optional. Only for items the diagnostic map names (section 2). |
| `s` | The score of the answer | **0**, **0.5** or **1**, or `null`. See below. |
| `mode` | Where the answer came from | `diag`, `recap`, `practice`, `smart`, `card` (the plan's list). |
| `conf` | How sure the learner said they were | 0 (Guess), 1 (Think so), 2 (Sure), or `null` if not asked (T3.4). |
| `ms` | Response time in milliseconds | Optional. Not used by any formula here. |
| `run` | The attempt number of the course | From `run` today. Lets analysis separate attempts. |

**The course is not stored in the event.** The events live inside the profile-course record (section 5), so the course is implied. The plan's example record has a `course` field; leaving it out saves about 20 bytes per event.

**The score `s` (Proposal, replaces the plan's `correct`).** The plan has `correct` as true, false or null. A flashcard self-rating has three values ("Got it", "Partly", "Again"). So:

| Source | `s` |
|---|---|
| Right answer; flashcard "Got it" | 1 |
| Flashcard "Partly" | 0.5 |
| Wrong answer; flashcard "Again" | 0 |
| Not scored: unanswered, "I don't know" (when the app has it), or an item the app cannot grade | `null` |

A `null` event is kept in the log (it is evidence of an attempt) and **does not count** toward `n` or any figure in section 6. The skill's own rule is that "I don't know" counts as unanswered, not wrong. The skill's rule that two or more unanswered in one domain suggests Needs support is not used here (open question 6).

**What is not recorded.** No question text, answer text, course text or free text. An event is a few short fields.

**Local date.** The metrics need the learner's local date (METRICS principle 4). Two ways: store `d` (the local date as `YYYY-MM-DD`) in each event (about 17 bytes more), or derive it from `t` with the device's time zone when read. The second is smaller but gives a wrong date if the time zone changes. **Proposal:** derive it from `t`, and keep a separate list of active days (section 10), which is written once and does not change when the zone changes.

## 5. The stored structure

Kept inside the existing record for one profile and one course (the same record that holds `done`, `att` and `diag` today), under one new key. **Proposal:** the key is `lm` (learner model), with its own version number so that T1.12's storage schema can migrate it.

```text
lm = {
  v: 1,
  topics: { "<topic>": {n, correct, w, s, tw, conf, first}, ... },
  log: [ {t, q, topic, s, mode, conf, ms, run}, ... ],     // newest last
  days: [ "2026-11-17", ... ],                             // local dates with a meaningful event
  seeded: false
}
```

The topic record, with the plan's field names where they fit:

| Field | Plan's name | Meaning |
|---|---|---|
| `n` | `n` | Number of counted answers (those with `s` not `null`), ever. |
| `correct` | `correct` | Sum of `s` over counted answers. It can end in .5. |
| `w` | (new) | The decayed weight: the count of answers, each shrunk by how old it is (section 6). |
| `s` | (new) | The decayed sum of scores, with the same shrinking. |
| `tw` | `lastSeen` | The time of the last counted answer. It is also the time at which `w` and `s` are valid. |
| `conf` | `conf[]` | Three pairs `[wrong, right]` for confidence 0, 1, 2. Empty until T3.4 asks. |
| `first` | (new) | A snapshot of the learner's **first** diagnostic answers in this topic: `{t, n, correct}`. Written once. Never compacted (section 8). |

**Why `w` and `s` and not one number `ewma`.** The plan's `ewma` is a single number. A mastery figure that weights recent answers more, with a half-life in days, cannot be updated correctly from a single number: it also needs to know how much evidence the number stands on. So the stored pair `(w, s)` replaces it. **The mastery figure itself is not stored.** It is computed whenever it is shown, from `(w, s, tw)` and the current time. That is why it can never be out of date.

## 6. Mastery: the formula

**Parameters (Proposal; plan values where it gives one).**

| Name | Value | Source |
|---|---|---|
| Half-life `H` | 14 days | Plan, T3.3 ("about 14 days") |
| Prior weight `a` | 1 (one imaginary answer) | Plan says "a small prior"; the size is this document's choice |
| Prior value `p` | 0.5 | This document's choice |
| Minimum answers | 3 | Plan, T3.3 |

**Writing an answer** with score `s` at time `t` to a topic whose record has `(w, s_sum, tw)`:

```text
k  = 2 ^ ( -(t - tw) / H )        -- how much the old evidence has faded since the last answer (k = 1 for the first answer)
w  = w * k + 1
s_sum = s_sum * k + s
tw = t
n  = n + 1
correct = correct + s
```

**Reading mastery** at time `T`:

```text
k  = 2 ^ ( -(T - tw) / H )
mastery = ( s_sum * k + a * p ) / ( w * k + a )
```

`T - tw` is measured in days (a real number). A topic with no counted answer has no mastery.

**What this does, in words.**

- Every answer counts as 1 when it is fresh. After 14 days it counts as one half, after 28 days one quarter.
- With no new answers, the evidence fades and the figure drifts toward 0.5 (the prior). So an old "Mastered" does not stay Mastered forever. This is intended: recent practice is what shows knowledge.
- The prior stops one or two answers from giving 0% or 100%.

**Raw accuracy against displayed mastery** (all answers fresh, so no fading):

| Answers | Right | Mastery | Band |
|---|---|---|---|
| 3 | 3 / 3 | 0.875 | Mastered |
| 3 | 2 / 3 | 0.625 | Developing |
| 3 | 1 / 3 | 0.375 | Needs support |
| 5 | 4 / 5 | 0.750 | Developing |
| 5 | 3 / 5 | 0.583 | Developing |
| 5 | 2 / 5 | 0.417 | Needs support |
| 10 | 9 / 10 | 0.864 | Mastered |
| 10 | 8 / 10 | 0.773 | Developing |
| 10 | 5 / 10 | 0.500 | Developing |
| 10 | 4 / 10 | 0.409 | Needs support |
| 20 | 17 / 20 | 0.833 | Mastered |
| 20 | 16 / 20 | 0.786 | Developing |

**A consequence a reviewer must see.** Because the prior pulls toward 0.5, a learner with exactly 80% raw accuracy (8 of 10, 16 of 20) shows 77% to 79%, which is "Developing", not "Mastered". The model is a little stricter than the 80% module gate for small numbers of answers. The effect shrinks as answers accumulate. Option B is to apply the bands to the unshrunk figure `s_sum / w`, which gives 80% for 8 of 10 and relies on the 3-answer minimum alone to stop one lucky answer. This document proposes the prior (the plan asks for it) and asks the reviewer to choose (open question 2).

**Fading with no new answers** (ten right answers on day 0, read later):

| Read on day | Mastery | Band |
|---|---|---|
| 0 | 0.955 | Mastered |
| 14 | 0.917 | Mastered |
| 28 | 0.857 | Mastered |
| 56 | 0.692 | Developing |
| 112 | 0.519 | Developing |

(Ten wrong answers on day 0 rise slowly: 0.045 on day 0, 0.083 on day 14, 0.308 on day 56, so a learner who stopped practising is not shown as hopeless forever.)

## 7. Bands and the "not enough data" rule

| Mastery | Band (plan, T3.3) |
|---|---|
| Fewer than 3 counted answers (`n < 3`) | **Not enough data yet** (no band, no bar) |
| Below 0.50 | **Needs support** |
| 0.50 to below 0.80 | **Developing** |
| 0.80 and above | **Mastered** |

The thresholds match the skill's diagnostic bands (`diagnostic-standards.md` section 8: below 50%, 50 to 79%, 80% and above). The skill calls the top band **Strong** where the plan says **Mastered**. **Proposal:** the app shows "Mastered" for a topic (it has been practised over time) and the diagnostic screen may say "Strong" for a first-look result; open question 3.

**Show how the number was made** (plan T3.3 step 4): "5 answers counted, last practised 3 days ago." The screen shows `n` and the age of `tw`. It does not show `w` or `s_sum`.

**The 3-answer rule uses `n`, not `w`.** After a long break the topic keeps its band label (computed from faded evidence) rather than reverting to "Not enough data yet".

## 8. Diagnostics: baseline, flagged domains and matched pairs

**Baseline (METRICS M6).** M6 compares a learner's first diagnostic with their mastery later. Today a retake overwrites `diag`. So the **first** diagnostic answers per topic are kept in `first` and in the log (diagnostic events are never compacted, section 10). If the first diagnostic happened before T3.2 was released, the baseline is the latest one, and `first` carries `approx: true`.

**Flagged domains.** Today a domain is flagged when two or more of its items are missed, whatever the number of items. The model gives a band instead. With all answers fresh:

| Items in the domain | Missed | Model mastery | Model band | Flagged today? |
|---|---|---|---|---|
| 3 | 0 | 0.875 | Mastered | no |
| 3 | 1 | 0.625 | Developing | no |
| 3 | 2 | 0.375 | Needs support | **yes** |
| 4 | 1 | 0.700 | Developing | no |
| 4 | 2 | 0.500 | Developing | **yes** |
| 5 | 2 | 0.583 | Developing | **yes** |
| 5 | 3 | 0.417 | Needs support | **yes** |

With three items per domain (the skill's floor) the two rules agree. With four or more they differ at two misses: the flag says "extra time", the model says "Developing". **Proposal:** until T3.6 is built the app keeps today's flag unchanged. T3.6 then uses the model's bands: Needs support becomes **Recommended**, Developing becomes **Standard**, Mastered becomes **Skim / test out**. This is open question 4.

**Matched pairs (METRICS M6, EVALUATION).** Pre/post comparisons use matched items: a diagnostic item and its `parallel` practice question from the diagnostic map. For that the log must keep the item ID `q` of every diagnostic event and every matched post-test event. So: diagnostic events are never compacted; practice events of a question named as a `parallel` are not compacted until T7.9 says they can be.

## 9. Confidence and calibration (what T3.4 can rely on)

The plan's T3.4 asks "How sure are you?" before the answer is shown, optional. The model stores the answer as `conf` (0, 1, 2) in the event and counts it in the topic's `conf` pairs. The classes, as definitions for T3.4:

| Class | Rule |
|---|---|
| Lucky guess | `s` = 1 and `conf` = 0 |
| Solid knowledge | `s` = 1 and `conf` is 1 or 2 |
| Unsure error | `s` = 0 and `conf` is 0 or 1 |
| **Confident error** | `s` = 0 and `conf` = 2 |

A partial score (0.5) is not classed. An event with `conf` of `null` is not classed. T3.4 says confident errors weigh more "in recommendations"; this document does **not** change the mastery formula for that. The weight is applied by T3.9 when it orders the plan (open question 7).

## 10. Storage, the cap and compaction

**Size.** An event such as `{"t":1768000000000,"q":"q-012","topic":"D3","s":1,"mode":"recap","conf":2,"ms":8400,"run":1}` is about 100 bytes as JSON. The plan's example cap of 5,000 events per profile-course is therefore about **0.5 MB** for one profile and one course in the worst case. A learner with several courses and profiles multiplies that. Backups include the events (plan T3.2 step 3), so the backup grows by the same amount.

**Cap (Proposal).** Keep the plan's 5,000 as the default cap, and make it one constant so T3.2 or the owner can lower it. The owner may prefer a lower cap (for example 2,000) after T1.10 shows how much storage the device allows.

**Compaction.** The topic record `(n, correct, w, s, tw, conf)` is updated **on every write**, so it already contains every answer ever counted. Compaction therefore does not need to rebuild anything. It deletes the oldest events from `log` when the cap is passed, **except**:

- events with `mode` = `diag` (a diagnostic has at most 30 items; a few attempts are small);
- events of a question named as a matched `parallel` (section 8);
- the single event that gave `first`.

"Compaction keeps counts exact" (plan T3.2 done-when) is then true by construction: `n` and `correct` never come from the log.

**What is lost when events are deleted.** The per-answer detail (time of each answer, which question, response time). The metrics that need only counts and dates (M4 active days, M2, M3) do not depend on old events: active days are kept in their own short list, `days`, one local date per day with a meaningful event (METRICS: a recap attempt, five reviewed cards, or a finished module). That list is about 11 bytes a day, so a year is about 4 KB.

## 11. Privacy, backups and sharing

- **On the device only.** The log and the topic records contain no text and no name. They leave the device only through a backup file that the learner exports (T1.9), or in a class file or a pilot results file that the learner chooses to share (T5.4, T6.7).
- **Per-topic summary** (what a class file or pilot file may carry): for each topic, `n`, `correct` and the current mastery band. Never the log. This is consistent with the owner's decision of 2026-11-13: class files hold the plan's safe subset plus stored dates and per-topic summaries, no raw event logs in v1.
- **Hidden and private courses never leave the device** (owner, 2026-11-13). A summary or a file must leave them out.
- **Backups include `lm`** (plan T3.2 step 3). **Merging a backup into existing data** is the rule T1.9a defines. For the model it needs an answer: the log can be merged by union on `(t, q, mode, run)`, but a topic record cannot be rebuilt from a log that was compacted. Open question 8.
- **Not synced** anywhere until consent exists (plan T3.2 step 3, T6.3).
- **Minors are possible** (owner, 2026-11-13). The model stores nothing that identifies a person.

## 12. Migration from what the app stores today

When T3.2 first runs on a device that already has data:

| Today's data | What the model does |
|---|---|
| `diag` (latest) and the stored course's diagnostic items with their `dom` | **Seed** one set of `diag` events at the time `diag.t`: a missed item gets `s` = 0, every other item of that diagnostic gets `s` = 1. Mark `seeded: true` and `first.approx: true`. Skip the seed if the course is no longer stored. |
| `att[]` | Nothing: no per-domain figures were kept. |
| `rec[module]` | Nothing: a best score with no date and no per-answer data. |
| `seen[]` | Nothing: no correctness. |
| `rv[module]` | Nothing for the model. T3.8 migrates schedules (plan T3.8 step 4). |

The model starts almost empty on an existing device, and says "Not enough data yet" until a learner has answered three items in a topic. This is honest. It must not guess.

**Reset.** A course reset clears `done`, `dt`, `rec`, `seen`, `rv`, `diag` and keeps `att` and `ach`. **Proposal:** it keeps `lm`, like `att`: the log records what the learner knows, and `run` separates attempts. Mastery also fades with time. The learner-visible "erase everything" (T2.11) is the place to clear it. Open question 5.

## 13. What the other tasks can rely on

| Task | What it reads from this model |
|---|---|
| T3.2 | The event record (section 4), the structure (section 5), the cap and compaction (section 10), the seed (section 12). |
| T3.3 | The formula and parameters (section 6), the bands (section 7), the fixtures (section 15). |
| T3.4 | `conf` and the four classes (section 9). |
| T3.5 | The model has no `Difficulty`. The plan's step "estimate difficulty from the share of learners who answered correctly" needs answers from **many learners**; a device holds one learner's answers (or a few profiles), so that estimate is not available from this model (open question 9). The diagnostic's `tier` is available for diagnostic items only. |
| T3.6 | Domain bands (section 7), mapped to Recommended, Standard, Skim / test out (section 8). Test-out passes through the recap at 80%; the model never locks a module. |
| T3.7 | Weakest topics = lowest mastery with `n` of at least 3; unseen items from `seen[]` and the log. |
| T3.8 | `mode` = `card` events and `s` = 0.5 for "Partly". The card schedule is T3.8's own structure; this document does not define it. |
| T3.9 | Mastery and `tw` for "Mastery 42% in Subnetting" lines; confident errors from `conf`. |
| T4.5 | Topic bands and `n` for a skill tree view; prerequisites are deferred with D15. |
| T6.2 | The retention check reuses items answered correctly earlier (METRICS M7b): from the log, events with `s` = 1; recall events are written with `mode` = `card` or a new mode T6.2 names. |
| T6.5 | Item analysis across learners needs a pooled data set (a pilot file); a device holds one learner. |
| T7.9 | The diagnostic map's `skill`, `tier` and `parallel` become `sk` on events and the matched-pair rule (section 8). |
| T1.12 | The storage schema carries `lm` with its own `v`, and must keep it through the re-parse of stored courses. |

## 14. Open questions for the reviewer

1. **The score.** Is `s` in {0, 0.5, 1, null} acceptable in place of the plan's `correct` (true, false, null)? It is needed for the "Partly" flashcard rating. If not, "Partly" would have to count as wrong or be left out.
2. **The prior.** Keep a prior of one imaginary answer at 0.5 (as proposed; 8 of 10 shows "Developing"), or apply the bands to the unshrunk figure (option B; 8 of 10 shows "Mastered")? A different prior size also moves the thresholds.
3. **Band names.** "Mastered" (plan) for the topic band and "Strong" (skill) for the diagnostic screen, or one word everywhere?
4. **Flag against band.** Keep today's "two or more misses" flag until T3.6, then replace it with the model's bands. Is that right, and should the diagnostic screen keep both?
5. **Reset.** Does a course reset clear `lm` or keep it? Proposed: keep, and clear on "erase everything" (T2.11).
6. **"Unanswered".** The skill suggests that two or more unanswered items in a domain point to Needs support. This model ignores unanswered items (`s` = `null`). Keep it that way?
7. **Where confident errors weigh.** In T3.9 recommendations only (proposed), or also in mastery?
8. **Backup merge.** What is the merge rule for a topic record when two backups both hold compacted logs (T1.9a)? Options: take the record with the later `tw`; or add `n` and `correct` and recompute `w` and `s` from the latest `tw`. Both lose exactness; the second is closer.
9. **Cross-learner difficulty (T3.5).** The plan estimates difficulty from the share of learners who answer correctly. On one device that share does not exist. Defer to a pooled file (T6.7 or T5.4), or drop the estimate and use the diagnostic's `tier` where it exists?
10. **Active days list.** Is a separate `days` list acceptable, or should T3.2 derive days from the log only (which compaction would lose)?
11. **D15.** The model needs `Skill`, `Difficulty` and `Prereq` per question for skill-level mastery, difficulty and prerequisites. Decide D15 after the pilot as planned, but before T7.18. The model works on domains until then.
12. **Checked against the code?** The statements in section 3 about today's app are from reading `index.html` at 181219dc. A merged task (T1.9, T1.12) may change them.

## 15. Fixtures for the T3.3 tests

Values were computed by running the formulas of section 6 with `H` = 14, `a` = 1, `p` = 0.5. A tolerance of 0.0005 is enough. Days are real numbers; time zone and daylight saving do not matter because the formula uses elapsed days.

| # | Answers `(day, s)` | Read on day | n | `w` | `s_sum` | Mastery | Band |
|---|---|---|---|---|---|---|---|
| F1 | (0,1) (0,1) (0,1) | 0 | 3 | 3.0000 | 3.0000 | 0.8750 | Mastered |
| F2 | eight (0,1) and two (0,0) | 0 | 10 | 10.0000 | 8.0000 | 0.7727 | Developing |
| F3 | nine (0,1) and one (0,0) | 0 | 10 | 10.0000 | 9.0000 | 0.8636 | Mastered |
| F4 | (0,0) (0,0) (7,1) (7,1) (7,1) | 14 | 5 | 4.4142 | 3.0000 | 0.6360 | Developing |
| F5 | (0,1) (0,0) (3,0.5) (3,0.5) (10,1) | 10 | 5 | 3.6332 | 2.3166 | 0.6079 | Developing |
| F6 | (0,1) (0,1) | 0 | 2 | 2.0000 | 2.0000 | 0.8333 | Not enough data yet (n < 3) |
| F7 | (0,1) (0,null) (0,1) (0,1) | 0 | 3 | 3.0000 | 3.0000 | 0.8750 | Mastered (the null is not counted) |
| F8 | ten (0,1) | 28 | 10 | 10.0000 | 10.0000 | 0.8571 | Mastered (read after 28 days) |
| F9 | ten (0,1) | 56 | 10 | 10.0000 | 10.0000 | 0.6923 | Developing (evidence has faded) |

Notes: in F4, `w` and `s_sum` are the values **at the time of the last answer** (day 7), before reading on day 14. In F5 they are the values at day 10. F8 and F9 show `w` and `s_sum` at day 0; the reading applies the fading of section 6.

Also test: an event with `s` = `null` changes `lm.log` but not `n`, `correct`, `w`, `s` or `tw`; compaction removes old non-diagnostic events and changes none of `n`, `correct`, `w`, `s`; a second diagnostic does not change `first`.

## 16. Related tasks

T1.9a and T1.12 (backup and storage schema), T2.11 (erase everything), T3.2 to T3.9, T4.5, T6.1 and T6.1b (`docs/METRICS.md`), T6.2, T6.5, T6.6 and T6.6b (`docs/EVALUATION.md`), T6.7, T7.9, T7.20a (`docs/CONTRACTS.md`). Decisions D8, D15. This list is advisory. The plan's Depends column is authoritative.
