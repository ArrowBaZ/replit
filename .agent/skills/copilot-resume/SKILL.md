---
name: copilot-resume
description: Restore context from Obsidian and continue working on a feature. Reads progress log, task status, and displays current state. Use when starting a new session to continue previous work.
---

# Resume Session

Restore full project context from Obsidian and continue where the last session left off.

## Execution

### Step 1: Load All Context

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

Read all context in parallel:

```bash
# Project context (tech stack, commands)
obsidian read path="${BASE_PATH}/Overview.md" vault="Octarine"

# Progress log (patterns + iteration history)
obsidian read path="${BASE_PATH}/progress.md" vault="Octarine"
```

### Step 2: Load All Features

List and read all PRD files:

```bash
obsidian files path="${BASE_PATH}/prd" vault="Octarine"
```

For each PRD, read frontmatter to get `status` and parse task table for completion counts.

### Step 3: Parse Last Session

From progress.md, find the most recent "Session End" or "Iteration" entry to determine:
- Last completed task and feature
- The "Next step" instruction

### Step 4: Display Status

Present a clear session restore summary:

```
Session restored for: {REPO_NAME}

Project: {from Overview.md summary}
Current branch: {git branch --show-current}

Features:
  {feature-slug-1}: {completed}/{total} tasks — status: active
  {feature-slug-2}: {completed}/{total} tasks — status: completed

Codebase Patterns:
{List patterns from progress.md — these inform coding decisions}

Last session ({date}):
  Completed: {tasks completed last session}
  Next step: {from progress.md}

Commands (from Overview.md):
  Test: {test command}
  Lint: {lint command}
  Build: {build command}

Developer: ensure you are on the correct branch before starting work.

Ready to continue? Choose a feature:
1. {feature-slug-1} — next task: T-{XXX} - {title}
2. Other — specify feature or task
```

### Step 5: Hand Off to Work

Once the user selects a feature, proceed directly to `/copilot-work {feature-slug}`.

The context is already loaded — do not re-read files.
