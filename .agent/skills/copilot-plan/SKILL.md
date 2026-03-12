---
name: copilot-plan
description: Plan a feature with PRD and task files, saved to Obsidian. Includes brainstorm detection, parallel research, SpecFlow analysis, and configurable detail levels. Use when starting a new feature or planning work.
---

# Plan a Feature

**Note: The current year is 2026.** Use this when dating plans.

Take a feature description, generate a PRD with granular tasks, and save everything to Obsidian for execution. Each feature is isolated — planning a second feature does NOT overwrite the first.

If no feature description is provided in the user's prompt, ask: "What feature would you like to plan? Describe the problem, requirement, or improvement."

Do not proceed until you have a clear feature description from the user.

## Execution

### Step 0: Load Project Context

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

Read existing project context:

```bash
obsidian read path="${BASE_PATH}/Overview.md" vault="Octarine"
obsidian read path="${BASE_PATH}/progress.md" vault="Octarine"
```

Extract test/build/lint commands from Overview.md — these are needed for acceptance criteria.

List existing features to avoid naming conflicts:

```bash
obsidian files path="${BASE_PATH}/prd" vault="Octarine"
```

### Step 1: Idea Refinement

**Check for brainstorm output first:**

Search for recent brainstorm documents that match this feature:

```bash
obsidian search query="tags: copilot brainstorm" vault="Octarine"
obsidian files path="${BASE_PATH}/brainstorms" vault="Octarine"
```

**Relevance criteria:** A brainstorm is relevant if:
- The topic (from filename or YAML frontmatter) semantically matches the feature description
- Created within the last 14 days
- If multiple candidates match, use the most recent one

**If a relevant brainstorm exists:**
1. Read the brainstorm document **thoroughly** — every section matters
2. Announce: "Found brainstorm from [date]: [topic]. Using as foundation for planning."
3. Extract and carry forward **ALL** of the following:
   - Key decisions and their rationale
   - Chosen approach and why alternatives were rejected
   - Constraints and requirements discovered during brainstorming
   - Open questions (flag these for resolution during planning)
   - Success criteria and scope boundaries
4. **Skip the idea refinement questions below** — the brainstorm already answered WHAT to build
5. **Critical:** Reference specific decisions with `(see brainstorm: {filename})` when carrying forward conclusions.

**If multiple brainstorms could match:**
Use **AskUserQuestion tool** to ask which brainstorm to use, or whether to proceed without one.

**If no brainstorm found, run idea refinement:**

Refine the idea through collaborative dialogue using the **AskUserQuestion tool**:
- Ask questions one at a time to understand the idea fully
- Prefer multiple choice questions when natural options exist
- Focus on: purpose, constraints, and success criteria
- Continue until the idea is clear OR user says "proceed"

**Gather signals for research decision.** During refinement, note:
- **User's familiarity**: Do they know the codebase patterns?
- **Topic risk**: Security, payments, external APIs warrant more caution
- **Uncertainty level**: Is the approach clear or open-ended?

**Skip option:** If the feature description is already detailed, offer:
"Your description is clear. Should I proceed with research, or would you like to refine it further?"

### Step 2: Local Research (Always Runs — Parallel)

Run these agents **in parallel** to gather local context:

- Task repo-research-analyst(feature_description)
- Task learnings-researcher(feature_description)

**What to look for:**
- **Repo research:** existing patterns, CLAUDE.md guidance, technology familiarity, similar implementations with file paths
- **Learnings:** documented solutions in Obsidian (`docs/solutions/`) and codebase patterns from `progress.md` that might apply

### Step 2.5: Research Decision

Based on signals from Step 1 and findings from Step 2, decide on external research.

**High-risk topics → always research.** Security, payments, external APIs, data privacy.

**Strong local context → skip external research.** Codebase has good patterns, CLAUDE.md has guidance.

**Uncertainty or unfamiliar territory → research.** New technology, no codebase examples.

**Announce the decision and proceed.**

### Step 2b: External Research (Conditional)

**Only run if Step 2.5 indicates external research is valuable.**

Run these agents in parallel:
- Task best-practices-researcher(feature_description)
- Task framework-docs-researcher(feature_description)

### Step 2c: Consolidate Research

After all research steps complete:
- Document relevant file paths from repo research (e.g., `src/components/Example.tsx:42`)
- Include relevant institutional learnings (key insights, gotchas to avoid)
- Note external documentation URLs and best practices (if external research was done)
- Capture CLAUDE.md conventions

**Optional validation:** Briefly summarize findings and ask if anything looks off or missing.

### Step 3: SpecFlow Analysis

Run SpecFlow Analyzer to validate and refine the feature specification:

- Task compound-engineering:workflow:spec-flow-analyzer(feature_description, research_findings)

Incorporate any identified gaps or edge cases into the PRD.

### Step 4: Generate Feature Slug

Convert the feature title to a kebab-case slug:
- `Add dark mode support` → `dark-mode-support`
- `Fix cart total calculation` → `fix-cart-total`

### Step 5: Choose Detail Level

Use **AskUserQuestion tool** to ask: "How detailed should this plan be?"

**Options:**
1. **Minimal** — Problem + acceptance criteria + context. Best for simple bugs, small improvements.
2. **Standard** — Adds background, technical considerations, system-wide impact, success metrics. Best for most features.
3. **Comprehensive** — Adds implementation phases, alternatives considered, risk analysis, integration test scenarios. Best for major features, architectural changes.

### Step 6: Generate PRD

Self-clarify these questions (do NOT ask the user):
1. **Problem/Goal:** What problem does this solve?
2. **Core Functionality:** What are the 2-3 key actions?
3. **Scope/Boundaries:** What should this NOT do?
4. **Success Criteria:** How to verify it works?
5. **Constraints:** Technical/time constraints?

**Stakeholder analysis:**
- Who will be affected? (end users, developers, operations)
- What's the implementation complexity?

Generate PRD using the chosen detail level template:

#### Minimal Template

```markdown
---
tags: [copilot, prd]
feature: {feature-slug}
status: active
date: YYYY-MM-DD
type: feat|fix|refactor
origin: brainstorms/{date}-{topic}.md  # if from brainstorm
---

# {Feature Title}

{Brief problem/feature description}

## Acceptance Criteria
- [ ] Core requirement 1
- [ ] Core requirement 2

## Context
{Critical information}

## Tasks

| ID    | Title       | Description    | Acceptance Criteria                | Priority | Passes | Notes |
|-------|-------------|----------------|------------------------------------|----------|--------|-------|
| T-001 | {title}     | {description}  | - {criterion 1}\n- {criterion 2}  | 1        | false  |       |

## Sources
- Similar implementations: {file_path:line_number}
```

#### Standard Template

Includes everything from Minimal plus:

```markdown
## Overview
{Comprehensive description}

## Problem Statement / Motivation
{Why this matters}

## Proposed Solution
{High-level approach}

## Technical Considerations
- Architecture impacts
- Performance implications
- Security considerations

## System-Wide Impact
- **Interaction graph**: What callbacks/middleware/observers fire when this runs?
- **Error propagation**: How do errors flow across layers?
- **State lifecycle risks**: Can partial failure leave orphaned state?
- **API surface parity**: What other interfaces need the same change?

## Success Metrics
{How we measure success}

## Dependencies & Risks
{What could block or complicate this}
```

#### Comprehensive Template

Includes everything from Standard plus:

```markdown
## Technical Approach

### Architecture
{Detailed technical design}

### Implementation Phases
#### Phase 1: {Foundation}
#### Phase 2: {Core Implementation}
#### Phase 3: {Polish & Optimization}

## Alternative Approaches Considered
{Why rejected}

## Integration Test Scenarios
{3-5 cross-layer scenarios unit tests won't catch}

## Risk Analysis & Mitigation
{Comprehensive risk assessment}
```

**Task rules:**
- 8-15 granular tasks per PRD
- Each task does ONE thing
- Separate investigation from implementation
- Every acceptance criterion is boolean pass/fail
- Include project test commands (from Overview.md) in acceptance criteria
- Order: investigation → schema → backend → UI → verification

### Step 7: Brainstorm Cross-Check

**If plan originated from a brainstorm**, re-read the brainstorm document and verify:
- [ ] Every key decision from the brainstorm is reflected in the plan
- [ ] The chosen approach matches what was decided
- [ ] Constraints are captured in acceptance criteria
- [ ] Open questions are resolved or flagged
- [ ] Sources section references the brainstorm

### Step 8: Pre-Submission Checklist

- [ ] Title is searchable and descriptive
- [ ] All template sections are complete
- [ ] Acceptance criteria are measurable and machine-verifiable
- [ ] File paths referenced in code examples and todo lists
- [ ] Task table is complete with all tasks

### Step 9: Save to Obsidian

```bash
# 1. PRD with task table (this is the state file)
obsidian create path="${BASE_PATH}/prd/{feature-slug}.md" vault="Octarine" content="{full PRD}" silent

# 2. Individual task files
obsidian create path="${BASE_PATH}/tasks/{feature-slug}-T-001.md" vault="Octarine" content="---\ntags: [copilot, task]\nfeature: {feature-slug}\ntask_id: T-001\npasses: false\n---\n\n# T-001: {title}\n\n## Description\n{description}\n\n## Acceptance Criteria\n- [ ] {criterion}\n\n## Notes\n\n## Work Log\n" silent
# Repeat for each task...
```

### Step 10: Present Options

Use **AskUserQuestion tool**:

**Question:** "Plan saved to Obsidian. What would you like to do next?"

**Options:**
1. **Review in Obsidian** — Open and refine the PRD manually
2. **Deepen the plan** — Run `/compound-engineering:deepen-plan` for parallel research enhancement
3. **Review and refine** — Structured self-review using `document-review` skill
4. **Start working** — Run `/copilot-work {feature-slug}`
5. **Done for now** — Return later

Based on selection:
- **Deepen:** Run `/compound-engineering:deepen-plan`, then re-save to Obsidian
- **Review and refine:** Load `document-review` skill, apply to PRD, then return to options
- **Work:** Proceed to `/copilot-work {feature-slug}`

Loop back to options after review/refinement until user selects work or done.

## Developer Prerequisites

Before starting work on this feature, the developer should:
1. Create a feature branch: `git checkout -b feat/{feature-slug}`
2. Ensure dev environment is running if needed

NEVER CODE! Just research and write the plan.
