---
name: copilot-status
description: Show current project status from Obsidian. Displays all features, task completion, and recent progress without starting work. Use for a quick check-in on project state.
---

# Project Status

Display current project status from Obsidian without starting any work.

## Execution

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

### Read State

```bash
# All feature PRDs
obsidian files path="${BASE_PATH}/prd" vault="Octarine"

# Recent progress
obsidian read path="${BASE_PATH}/progress.md" vault="Octarine"

# Git state (read-only)
git branch --show-current
git status --short
```

For each PRD file, read and parse the task table.

### Display

```
Project: {REPO_NAME}
Branch: {current branch}

Features:

  {feature-slug-1} — active
  {progress bar: [########....] 67%} — {completed}/{total} tasks
  | ID    | Title    | Passes |
  |-------|----------|--------|
  | T-001 | {title}  | true   |
  | T-002 | {title}  | true   |
  | T-003 | {title}  | >> next|
  | T-004 | {title}  | false  |

  {feature-slug-2} — completed
  All {N} tasks done.

Last activity: {date from most recent iteration}
Next step: {from progress.md}

Quick actions:
  /copilot-work {feature-slug}   — Work on a feature
  /copilot-plan [description]    — Plan a new feature
  /copilot-resume                — Full context restore
  /copilot-review {feature-slug} — Review a feature
  /copilot-stop                  — Save and stop
```
