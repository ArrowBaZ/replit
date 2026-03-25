---
name: obsidian-project
description: "Core knowledge for Obsidian-backed project management. This skill provides the folder structure, Obsidian CLI patterns, and conventions used by all copilot workflow commands. Referenced internally by copilot:* commands."
---

# Obsidian Project Structure

All project context lives in Obsidian vault **Octarine** at `Copilot/{repo-name}/`.

The `{repo-name}` is always derived from `basename $(pwd)` — the current working directory name.

## Folder Structure

```
Copilot/{repo-name}/
├── Overview.md                          # Project summary, commands, tech stack, conventions
├── progress.md                          # Append-only iteration log + codebase patterns
├── prd/
│   ├── {feature-slug}.md                # PRD per feature (contains task table = state)
│   └── {another-feature}.md             # Each feature has its own PRD
├── tasks/
│   ├── {feature-slug}-T-001.md          # Individual task notes per feature
│   ├── {feature-slug}-T-002.md
│   └── {another-feature}-T-001.md
├── docs/
│   └── solutions/                       # Documented solutions (compounded knowledge)
└── reviews/
    └── {date}-{feature-slug}.md         # Code review findings
```

## Multi-Feature Support

Each feature is isolated by its `{feature-slug}`:
- **PRD file:** `prd/{feature-slug}.md` — the source of truth for that feature
- **Task files:** `tasks/{feature-slug}-T-XXX.md` — one file per task
- **No shared "current" file** — features never overwrite each other

To list all features and their status:
```bash
obsidian search query="tags: copilot prd" vault="Octarine"
# Or list files in the prd folder
obsidian files path="Copilot/{repo-name}/prd" vault="Octarine"
```

## Obsidian CLI Patterns

**Vault targeting:** Always use `vault="Octarine"` as the first parameter.

**File operations:**

```bash
# Read a file
obsidian read path="Copilot/{repo}/file.md" vault="Octarine"

# Create a new file (fails if exists)
obsidian create path="Copilot/{repo}/file.md" vault="Octarine" content="..." silent

# Overwrite a file
obsidian write path="Copilot/{repo}/file.md" vault="Octarine" content="..."

# Append to a file (for progress.md)
obsidian append path="Copilot/{repo}/progress.md" vault="Octarine" content="..."

# Search vault content
obsidian search query="search term" vault="Octarine" limit=10

# List files in a folder
obsidian files path="Copilot/{repo}/prd" vault="Octarine"

# Set frontmatter property
obsidian property:set name="status" value="completed" path="Copilot/{repo}/prd/{feature}.md" vault="Octarine"
```

**Content formatting:** Use `\n` for newlines and `\t` for tabs in content values. Quote values with spaces.

**Silent mode:** Add `silent` flag to prevent files from opening in Obsidian.

## Conventions

### progress.md (Append-Only)

Never overwrite. Always append new iterations. Structure:

```markdown
## Codebase Patterns
- [discovered patterns go here]

## Iterations

### Iteration - YYYY-MM-DD HH:MM
**Feature:** {feature-slug}
**Task:** T-XXX - Title
**Status:** passes: true|false
**What was done:** [bullets]
**Files changed:** [list]
**Learnings:** [patterns / gotchas]
**Next step:** [what to do when resuming]
```

### Overview.md (Project Context)

Contains project-specific information needed for every session:

- Project summary and tech stack
- Build, test, lint commands
- Key conventions and patterns
- File structure overview

### PRD Format (Per Feature)

Each feature gets its own PRD file at `prd/{feature-slug}.md`. The PRD IS the state file — its task table tracks completion.

```markdown
---
tags: [copilot, prd]
feature: {feature-slug}
status: active
date: YYYY-MM-DD
---

# PRD: {Feature Title}

## Introduction
{Brief description}

## Goals
{Measurable objectives}

## Tasks

| ID    | Title      | Description | Acceptance Criteria              | Priority | Passes | Notes |
|-------|------------|-------------|----------------------------------|----------|--------|-------|
| T-001 | Task title | What to do  | - criterion 1\n- criterion 2     | 1        | false  |       |
| T-002 | Next task  | What to do  | - criterion 1                    | 2        | false  |       |

## Functional Requirements
- FR-1: {requirement}

## Non-Goals
{Out of scope}

## Technical Considerations
{Architecture, patterns, files to modify}
```

### Task Files (Per Task)

Each task gets its own file at `tasks/{feature-slug}-T-XXX.md` for detailed notes, findings, and work log:

```markdown
---
tags: [copilot, task]
feature: {feature-slug}
task_id: T-XXX
passes: false
---

# T-XXX: {Task Title}

## Description
{What to implement}

## Acceptance Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}

## Notes
{Findings, decisions, blockers}

## Work Log
{Dated entries of what was done}
```

### Feature Status Lifecycle

PRD frontmatter `status` field tracks the feature lifecycle:
- `draft` — Being planned, not ready for work
- `active` — Ready for implementation
- `completed` — All tasks pass, feature done
- `archived` — Shipped and closed

### Task Status Tracking

Tasks track completion via the `Passes` column in the PRD task table:
- `false` — Not yet completed
- `true` — Completed and verified

When a task is completed, update:
1. The `Passes` cell in the PRD task table (`prd/{feature-slug}.md`)
2. The `passes` frontmatter in the task file (`tasks/{feature-slug}-T-XXX.md`)
3. Append an iteration entry to `progress.md`

### Git Operations — Developer Responsibility

The copilot workflow does NOT run git commands. The developer is responsible for:
- Creating and checking out branches before `/copilot-work`
- Committing changes after each task
- Pushing branches and creating PRs

The workflow READS git state (branch name, status) for context but never writes.
