---
name: copilot-stop
description: Save current session progress to Obsidian before ending. Dumps iteration log, current state, and next steps so work can be resumed later. Use when stopping work or ending a session.
---

# Stop Session

Save current progress to Obsidian before ending the session. This ensures context is preserved for resuming later.

## Execution

### Step 1: Gather State

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

Collect current state:

```bash
# Read current branch and uncommitted changes (read-only)
git branch --show-current
git status --short

# Read active features from Obsidian
obsidian files path="${BASE_PATH}/prd" vault="Octarine"
```

For each active feature PRD, read the task table to calculate completion.

### Step 2: Check for Uncommitted Work

If there are uncommitted changes:
- Warn: "You have uncommitted changes. Remember to commit before ending your session."
- Note the uncommitted files in the progress entry

### Step 3: Determine Progress Summary

For each active feature:
- Tasks completed vs total (from PRD task table)
- Current task being worked on (if any)
- Last completed task ID

### Step 4: Append Progress to Obsidian

```bash
obsidian append path="${BASE_PATH}/progress.md" vault="Octarine" content="\n\n### Session End - {YYYY-MM-DD HH:MM}\n\n**Active features:**\n- {feature-slug-1}: {completed}/{total} tasks done\n- {feature-slug-2}: {completed}/{total} tasks done\n\n**Completed this session:**\n- {list of tasks completed during this session}\n\n**Current state:**\n- Branch: {current branch}\n- {uncommitted changes or 'clean working tree'}\n\n**Next step:** {exactly what to do when resuming — specific feature and task ID}\n\n**To resume:**\n\`\`\`\n/copilot-resume\n\`\`\`"
```

### Step 5: Developer Reminders

```
Session saved to Obsidian.

Progress:
{For each active feature: feature-slug: completed/total tasks}

Before closing:
  - [ ] Commit any uncommitted changes
  - [ ] Push your branch if needed

Resume anytime with: /copilot-resume
```
