---
name: copilot-compound
description: Document a recently solved problem to Obsidian using parallel subagents for maximum efficiency. Captures root cause, solution, and prevention strategies. Use after fixing a tricky bug or discovering an important pattern.
---

# Compound Knowledge

Coordinate multiple subagents working in parallel to document a recently solved problem to Obsidian.

**Why "compound"?** Each documented solution compounds your team's knowledge. The first time you solve a problem takes research. Document it, and the next occurrence takes minutes. Knowledge compounds.

If context is provided in the user's prompt, use it. Otherwise, analyze recent activity to determine what was solved.

## Preconditions

Before running, verify:
- Problem has been solved (not in-progress)
- Solution has been verified working
- Non-trivial problem (not simple typo or obvious error)

If preconditions aren't met, inform the user and suggest waiting.

## Execution Strategy: Two-Phase Orchestration

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

**Only ONE file gets written — the final documentation.** Phase 1 subagents return TEXT DATA to the orchestrator. They must NOT create any files. Only the orchestrator (Phase 2) writes the final document to Obsidian.

### Phase 1: Parallel Research

Read project context first:
```bash
obsidian read path="${BASE_PATH}/progress.md" vault="Octarine"
```

If no context was provided, analyze recent activity:
- Read progress.md iterations for recent learnings
- Read recent git log (read-only): `git log --oneline -10`
- Ask: "What problem did you just solve? Brief description is fine."

Launch these subagents **IN PARALLEL**. Each returns text data to the orchestrator:

#### 1. Context Analyzer
- Extracts conversation history and recent changes
- Identifies problem type, component, symptoms
- Returns: YAML frontmatter skeleton with tags, category, date

#### 2. Solution Extractor
- Analyzes all investigation steps taken
- Identifies root cause
- Extracts working solution with code examples
- Returns: Solution content block (symptom, root cause, fix)

#### 3. Related Docs Finder
- Searches Obsidian for related solutions:
  ```bash
  obsidian search query="{problem keywords}" vault="Octarine"
  ```
- Identifies cross-references and links
- Returns: Links and relationships

#### 4. Prevention Strategist
- Develops prevention strategies
- Creates best practices guidance
- Generates test cases if applicable
- Returns: Prevention/testing content

#### 5. Category Classifier
- Determines optimal category from: `build-errors`, `test-failures`, `runtime-errors`, `performance-issues`, `database-issues`, `security-issues`, `ui-bugs`, `integration-issues`, `logic-errors`
- Suggests filename based on problem slug
- Returns: Final category and filename

### Phase 2: Assembly & Write

**WAIT for all Phase 1 subagents to complete before proceeding.**

1. Collect all text results from Phase 1 subagents
2. Assemble complete markdown document from the collected pieces
3. Validate YAML frontmatter
4. Write the SINGLE final file to Obsidian:

```bash
obsidian create path="${BASE_PATH}/docs/solutions/{slug}.md" vault="Octarine" content="---
tags: [copilot, solution, {category}]
problem: {one-line problem description}
date: YYYY-MM-DD
repo: {REPO_NAME}
category: {category}
---

# {Problem Title}

## Symptom
{What was observed — exact error messages, unexpected behavior}

## Investigation Steps
{What was tried and what didn't work — this saves time for future occurrences}

## Root Cause
{Technical explanation of why it happened}

## Solution
{Step-by-step fix with code examples}

## Prevention
{How to avoid this in the future — tests, linting rules, patterns}

## Related
{Links to related solutions, docs, PRs}
" silent
```

### Phase 3: Optional Enhancement

**WAIT for Phase 2 to complete before proceeding.**

Based on problem type, optionally invoke specialized agents to review the documentation:

- **performance issue** → Task performance-oracle(solution doc)
- **security issue** → Task security-sentinel(solution doc)
- **test failure** → review test coverage suggestions
- **code-heavy solution** → Task code-simplicity-reviewer(solution code examples)

### Phase 4: Update Progress

If a new codebase pattern was discovered, append to progress.md:

```bash
obsidian append path="${BASE_PATH}/progress.md" vault="Octarine" content="\n- {new pattern description}"
```

## Common Mistakes to Avoid

| Wrong | Correct |
|-------|---------|
| Subagents write files | Subagents return text data; orchestrator writes one final file |
| Research and assembly run in parallel | Research completes → then assembly runs |
| Multiple files created during workflow | Single file to Obsidian |

## Success Output

```
Documentation complete!

Subagent Results:
  Context Analyzer: Identified {category} in {component}
  Solution Extractor: {N} code fixes documented
  Related Docs Finder: {N} related solutions
  Prevention Strategist: Prevention strategies ready
  Category Classifier: {category}

File created:
  Copilot/{REPO_NAME}/docs/solutions/{slug}.md

Pattern added to progress.md: {yes/no}

This solution will be searchable in future /copilot-resume sessions.

What's next?
1. Continue workflow
2. View documentation in Obsidian
3. Link related documentation
4. Done
```

## Auto-Invoke

This skill can be triggered automatically when the user says phrases like:
- "that worked"
- "it's fixed"
- "working now"
- "problem solved"

Manual override: `/copilot-compound [context]` to document immediately.

## The Compounding Philosophy

```
Build → Test → Find Issue → Research → Fix → Document → Deploy
    ↑                                                       ↓
    └───────────────────────────────────────────────────────┘
```

**Each unit of engineering work should make subsequent units of work easier — not harder.**
