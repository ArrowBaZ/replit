# Copilot Workflow

Obsidian-backed AI development workflow for persistent, session-resumable feature development.

All project context, PRDs, tasks, and progress live in your Obsidian vault — not in the repo. Stop a session, come back later, and pick up exactly where you left off.

## Skills

| Skill | Description |
|-------|-------------|
| `/copilot-init` | Initialize project workspace in Obsidian |
| `/copilot-brainstorm` | Explore requirements before planning (WHAT to build) |
| `/copilot-plan` | Plan a feature with PRD + tasks (HOW to build) |
| `/copilot-work` | Execute tasks with Obsidian tracking |
| `/copilot-review` | Multi-agent code review with ultra-thinking |
| `/copilot-stop` | Save progress before ending session |
| `/copilot-resume` | Restore context for a new session |
| `/copilot-status` | Quick status check (all features) |
| `/copilot-compound` | Document a solved problem (parallel subagents) |

## Workflow

```
/copilot-init                    Set up project once
       |
/copilot-brainstorm [idea]       (Optional) Explore WHAT to build
       |
/copilot-plan [description]      Plan HOW — PRD + tasks in Obsidian
       |                         (auto-detects brainstorm if exists)
       |
  Developer: create branch, checkout
       |
/copilot-work [feature-slug]     Execute tasks, test, update Obsidian
       |                         (can /copilot-stop and /copilot-resume)
       |
  Developer: commit changes
       |
/copilot-review [feature-slug]   Ultra-thinking + multi-agent review
       |
  Developer: push, create PR
       |
/copilot-compound                Document learnings (5 parallel agents)
```

## Multi-Feature Support

Each feature is fully isolated. Planning a second feature does NOT overwrite the first.

```
/copilot-plan "Add dark mode"       -> prd/dark-mode.md + tasks/dark-mode-T-*.md
/copilot-plan "Fix cart totals"     -> prd/fix-cart-totals.md + tasks/fix-cart-totals-T-*.md
/copilot-work dark-mode             -> works on dark-mode tasks only
/copilot-status                     -> shows both features and their progress
```

## Where Things Live

```
Obsidian Vault: Octarine
Path: Copilot/{repo-name}/
├── Overview.md                     — Project context (commands, stack, conventions)
├── progress.md                     — Append-only iteration log + patterns
├── brainstorms/
│   └── {date}-{topic}.md           — Brainstorm documents
├── prd/
│   ├── {feature-a}.md              — PRD for feature A (task table = state)
│   └── {feature-b}.md              — PRD for feature B
├── tasks/
│   ├── {feature-a}-T-001.md        — Task notes for feature A
│   └── {feature-b}-T-001.md        — Task notes for feature B
├── docs/solutions/                 — Compounded knowledge
└── reviews/                        — Code review findings
```

## Git Operations

The workflow does NOT run git commands. The developer handles:
- Branch creation and checkout
- Committing changes after tasks
- Pushing and creating PRs

The workflow reads git state (branch, status) for context only.

## Session Lifecycle

1. **Explore (optional):** `/copilot-brainstorm [idea]`
2. **Plan:** `/copilot-plan [description]` — auto-detects brainstorm
3. **Developer:** Create and checkout feature branch
4. **Work:** `/copilot-work [feature-slug]`
5. **Stop:** `/copilot-stop` — saves everything to Obsidian
6. **Resume:** `/copilot-resume` — restores full context
7. **Review:** `/copilot-review` — multi-agent analysis
8. **Developer:** Commit, push, create PR
9. **Document:** `/copilot-compound` — capture learnings

## Requirements

- Obsidian with CLI (`obsidian` command available)
- Vault named "Octarine" with a `Copilot/` folder
- `gh` CLI for PR review info (optional)
