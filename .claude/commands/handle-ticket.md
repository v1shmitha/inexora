---
description: Triage a Jira issue or epic, then route it automatically: TINY (direct edit), STANDARD (single session + QA agent), or FULL (five-agent pipeline)
argument-hint: <JIRA-KEY> [--tiny|--standard|--full] [free-form context]
---

Execute the ticket workflow for: $ARGUMENTS

The first token in the arguments above is the Jira key (issue or epic,
e.g. `INX-123` or `INX-EPIC-9`). Everything after it, if anything, is
user-provided additional context — implementation hints, scope limits,
or constraints. It supplements the Jira item; it never silently
overrides its requirements. If it conflicts with the Jira item, stop and
ask before proceeding (per CLAUDE.md's Additional Context rules).

## Step 0: Size the ticket (main session, no subagent)

Before spinning up any agent, fetch the Jira item yourself via the
Atlassian MCP tools: title, issue type, description, acceptance
criteria, labels, story points (if the field exists), and whether it
has child issues. Skim for any file references.

### Manual override (always wins)

If the arguments contain `--tiny`, `--standard`, or `--full`, or the
Jira issue has a label `claude-tiny`, `claude-standard`, or
`claude-full`, use that size and skip the scoring below. If the flag
and the label disagree, the flag in the command wins. Strip the flag
from the user context before passing it on.

### Automatic sizing

Pick the **first** size whose conditions match:

**FULL** if ANY of these is true:
- It is an epic, or has child issues
- It touches auth, login, roles/permissions, RLS policies, or
  `supabase/setup.sql`
- It changes `prisma/schema.prisma` in a destructive way, or adds or
  changes more than one model
- It affects more than one role portal (student, lecturer,
  institution, employer, admin), or adds a new portal-level feature
- Story points are 5 or more
- The acceptance criteria are missing or unclear enough that real
  research is needed to even know what to build
- You expect roughly 8 or more files to change

**TINY** if ALL of these are true:
- One file, or two trivially related files (e.g. a component and its
  style)
- No change to the Prisma schema, tRPC procedure signatures, auth, or
  env vars
- No new component, page, or route
- The acceptance criteria leave no design decision open
- Story points are 1 or less, if set
- Typical examples: copy/text change, a style or spacing fix, a config
  value, an obvious one-line bug fix, a typo

**STANDARD** otherwise. This is most feature work: a new procedure
plus its UI, an additive single-model schema change, a bug spanning a
few files.

**When torn between two sizes, pick the larger one.** Undersizing is
the expensive mistake.

State the result in one line before doing anything else, in this
form:

> Size: STANDARD (new tRPC procedure + one UI component, additive
> schema change). Override with `--tiny` or `--full`.

### Escalating mid-run

If, once you are in the code, the work turns out bigger than its size
(TINY touches more files or needs a design choice; STANDARD hits auth,
RLS, a destructive migration, or grows past roughly 8 files), stop,
say so in one line, and move up one size, keeping any work already
done that is still valid. Never move down a size on your own.

## Jira status (all sizes)

Keep the Jira issue's status in step with the work, using the Atlassian
MCP tools (get the issue's available transitions, then transition it):

1. **In Progress**: right after you state the size, move the issue to
   In Progress.
2. **In Review**: right after the PR is opened, move the issue to In
   Review (a transition to "Code Review" or "Review" counts too).
3. **Done**: never set this yourself. Merging the PR moves the issue to
   Done through a Jira automation rule. The user merges, not you.

Rules:
- Match transitions by their target status name, ignoring case. If the
  workflow has no matching transition, skip that step and say so in
  one line. A missing status never stops or fails the ticket.
- Never move an issue backwards: if it is already at that status or
  further along (e.g. already In Review or Done), leave it.
- For an epic key, don't change the epic's status; only move the child
  issues you actually work on.
- If you stop to wait for the user (approval, open question, manual UI
  test), leave the status as it is.

## TINY path

No subagents. In the main session:

1. Create the branch `feature/<issue-key>-<slug>` from an up-to-date
   `main`.
2. Make the change directly, following existing patterns in the
   touched file(s).
3. Run `npm run check` (lint + typecheck) and `npm test`.
4. If it touches UI, give the user a short manual check (2 to 4 items)
   and wait for "passed" before pushing.
5. Commit, push, open the PR, move the issue to In Review (see Jira
   status above), and post the Jira comment yourself, using
   the same conventions as the full pipeline (see CLAUDE.md).

## STANDARD path

Main session only, plus **one** `qa-reviewer` agent for an independent
review. No researcher, architect, implementer, or pr-manager agents.

1. **Research briefly** in the main session: only the files the change
   touches and the patterns it must follow.
2. **Write a short plan** and show it: files to change, approach, how
   each acceptance criterion will be met, and any open question.
   - **Stop for approval** if the plan includes a Prisma migration, a
     change to a tRPC procedure signature used elsewhere, an open
     question, or anything that deviates from the ticket.
   - Otherwise continue straight away; the user can still interrupt.
3. **Implement** on `feature/<issue-key>-<slug>`, following the
   implementer agent's rules in `.claude/agents/implementer.md`
   (migration rules, no edits to existing migrations, minimal diff,
   `npm run lint:fix`, `npm run check`, `npm test`, and permission
   tests for any new or changed tRPC procedure).
4. **QA**: launch the `qa-reviewer` agent with the ticket's acceptance
   criteria, the plan, and the diff. Fix what it finds yourself, then
   re-run it; at most 2 rounds, then stop and report as in the full
   pipeline.
5. **UI gate**: same as step 5 of the full pipeline.
6. **PR**: push, open the PR, move the issue to In Review (see Jira
   status above), and post the Jira comment yourself, using
   the PR and Jira formats in `.claude/agents/pr-manager.md`.

## FULL path (full pipeline)

1. **Researcher agent**
   - Fetch the Jira key. If it's an epic, also fetch its child issues.
   - Fetch linked issues.
   - Incorporate any additional context passed above.
   - Research the codebase.
   - Produce the Research Report.

2. **Architect agent**
   - Turn the Research Report into an Architecture Plan.
   - If the plan flags security-sensitive changes, infra changes,
     destructive migrations, or a major architectural change: **stop
     here** and show the plan to the user for explicit approval before
     continuing.

3. **Implementer agent**
   - Create the feature branch.
   - Implement per the approved plan.
   - Update API docs if applicable.
   - Run `npm run check` and `npm test`.

4. **QA reviewer agent** (max 2 fix-and-recheck rounds)
   - Review the implementation against the plan and acceptance criteria.
   - If issues are found: send back to the implementer agent with the
     specific list, then re-run QA.
   - If QA still fails after **2 rounds** of fixes: stop and report the
     remaining issues to the user instead of looping a third time. Ask
     whether to keep iterating, adjust the plan, or hand it off for a
     human look — don't keep spending cycles silently.

5. **Change-type gate**
   - If the implementation includes UI/frontend changes:
     - Generate manual test cases (normal usage, key edge cases, likely
       failure states — not just the happy path) as a checklist.
     - **Stop and wait** for the user to test manually and report back.
     - If failures are reported: send details back to the implementer
       agent, fix, then regenerate test cases for re-verification.
     - Only proceed once the user explicitly confirms the tests passed.
   - If backend-only: skip this gate, continue automatically.

6. **PR manager agent**
   - Push the branch, open the PR, and post the Jira update comment.

Stop at any point (per CLAUDE.md) if requirements are ambiguous,
security-sensitive changes are detected, infrastructure changes are
required, a destructive migration is detected, or a major architectural
change is required — even if none of the steps above already caught it.