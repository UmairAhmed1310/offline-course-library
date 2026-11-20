# Safe Browsing Basics Mastery Course

*Staying safe online with judgment*

Built in the five-layer structure around a short syllabus [R1].

## Part 0 · Start Here

### 0.1 What this course does

A small synthetic course used to test the validators.

### 0.3 The standard at a glance

| Domain | Weight | Study hours |
| --- | --- | --- |
| D1 Foundations | 60% | 2.4 |
| D2 Threats | 40% | 1.6 |

### 0.6 Diagnostic and review plan

**P1.** Which control tells people what to do? [M1-CRF] A. Policy · B. Firewall · C. Lock · D. Camera

**P2.** Which attack tries one password on many accounts? [M2-CRC] A. Brute force · B. Spraying · C. Stuffing

**P3.** What does MFA require? [M1-CUC] A. Two different factors · B. Two passwords · C. A long password · D. A PIN

| P | Ans | Domain |
| --- | --- | --- |
| P1 | A | D1 |
| P2 | B | D2 |
| P3 | A | D1 |

### 0.7 Study plan (about 4 hours)

| Order | Module | Hours | Active-recall task |
| --- | --- | --- | --- |
| 1 | M1 Foundations of Safety | 2.5 | Sort five controls |
| 2 | M2 Common Attacks | 1.5 | Name the attack from symptoms |

Plus 1 hour of review is not part of the plan table.

---

## Module 1 · Foundations of Safety

*Exam link: D1 Foundations (60%) [R1]. Objectives: controls and layers.*

**Outcomes.** By the end you can: (1) name the control types [M1-CRC]; (2) choose a control for a risk [M1-CAP].

### Remember

| Type | Job |
| --- | --- |
| Preventive | Stops it |
| Detective | Spots it |

### Understand

- Why layers: one control has gaps → an attacker finds them → a second layer covers them.

### Apply: Lab 1 · Hash a word (10 minutes)

*Ref: M1-CAP, M1-PGR*

1. [M1-PGR] Open a terminal and run:

```bash
echo -n 'hello' | sha256sum
```

2. [M1-CAP] The first hash starts with 2cf24dba.

### Analyze: symptom → cause

| Symptom | Likely cause |
| --- | --- |
| One stolen login reached every server | Flat network |

### Evaluate: verdicts

| Claim | Verdict |
| --- | --- |
| We have a firewall so we are safe | Reject: one layer is not depth |

### Recall check

Say from memory the two control types. Then explain why layers matter.

---

## Module 2 · Common Attacks

*Exam link: D2 Threats (40%) [R1]. Objectives: attacks and indicators.*

**Outcomes.** By the end you can: (1) name the attack from a symptom [M2-CAF].

### Remember

| Attack | Trait |
| --- | --- |
| Spraying | One password, many accounts |

### Understand

- Why spraying works: lockouts count per account → one guess each stays under the limit.

### Apply: Lab 2 · Inspect an email (10 minutes)

*Ref: M2-CAP*

1. Open a suspicious email and read its sender domain.
2. Write down whether the link text matches the real destination.

### Analyze: symptom → cause

| Symptom | Likely cause |
| --- | --- |
| Many accounts show one failed login | Password spraying |

### Evaluate: verdicts

| Claim | Verdict |
| --- | --- |
| Spraying and brute force are the same | Reject: spraying is one guess across many accounts |

### Recall check

Say from memory two attacks. Then explain why lockouts do not stop spraying.

---

## Part C · Putting It Together

### Case A · The false invoice

*Scenario.* An accountant opens an invoice from a look-alike domain and a macro steals her login.

*Tasks.* Name the vector. List two control failures.

*Model answer.* Vector: email. Failures: no MFA and a flat network.

### Case B · The open bucket

*Scenario.* A vendor leaves a storage bucket public and student records leak.

*Tasks.* Whose problem is it? What should be done first?

*Model answer.* It is shared; confirm and close the exposure first.

## Practice Lab · 7 Scenario Questions

**Q1.** A school puts a Cameras in use sign at the entrance mainly to discourage theft. Which control type is this? [M1-CAC] A. Corrective · B. Deterrent · C. Compensating · D. Directive

**Q2.** Select two statements that describe layered defense. [M1-CUC] A. One strong control is enough · B. Different controls cover each other's gaps · C. Trust anything inside the network · D. A failure of one layer is not a total failure · E. Buy only a firewall

**Q3.** One password is tried once against 3000 accounts. Which attack is this? [M2-CANC] A. Brute force · B. Credential stuffing · C. Password spraying · D. Rainbow table

**Q4.** (numeric) A 200000 asset loses 25000 in one event. What percent is the exposure factor? [M2-CAP]

**Q5.** (rubric) Explain the first three actions after ransomware is found and justify the order. [M2-CEP]

**Q6.** (short answer) Define least privilege in one sentence. [M1-CUF]

**Q7.** (code) Write a function ale(sle, aro) that returns the annual loss expectancy. [M2-CAP]

## Answer Key

| Q | Ans | Domain | Why |
| --- | --- | --- | --- |
| 1 | B | D1 | A visible sign discourages the attempt; the tempting detective label describes recording, not the sign |
| 2 | B, D | D1 | Layers cover each other's gaps; A and C describe single-control or perimeter trust |
| 3 | C | D2 | One password across many accounts is spraying; stuffing replays leaked pairs |
| 4 | 12.5 ± 0.1 % | D2 | 25000 divided by 200000 is 0.125, which is 12.5 percent |
| 5 | Rubric | D2 | Criteria: (C1) contains the spread first; (C2) preserves evidence; (C3) justifies the order. Pass: 2 of 3 |
| 6 | Model answer | D1 | Only the access the job needs. Criteria: (C1) names the job need; (C2) says no more than that |
| 7 | Tests | D2 | Criteria: (C1) returns sle times aro; (C2) returns zero when aro is zero |

Scoring: 6 of 7 is a good first run; the real exam is scaled.

## One-Page Cheat Sheet

| Topic | Memory |
| --- | --- |
| Control types | Preventive, detective |

## Sources, Method and Caveats

| ID | Type | Source | Link | Version or date | Accessed | Status | Used for |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | user-supplied | Synthetic syllabus | syllabus.txt | 2026 | 2026-10-21 | verified | objectives and weights |
| R2 | secondary | Example blog | https://example.org/blog | 2025 | 2026-10-21 | verified (secondary) | background |

## Library Data

### Course metadata

| Field | Value |
| --- | --- |
| schema_version | 1 |
| course_id | safe-browsing-basics |
| course_version | 1.0 |
| title | Safe Browsing Basics Mastery Course |
| language | en |
| category | Cybersecurity |
| level | beginner |
| audience | tertiary-adult |
| mode | standard |
| target_type | open-skill |
| subject_type | knowledge-decision |
| exam_version |  |
| estimated_hours | 4 |
| hours_basis | planning-assumption |
| generated_on | 2026-10-21 |
| last_verified | 2026-10-21 |
| valid_as_of |  |
| jurisdiction |  |
| risk_profile | none |
| ai_generated | yes |
| review_status | not-reviewed |
| reviewed_by |  |
| reviewed_on |  |
| generator | mastery-course-builder 0.7.0 |
| career_hints |  |
| course_prerequisites |  |
| signature |  |
| content_hash |  |

### Course index

| ID | Kind | Label | Parent | Domains | Prerequisites | Type | Points | Starts with |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mod-foundations | module | Module 1 |  | D1 |  |  |  | Foundations of Safety |
| task-hash-a-word | task | Lab 1 | mod-foundations |  |  |  |  | Hash a word (10 minutes) |
| mod-attacks | module | Module 2 |  | D2 | mod-foundations |  |  | Common Attacks |
| task-inspect-an-email | task | Lab 2 | mod-attacks |  |  |  |  | Inspect an email (10 minutes) |
| p-001 | diagnostic | P1 |  | D1 |  | mcq |  |  |
| p-002 | diagnostic | P2 |  | D2 |  | mcq |  |  |
| p-003 | diagnostic | P3 |  | D1 |  | mcq |  |  |
| case-false-invoice | case | Case A |  |  |  |  |  | The false invoice |
| case-open-bucket | case | Case B |  |  |  |  |  | The open bucket |
| q-001 | question | Q1 |  | D1 |  | mcq | 1 | A school puts a Cameras in use sign at t |
| q-002 | question | Q2 |  | D1 |  | select-two | 1 | Select two statements that describe laye |
| q-003 | question | Q3 |  | D2 |  | mcq | 1 | One password is tried once against 3000 |
| q-004 | question | Q4 |  | D2 |  | numeric | 1 | A 200000 asset loses 25000 in one event. |
| q-005 | question | Q5 |  | D2 |  | rubric | 3 | Explain the first three actions after ra |
| q-006 | question | Q6 |  | D1 |  | short-answer | 2 | Define least privilege in one sentence. |
| q-007 | question | Q7 |  | D2 |  | code | 2 | Write a function ale(sle, aro) that retu |

### Change log

| Version | Date | Changed IDs | Retired IDs | Summary |
| --- | --- | --- | --- | --- |
| 1.0 | 2026-10-21 | | | First release |
