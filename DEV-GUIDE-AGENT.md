# Using `/handle-ticket`

This is the team's command for having Claude Code work a Jira issue or
epic end-to-end: research → plan → implement → QA → PR. Read this
before you run it on something real.

## Basic usage

```
/handle-ticket <JIRA-KEY> [optional extra context]
```

```
/handle-ticket INX-123
/handle-ticket INX-123 reuse the existing webhook handler instead of a new endpoint
/handle-ticket INX-EPIC-9
```

`<JIRA-KEY>` can be a regular issue or an epic. Everything you type after
the key is free-form context that gets passed straight to Claude.

## ⚠️ Your ticket's content is what Claude has to work with

**This is the most important thing in this doc.** Claude researches the
Jira issue (or, for an epic, the issue *and its sub-issues*) as the
starting point for everything it builds. If the issue or its sub-issues
are thin — no clear acceptance criteria, no real description, vague
titles like "fix the thing" — Claude is working from almost nothing, and
you will get a plan or an implementation that guesses at what you
actually wanted. That's not a bug in the setup; it's what "garbage in,
garbage out" looks like for this workflow specifically.

**Before running `/handle-ticket` on a ticket:**

- Check that the issue (and, for an epic, its sub-issues) has an actual
  description and acceptance criteria — not just a title.
- If it doesn't, and you're not going to go fix the Jira ticket itself
  first, **it's on you to supply that context in the command**:

  ```
  /handle-ticket INX-451
    Context:
    - We need a "resend invite" button on the team members page
    - Only visible to admins, only for invites still in "pending" status
    - Reuse the existing invite-sending logic in src/server/api/routers/team.ts,
      just add a new procedure that re-triggers it for one existing invite
    - No new UI beyond the button + a loading/success state
  ```

  Multi-line context works fine, as shown above. Claude treats the Jira
  item as the source of truth for *what* to build and your added context
  as guidance on *how* — if what you add contradicts the ticket, Claude
  will stop and ask rather than silently picking one.

- **This applies double to epics.** An epic with vague or missing
  sub-issues gives Claude a vague goal and no real scope boundary. If
  you're kicking off epic work and the sub-issues aren't fleshed out
  yet, either flesh them out in Jira first, or scope the work explicitly
  in the command itself.

If you skip this and the ticket really is too thin, don't expect Claude
to guess right — expect it to come back with clarifying questions (it's
built to stop rather than invent requirements), which just costs you a
round trip you could have skipped by writing two sentences of context
up front.

## What happens after you run it

1. **Sizing**: Claude reads the ticket and picks a size. You'll see one
   line like `Size: STANDARD (new procedure + one component). Override
   with --tiny or --full.`
2. **TINY** (copy, style, config, one-line fix): a direct edit,
   `npm run check` and `npm test`, then the PR. No agents.
3. **STANDARD** (most features): Claude plans in the main session
   (stopping for your approval only if there's a migration, a shared
   API change, or an open question), builds it, then one QA agent
   reviews it independently.
4. **FULL** (epics, auth/RLS, big schema changes, cross-portal work,
   unclear tickets): the five-agent pipeline. A Research Report, then
   an Architecture Plan (which stops for your approval if it involves
   anything security-sensitive, a destructive migration, infra changes,
   or a major architecture change), then implementation, then QA.
5. **If your change touches UI**, Claude stops before opening the PR and
   hands you a manual test checklist. You need to actually test it and
   tell Claude the results (pass, or what failed) before it continues.
6. Once QA and (if applicable) your manual testing pass, Claude opens
   the branch/PR and posts a status comment back on the Jira ticket.

## When Claude will stop and ask you something

This is normal and expected, not a failure:

- The ticket (or your added context) is ambiguous
- It hits something security-sensitive, a destructive DB migration, or
  an infrastructure change
- QA finds problems that don't get fixed within 2 rounds
- Your manual UI test reports a failure

In all of these, answer the question or give the fix details in your
next message — Claude picks the workflow back up from where it stopped,
it doesn't restart from scratch.

## Good habits

- Write real acceptance criteria on your tickets. It's the single
  biggest lever on output quality here.
- If a ticket's scope changed since it was written, say so in the
  command rather than letting Claude work from a stale description.
- For epics, either keep sub-issues current or be explicit in the
  command about which parts you actually want done in this pass.
- If the size is wrong, force it: `/handle-ticket INX-123 --full`, or
  add a Jira label `claude-tiny`, `claude-standard`, or `claude-full`
  to the ticket. The command flag wins over the label. Claude may move
  a ticket up a size by itself mid-run, but never down.