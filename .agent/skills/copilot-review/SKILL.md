---
name: copilot-review
description: Perform exhaustive code reviews using multi-agent analysis and ultra-thinking. Saves findings to Obsidian with severity levels and action items. Use after completing work on a feature.
---

# Review Code

Perform exhaustive code reviews using multi-agent analysis, ultra-thinking deep dives, and structured findings saved to Obsidian.

The user should specify a feature slug or PR number in their prompt. If not provided, list active/completed features and ask which to review.

## Execution

### Step 1: Load Context & Setup

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

Read project context:
```bash
obsidian read path="${BASE_PATH}/Overview.md" vault="Octarine"
```

**If feature-slug provided:** Read its PRD:
```bash
obsidian read path="${BASE_PATH}/prd/{feature-slug}.md" vault="Octarine"
```

**If PR number provided:** Use `gh pr view {number} --json files,title,body` (read-only)

**If nothing provided:** List active/completed features and ask which to review:
```bash
obsidian files path="${BASE_PATH}/prd" vault="Octarine"
```

Determine changed files (read-only):
```bash
git diff main...HEAD --name-only
```

### Step 2: Load Review Agents

Read `compound-engineering.local.md` in the project root. If found, use `review_agents` from YAML frontmatter. If the markdown body contains review context, pass it to each agent as additional instructions.

#### Parallel Agents (Always Run)

Run all configured review agents in parallel using Agent tool:

```
Task {agent-name}(changed files + PRD context + review context from settings)
```

Additionally, always run these regardless of settings:
- Task code-simplicity-reviewer(changed files) — Can we simplify?
- Task learnings-researcher(changed files + feature context) — Past solutions relevant?

**For TypeScript/React projects** (detected from Overview.md):
- Task kieran-typescript-reviewer(changed files)

#### Conditional Agents (Run if applicable)

**If PR contains database migrations or schema changes:**
- Task data-migration-expert(changed files) — Validates mappings, rollback safety

**For security-sensitive changes:**
- Task security-sentinel(changed files)

**For performance-critical changes:**
- Task performance-oracle(changed files)

### Step 3: Ultra-Thinking Deep Dive

For each phase below, spend maximum cognitive effort. Think step by step. Consider all angles.

#### Phase 1: Stakeholder Perspective Analysis

1. **Developer Perspective** — How easy is this to understand and modify? Are APIs intuitive? Is debugging straightforward?
2. **Operations Perspective** — How to deploy safely? What metrics/logs are available? Resource requirements?
3. **End User Perspective** — Is the feature intuitive? Are error messages helpful? Is performance acceptable?
4. **Security Perspective** — What's the attack surface? Data protection? Compliance requirements?

#### Phase 2: Scenario Exploration

- [ ] **Happy Path**: Normal operation with valid inputs
- [ ] **Invalid Inputs**: Null, empty, malformed data
- [ ] **Boundary Conditions**: Min/max values, empty collections
- [ ] **Concurrent Access**: Race conditions, deadlocks
- [ ] **Network Issues**: Timeouts, partial failures
- [ ] **Resource Exhaustion**: Memory, disk, connections
- [ ] **Data Corruption**: Partial writes, inconsistency
- [ ] **Cascading Failures**: Downstream service issues

### Step 4: Multi-Angle Review

#### Technical Excellence
- Code craftsmanship and engineering best practices
- Technical documentation quality

#### Business Value
- Feature completeness validation
- Performance impact on users

#### Risk Management
- Security and operational risk
- Technical debt accumulation

### Step 5: Synthesize Findings

Collect all agent reports and ultra-thinking analysis:

- [ ] Collect findings from all parallel agents
- [ ] Surface learnings-researcher results: flag related past solutions as "Known Pattern"
- [ ] Categorize by type: security, performance, architecture, quality
- [ ] Assign severity: P1 (Critical), P2 (Important), P3 (Nice-to-have)
- [ ] Remove duplicate or overlapping findings
- [ ] Estimate effort for each finding (Small/Medium/Large)

**P1 (Critical):** Security vulnerabilities, data corruption risks, breaking changes — BLOCKS MERGE
**P2 (Important):** Performance issues, architectural concerns, quality problems
**P3 (Nice-to-have):** Minor improvements, cleanup, documentation

### Step 6: Save Review to Obsidian

```bash
obsidian create path="${BASE_PATH}/reviews/{YYYY-MM-DD}-{feature-slug}.md" vault="Octarine" content="---
tags: [copilot, review]
feature: {feature-slug}
date: {YYYY-MM-DD}
status: open
p1_count: {N}
p2_count: {N}
p3_count: {N}
---

# Review: {Feature Title}

**Feature:** [[prd/{feature-slug}]]
**Date:** {YYYY-MM-DD}
**Files reviewed:** {count}

## Summary
{Overall assessment — 2-3 sentences}

## P1 - Critical (Blocks Merge)

### Finding 1: {title}
**File:** {path:line}
**Problem:** {description}
**Suggested fix:** {how to fix}
**Effort:** Small|Medium|Large

{Or 'None' if no P1 findings}

## P2 - Important

### Finding N: {title}
**File:** {path:line}
**Problem:** {description}
**Suggested fix:** {how to fix}
**Effort:** Small|Medium|Large

## P3 - Nice-to-have

### Finding N: {title}
**File:** {path:line}
**Problem:** {description}
**Suggested fix:** {how to fix}
**Effort:** Small|Medium|Large

## Agents Used
- {list of agents and what they found}

## Action Items
- [ ] {specific fix from P1}
- [ ] {specific fix from P2}

## Known Patterns
{Past solutions surfaced by learnings-researcher, with links}
" silent
```

### Step 7: Present Results

```
Review complete: Copilot/{REPO_NAME}/reviews/{date}-{feature-slug}.md

Findings: {P1} critical, {P2} important, {P3} nice-to-have

{If P1 > 0: "BLOCKS MERGE — P1 findings must be resolved first"}
```

Use **AskUserQuestion tool**:

**Options:**
1. **Fix P1 findings now** — Create tasks from P1 findings, run `/copilot-work`
2. **Fix all findings** — Create tasks from all findings, run `/copilot-work`
3. **View review in Obsidian** — Open for manual review
4. **Run end-to-end tests** — Browser testing on affected pages
5. **Done** — Developer handles fixes manually

If user chooses to fix findings, create new task entries in the PRD task table and new task files for each finding, then proceed with `/copilot-work {feature-slug}`.

### Step 8: End-to-End Testing (Optional)

If user requests testing, detect project type from Overview.md:

**For Web Projects:**
Spawn a subagent:
```
Task general-purpose("Run /test-browser. Test affected pages, check console errors, capture screenshots.")
```

Present any failures as additional P1 findings and add them to the review document in Obsidian.

### Important: P1 Findings Block Merge

Any P1 (CRITICAL) findings must be addressed before merging the PR. Present these prominently and ensure they're resolved.
