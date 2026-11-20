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

**D1.** Which control tells people what to do? A. Policy · B. Firewall · C. Lock · D. Camera

**D2.** Which attack tries one password on many accounts? A. Brute force · B. Spraying · C. Stuffing

**D3.** What does MFA require? A. Two different factors · B. Two passwords · C. A long password · D. A PIN

Answers: D1 A, D2 B, D3 A.

### 0.7 Study plan (about 4 hours)

| Order | Module | Hours | Active-recall task |
| --- | --- | --- | --- |
| 1 to 2 | M1 to M2 Foundations and Attacks | 2.5, 1.5 | Sort controls, name attacks |

Plus 1 hour of review is not part of the plan table.

---

## Module 1 · Foundations of Safety

*Exam link: D1 Foundations (60%) [R1]. Objectives: controls and layers.*

**Outcomes.** By the end you can: (1) name the control types; (2) choose a control for a risk.

### Remember

| Type | Job |
| --- | --- |
| Preventive | Stops it |
| Detective | Spots it |

### Understand

- Why layers: one control has gaps → an attacker finds them → a second layer covers them.

### Apply: Lab 1 · Hash a word (10 minutes)

1. Open a terminal and run:

```
echo -n 'hello' | sha256sum
```

2. The first hash starts with 2cf24dba.

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

**Outcomes.** By the end you can: (1) name the attack from a symptom.

### Remember

| Attack | Trait |
| --- | --- |
| Spraying | One password, many accounts |

### Understand

- Why spraying works: lockouts count per account → one guess each stays under the limit.

### Apply: Lab 2 · Inspect an email (10 minutes)

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

**Case A · The false invoice.** An accountant opens an invoice from a look-alike domain and a macro steals her login.

*Tasks.* Name the vector. List two control failures.

*Model answer.* Vector: email. Failures: no MFA and a flat network.

**Case B · The open bucket.** A vendor leaves a storage bucket public and student records leak.

*Tasks.* Whose problem is it? What should be done first?

*Model answer.* It is shared; confirm and close the exposure first.

## Practice Lab · 7 Scenario Questions

**Q1.** A school puts a Cameras in use sign at the entrance mainly to discourage theft. Which control type is this? 
A. Corrective · B. Deterrent · C. Compensating · D. Directive

**Q2.** Select two statements that describe layered defense. A. One strong control is enough · B. Different controls cover each other's gaps · C. Trust anything inside the network · D. A failure of one layer is not a total failure · E. Buy only a firewall

**Q3.** One password is tried once against 3000 accounts. Which attack is this? A. Brute force · B. Credential stuffing · C. Password spraying · D. Rainbow table

**Q4.** (numeric) A 200000 asset loses 25000 in one event. What percent is the exposure factor?

**Q5.** (rubric) Explain the first three actions after ransomware is found and justify the order.

**Q6.** (short answer) Define least privilege in one sentence.

**Q7.** (code) Write a function ale(sle, aro) that returns the annual loss expectancy.

## Answer Key

| Q | Ans | Domain | Why |
| --- | --- | --- | --- |
| 1 | B | D1 | A visible sign discourages the attempt; the tempting detective label describes recording, not the sign |
| 2 | B, D | D1 | Layers cover each other's gaps; A and C describe single-control or perimeter trust |
| 3 | C | D2 | One password across many accounts is spraying; stuffing replays leaked pairs |
| 4 | 12.5 | D2 | 25000 divided by 200000 is 0.125, which is 12.5 percent |
| 5 | Rubric | D2 | Criteria: (C1) contains the spread first; (C2) preserves evidence; (C3) justifies the order. Pass: 2 of 3 |
| 6 | Model answer | D1 | Only the access the job needs. Criteria: (C1) names the job need; (C2) says no more than that |
| 7 | Tests | D2 | Criteria: (C1) returns sle times aro; (C2) returns zero when aro is zero |

Scoring: 6 of 7 is a good first run; the real exam is scaled.

## One-Page Cheat Sheet

| Topic | Memory |
| --- | --- |
| Control types | Preventive, detective |

## Sources, Method and Caveats

| ID | Source | Link | Status |
| --- | --- | --- | --- |
| R1 | Synthetic syllabus | syllabus.txt | verified |
