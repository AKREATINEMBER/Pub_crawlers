# Handoffs: Cowork ⇄ Claude Code

Ideas and design happen in Cowork. Building happens in Claude Code. This folder is how the two talk.

## The files
| File | Written by | What it is |
|---|---|---|
| `NNN-short-name.md` | Cowork | One build task: what to build (with exact numbers), where in the code, how to test, what "done" means. |
| `NNN-short-name.result.md` | Claude Code | What was built, test and sim numbers, screenshots taken, commit hash, open questions, and anything that felt off. |

Numbers go up: 001, 002, … One task per file.

## Status
The first line of every handoff is its status. Claude Code updates it as it works:

- `STATUS: READY` — agreed with David, waiting to be built
- `STATUS: IN PROGRESS` — Claude Code is on it
- `STATUS: DONE` — built, tested, committed (see the `.result.md`)
- `STATUS: BLOCKED — <why>` — needs a decision. Write the question in the result file and stop.

## For Claude Code
When David says "check the handoffs" (or at the start of a session):
1. Find the lowest-numbered file that is `STATUS: READY`.
2. Follow `CLAUDE.md` and the handoff.
3. Write the `.result.md` file.
4. Set the status line.

Never edit a handoff's spec. If it's wrong or unclear, say so in the result file.

## For Cowork
Read the `.result.md` files before designing the next step.
