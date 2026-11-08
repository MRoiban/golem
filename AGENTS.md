# Golem

## Work log
`WORKLOG.md` (repo root) holds task state outside your context window.
- **On start and after compaction:** read `WORKLOG.md` and `git log --oneline -15` before acting.
- **Reality wins:** if `Now` or a Gotcha contradicts the repo or test output, trust the repo; fix the log and record the correction.
- **Update at checkpoints:** after a milestone, before a risky or long step, when the plan changes, and before you stop. Don't let the context run out with unlogged work.
- **Now** (top): keep it short; goal, verified state, next step, don'ts. Re-read it right before rewriting it, in case another agent changed it.
- **Gotchas:** when you learn something a future session would get wrong without being told (a trap, a non-obvious constraint, a fix that took several tries), add one line: `- <rule> — <evidence>`. Edit or delete it if it turns out wrong. Never condense this section. If a gotcha holds for anyone working in this repo, move it to a `## Repo rules` section in `AGENTS.md`.
- **Log** (below): append only, one line per entry: `- YYYY-MM-DD HH:MM [who]: did X → result (evidence: command/number/commit/...)`. Log failures and dead ends too. Tag anything unchecked `(unverified)`.
- Facts, not narration. Commit the log with the code it describes.
- Past ~200 lines: move lasting lessons to Gotchas, then condense the oldest half of Log into a 5-line summary at the top of Log.
- Adapt these rules to fit your work and tasks.
