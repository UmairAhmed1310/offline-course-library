# <script>alert("title")</script> Hostile Strings Course (about 1 hours)

Edge-case fixture (T0.5b): hostile strings in every place the importer reads. Nothing here may become live markup when the course is shown. These are test strings only.

## Module 1 · <img src=x onerror=alert(1)>

**link:** D1

<script>alert("paragraph")</script>

A paragraph with **<b onclick="alert(2)">bold</b>** and `<script>` and [a link](javascript:alert(3)) and <a href="javascript:alert(4)">anchor</a>.

&lt;b&gt; already-escaped text &amp; an entity &#60;script&#62;

- <iframe src="javascript:alert(5)"></iframe>
- "><svg onload=alert(6)>

| Header <svg onload=alert(7)> | ' onmouseover='alert(8) |
| --- | --- |
| <style>*{display:none}</style> | <!-- comment --><math><mtext>cell</mtext></math> |

```
<script>alert("code fence")</script>
```

### Recall check

What is it? (1) <img src=x onerror=alert(9)>. (2) "><script>alert(10)</script>.

## Practice Lab

**Q1.** Which is safe? <svg onload=alert(11)> (mcq) A. <script>alert(12)</script> · B. "><img src=x onerror=alert(13)> · C. ' onmouseover='alert(14) · D. [link](javascript:alert(15))

**Q2.** What is two plus two? (numeric) Enter a number.

## Answer Key

| Q | Answer | Domain | Why |
| --- | --- | --- | --- |
| 1 | B | D1 | <iframe src="javascript:alert(16)"></iframe> |
| 2 | 4 ± 0 | D1 | <b onmouseover=alert(17)>four</b> |

## Library Data

| ID | Kind | Label | Parent | Bloom |
| --- | --- | --- | --- | --- |
| xss-mod-1 | module | Module 1 | | |
| xss-q-1 | question | Q1 | xss-mod-1 | remember |
| xss-q-2"><img src=x onerror=alert(18)> | question | Q2 | xss-mod-1 | apply |
