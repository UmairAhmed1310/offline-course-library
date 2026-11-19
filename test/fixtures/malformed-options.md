# Malformed Options Course (about 1 hours)

Edge-case fixture (T0.5b): each question below is broken in a different way. Q10 and Q11 are well-formed controls. The importer must warn about the broken ones, must not score them, and must not crash.

## Module 1 · Broken questions

**link:** D1

Plain text for module one.

## Practice Lab

**Q1.** Options on separate lines, not on one line. (mcq)
A. alpha
B. beta
C. gamma
D. delta

**Q2.** Only three options. A. alpha · B. beta · C. gamma

**Q3.** The key names a letter that is not an option. A. alpha · B. beta · C. gamma · D. delta

**Q4.** An mcq whose key has two letters. A. alpha · B. beta · C. gamma · D. delta

**Q5.** A select-two whose key has one letter. (select two) A. alpha · B. beta · C. gamma · D. delta

**Q6.** The letters skip C. A. alpha · B. beta · D. delta · E. epsilon

**Q7.** Lower-case option letters. a. alpha · b. beta · c. gamma · d. delta

**Q8.** A numeric question whose key is words. (numeric) Enter a number.

**Q9.** A numeric question with no tolerance. (numeric) Enter a number.

**Q10.** Control: a well-formed mcq. A. alpha · B. beta · C. gamma · D. delta

**Q11.** Control: five options. A. alpha · B. beta · C. gamma · D. delta · E. epsilon

## Answer Key

| Q | Answer | Domain | Why |
| --- | --- | --- | --- |
| 1 | B | D1 | Options were not on one line. |
| 2 | B | D1 | Only three options. |
| 3 | E | D1 | E is not an option. |
| 4 | A, B | D1 | Two letters for an mcq. |
| 5 | A | D1 | One letter for a select-two. |
| 6 | A | D1 | Skipped letter. |
| 7 | b | D1 | Lower-case letters. |
| 8 | many | D1 | Not a number. |
| 9 | 42 | D1 | No tolerance given. |
| 10 | B | D1 | Control. |
| 11 | E | D1 | Control with five options. |
| 99 | B | D1 | A key row with no question. |
