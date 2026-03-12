---
name: copilot-brainstorm
description: Explore requirements and approaches through collaborative dialogue before planning. Helps answer WHAT to build before HOW. Use when requirements are unclear, multiple approaches exist, or trade-offs need exploration.
---

# Brainstorm a Feature or Improvement

**Note: The current year is 2026.** Use this when dating brainstorm documents.

Brainstorming helps answer **WHAT** to build through collaborative dialogue. It precedes `/copilot-plan`, which answers **HOW** to build it.

**Process knowledge:** Load the `brainstorming` skill for detailed question techniques, approach exploration patterns, and YAGNI principles.

If no feature description is provided in the user's prompt, ask: "What would you like to explore? Please describe the feature, problem, or improvement you're thinking about."

Do not proceed until you have a feature description from the user.

## Execution Flow

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

### Phase 0: Assess Requirements Clarity

Evaluate whether brainstorming is needed based on the feature description.

**Clear requirements indicators:**
- Specific acceptance criteria provided
- Referenced existing patterns to follow
- Described exact expected behavior
- Constrained, well-defined scope

**If requirements are already clear:**
Use **AskUserQuestion tool** to suggest: "Your requirements seem detailed enough to proceed directly to planning. Should I run `/copilot-plan` instead, or would you like to explore the idea further?"

### Phase 1: Understand the Idea

#### 1.1 Repository Research (Lightweight)

Run a quick repo scan to understand existing patterns:

- Task repo-research-analyst("Understand existing patterns related to: <feature_description>")

Also read existing Obsidian context if available:

```bash
obsidian read path="${BASE_PATH}/Overview.md" vault="Octarine"
obsidian read path="${BASE_PATH}/progress.md" vault="Octarine"
```

Focus on: similar features, established patterns, CLAUDE.md guidance, codebase patterns from progress.md.

#### 1.2 Collaborative Dialogue

Use the **AskUserQuestion tool** to ask questions **one at a time**.

**Guidelines (see `brainstorming` skill for detailed techniques):**
- Prefer multiple choice when natural options exist
- Start broad (purpose, users) then narrow (constraints, edge cases)
- Validate assumptions explicitly
- Ask about success criteria

**Exit condition:** Continue until the idea is clear OR user says "proceed"

### Phase 2: Explore Approaches

Propose **2-3 concrete approaches** based on research and conversation.

For each approach, provide:
- Brief description (2-3 sentences)
- Pros and cons
- When it's best suited

Lead with your recommendation and explain why. Apply YAGNI — prefer simpler solutions.

Use **AskUserQuestion tool** to ask which approach the user prefers.

### Phase 3: Capture the Design

Save brainstorm document to Obsidian:

```bash
obsidian create path="${BASE_PATH}/brainstorms/{YYYY-MM-DD}-{topic-slug}.md" vault="Octarine" content="---
tags: [copilot, brainstorm]
topic: {topic title}
date: {YYYY-MM-DD}
feature_slug: {topic-slug}
---

# Brainstorm: {Topic Title}

## What We're Building
{Summary of the feature/improvement}

## Why This Approach
{Rationale for the chosen approach}

## Key Decisions
- {Decision 1 and rationale}
- {Decision 2 and rationale}

## Approaches Considered
### Approach 1: {name} (chosen)
{Description, pros, cons}

### Approach 2: {name}
{Description, pros, cons, why rejected}

## Constraints & Requirements
- {Constraint 1}
- {Constraint 2}

## Open Questions
- {Question that still needs answering}

## Success Criteria
- {How we know this is done and working}

## Next Steps
Run \`/copilot-plan {topic-slug}\` to create implementation plan.
" silent
```

**IMPORTANT:** Before proceeding to Phase 4, check if there are any Open Questions listed. If there are open questions, YOU MUST ask the user about each one using AskUserQuestion before offering to proceed. Move resolved questions to a "Resolved Questions" section.

### Phase 4: Handoff

Use **AskUserQuestion tool** to present next steps:

**Question:** "Brainstorm captured. What would you like to do next?"

**Options:**
1. **Review and refine** — Improve the document through structured review
2. **Proceed to planning** — Run `/copilot-plan` (will auto-detect this brainstorm)
3. **Ask more questions** — Continue exploring before moving on
4. **Done for now** — Return later

**If user selects "Ask more questions":** Return to Phase 1.2 (Collaborative Dialogue) and continue asking questions one at a time to further refine the design.

**If user selects "Review and refine":** Load the `document-review` skill and apply it to the brainstorm document. When complete, return to this options list.

## Output Summary

When complete, display:

```
Brainstorm complete!

Document: Copilot/{REPO_NAME}/brainstorms/{date}-{topic}.md

Key decisions:
- [Decision 1]
- [Decision 2]

Next: Run `/copilot-plan` when ready to implement.
```

## Important Guidelines

- **Stay focused on WHAT, not HOW** — Implementation details belong in the plan
- **Ask one question at a time** — Don't overwhelm
- **Apply YAGNI** — Prefer simpler approaches
- **Keep outputs concise** — 200-300 words per section max

NEVER CODE! Just explore and document decisions.
