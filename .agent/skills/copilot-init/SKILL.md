---
name: copilot-init
description: Initialize a new project workspace in Obsidian for AI-assisted development. Creates folder structure, Overview with project context, and empty progress log. Use when setting up a new project for the copilot workflow.
---

# Initialize Copilot Project

Set up a new project workspace in Obsidian vault **Octarine** for tracking features, PRDs, tasks, and progress.

## Execution

### Step 1: Detect Project Info

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

Gather project context automatically:

1. **Read README.md**, AGENTS.md, CLAUDE.md (project root and `.agents/`, `.claude/`, `.copilot/`, `.agent/`) for conventions and instructions
2. **Read package.json** or equivalent for tech stack, scripts, and dependencies
3. **Detect test/build/lint commands** from package.json scripts, Makefile
4. **Note current git branch and remote** for context (read-only)

### Step 2: Check If Already Initialized

```bash
obsidian read path="${BASE_PATH}/Overview.md" vault="Octarine"
```

If the project folder already exists, ask: "Project `{REPO_NAME}` already exists in Obsidian. Overwrite, or skip initialization?"

### Step 3: Write Overview.md

The Overview contains all project-specific context needed for every session. Generate it from the gathered info:

```markdown
---
tags: [copilot, project, overview]
repo: {REPO_NAME}
created: YYYY-MM-DD
---

# {REPO_NAME}

## Project Summary
{Auto-detected or user-provided description}

## Tech Stack
- **Framework:** {detected}
- **Language:** {detected}
- **Build tool:** {detected}
- **Testing:** {detected}

## Commands

| Action | Command |
|--------|---------|
| Build | `{detected build command}` |
| Test | `{detected test command}` |
| Lint | `{detected lint command}` |
| Dev server | `{detected dev command}` |
| Fix/Format | `{detected fix command}` |

## Key Conventions
{Extracted from CLAUDE.md or detected patterns}

## File Structure
{Brief overview of src/ layout}
```

```bash
obsidian create path="${BASE_PATH}/Overview.md" vault="Octarine" content="..." silent
```

### Step 4: Create Progress Log

```bash
obsidian create path="${BASE_PATH}/progress.md" vault="Octarine" content="---\ntags: [copilot, progress]\n---\n\n# Progress Log - {REPO_NAME}\n\n> Read this at the start of every session. Append iterations using obsidian append.\n\n## Codebase Patterns\n\n> Patterns discovered during development - always read before starting\n\n_No patterns logged yet._\n\n---\n\n## Iterations\n\n_No iterations logged yet._" silent
```

### Step 5: Confirm

```
Project initialized in Obsidian:
  Vault: Octarine
  Path: Copilot/{REPO_NAME}/
  Files created:
    - Overview.md (project context + commands)
    - progress.md (iteration log)

Next steps:
  1. /copilot-plan [feature description] — Plan your first feature
  2. Review Overview.md in Obsidian to verify detected commands
```
