---
name: copilot-work
description: Execute tasks from an Obsidian PRD with progress tracking. Restores context, clarifies before building, implements with quality checks, and updates Obsidian. Use when ready to implement a planned feature.
---

# Work on Tasks

Execute tasks from a feature's PRD stored in Obsidian. The focus is on **shipping complete features** by understanding requirements quickly, following existing patterns, and maintaining quality throughout.

The user should specify a feature slug or task ID in their prompt (e.g., "dark-mode-support" or "T-003"). If not provided, list active features and ask which to work on.

## Execution

### Phase 1: Quick Start

#### 1. Restore Context

```bash
REPO_NAME=$(basename $(pwd))
BASE_PATH="Copilot/${REPO_NAME}"
```

Read all context in parallel:

```bash
obsidian read path="${BASE_PATH}/Overview.md" vault="Octarine"
obsidian read path="${BASE_PATH}/progress.md" vault="Octarine"
```

#### 2. Identify Feature

**If a feature slug was provided:** Read its PRD:
```bash
obsidian read path="${BASE_PATH}/prd/{feature-slug}.md" vault="Octarine"
```

**If a task ID was provided (e.g. T-003):** Search for the task file to find its feature:
```bash
obsidian search query="task_id: T-003" vault="Octarine"
```

**If nothing provided:** List all active features and ask which to work on:
```bash
obsidian files path="${BASE_PATH}/prd" vault="Octarine"
```
Read each PRD's frontmatter to find those with `status: active`, then present the list.

#### 3. Read Plan and Clarify

- Read the PRD completely
- Review any references or links provided in the plan
- Read the brainstorm document if one is referenced in the PRD's `origin:` field
- If anything is unclear or ambiguous, **ask clarifying questions now**
- Get user approval to proceed
- **Do not skip this** — better to ask questions now than build the wrong thing

#### 4. Pick Task

Parse the task table from the PRD. Select the highest-priority task where `Passes` is `false`.

Read the task file for detailed notes:
```bash
obsidian read path="${BASE_PATH}/tasks/{feature-slug}-T-{XXX}.md" vault="Octarine"
```

Display:
```
Feature: {feature-slug}
Status: {completed}/{total} tasks done
Next task: T-{XXX} - {title} (priority {N})

Developer: ensure you are on the correct feature branch before proceeding.
```

### Phase 2: Execute

#### 1. Task Execution Loop

For each task in priority order:

```
while (tasks remain):
  - Read any referenced files from the plan
  - Look for similar patterns in codebase
  - Implement following existing conventions
  - Write tests for new functionality
  - Run System-Wide Test Check (see below)
  - Run tests after changes
  - Update Obsidian (see Phase 3)
  - Evaluate for commit suggestion (see below)
```

**System-Wide Test Check** — Before marking a task done, pause and ask:

| Question | What to do |
|----------|------------|
| **What fires when this runs?** Callbacks, middleware, observers, event handlers — trace two levels out from your change. | Read the actual code (not docs) for callbacks on models you touch, middleware in the request chain, `after_*` hooks. |
| **Do my tests exercise the real chain?** If every dependency is mocked, the test proves logic in isolation only. | Write at least one integration test that uses real objects through the full callback/middleware chain. |
| **Can failure leave orphaned state?** If code persists state before calling an external service, what happens when the service fails? | Trace the failure path. If state is created before the risky call, test that failure cleans up or that retry is idempotent. |
| **What other interfaces expose this?** Mixins, DSLs, alternative entry points. | Grep for the method/behavior in related classes. If parity is needed, add it now. |
| **Do error strategies align across layers?** Retry middleware + application fallback + framework error handling — do they conflict? | List the specific error classes at each layer. Verify your rescue list matches what the lower layer actually raises. |

**When to skip:** Leaf-node changes with no callbacks, no state persistence, no parallel interfaces. If the change is purely additive, the check takes 10 seconds and the answer is "nothing fires, skip."

#### 2. Commit Suggestions

After completing each task, evaluate and **suggest** a commit (developer handles git):

| Suggest commit when... | Don't suggest when... |
|------------------------|----------------------|
| Logical unit complete (model, service, component) | Small part of a larger unit |
| Tests pass + meaningful progress | Tests failing |
| About to switch contexts (backend → frontend) | Purely scaffolding with no behavior |
| About to attempt risky/uncertain changes | Would need a "WIP" commit message |

**Heuristic:** "Can I write a commit message that describes a complete, valuable change? If yes, suggest commit."

```
Task T-{XXX} complete. Suggested commit:
  git add {specific files}
  git commit -m "feat({scope}): {description} [T-{XXX}]"
```

#### 3. Follow Existing Patterns

- The plan should reference similar code — read those files first
- Match naming conventions exactly
- Reuse existing components where possible
- Follow project coding standards (see CLAUDE.md)
- When in doubt, grep for similar implementations

#### 4. Test Continuously

- Run relevant tests after each significant change using commands from Overview.md
- Don't wait until the end to test
- Fix failures immediately
- Add new tests for new functionality
- **Unit tests with mocks prove logic in isolation. Integration tests with real objects prove layers work together.** If your change touches callbacks, middleware, or error handling — you need both.

#### 5. Figma Design Sync (if applicable)

For UI work with Figma designs:
- Implement components following design specs
- Use figma-design-sync agent iteratively to compare
- Fix visual differences identified
- Repeat until implementation matches design

### Phase 3: Update Obsidian

After completing each task:

**1. Update PRD task table:**

Read `prd/{feature-slug}.md`, change the task's `Passes` cell from `false` to `true`, add notes:
```bash
obsidian write path="${BASE_PATH}/prd/{feature-slug}.md" vault="Octarine" content="{updated PRD}"
```

**2. Update task file:**
```bash
obsidian property:set name="passes" value="true" path="${BASE_PATH}/tasks/{feature-slug}-T-{XXX}.md" vault="Octarine"
obsidian append path="${BASE_PATH}/tasks/{feature-slug}-T-{XXX}.md" vault="Octarine" content="\n\n### {YYYY-MM-DD HH:MM}\n{Summary of what was done}\n{Files changed}"
```

**3. Append iteration to progress.md:**
```bash
obsidian append path="${BASE_PATH}/progress.md" vault="Octarine" content="\n\n### Iteration - {YYYY-MM-DD HH:MM}\n\n**Feature:** {feature-slug}\n**Task:** T-{XXX} - {title}\n**Status:** passes: true\n\n**What was done:**\n- {bullet summary}\n\n**Files changed:**\n- {list of files}\n\n**Learnings:**\n- {patterns / gotchas discovered}\n\n**Next step:** {what to do next}"
```

**4. Check feature completion:**

If all tasks pass:
```bash
obsidian property:set name="status" value="completed" path="${BASE_PATH}/prd/{feature-slug}.md" vault="Octarine"
```

### Phase 4: Quality Check

Run before considering the feature done:

**1. Run Core Quality Checks**

```bash
{test command from Overview.md}
{lint command from Overview.md}
```

**2. Consider Reviewer Agents** (Optional — for complex/risky changes)

Use reviewer agents only when:
- Large refactor affecting many files (10+)
- Security-sensitive changes (authentication, permissions, data access)
- Performance-critical code paths
- Complex algorithms or business logic
- User explicitly requests thorough review

For most features: tests + linting + following patterns is sufficient.

If using reviewers, check `compound-engineering.local.md` for configured `review_agents`. Run in parallel.

**3. Final Validation**
- [ ] All tasks in PRD table marked as `true`
- [ ] All tests pass
- [ ] Linting passes
- [ ] Code follows existing patterns
- [ ] Figma designs match (if applicable)
- [ ] No console errors or warnings

### Phase 5: Wrap Up

After all tasks complete:

```
All {N} tasks complete for feature: {feature-slug}!
Feature status set to: completed

Developer next steps:
  1. Commit any remaining changes
  2. Push branch and create PR
  3. Include in PR description:
     - Summary of what was built and why
     - Tests added/modified
     - Before/after screenshots (for UI changes)

Claude next steps:
  1. /copilot-review {feature-slug} — Run code review
  2. /copilot-compound — Document what was learned
  3. /copilot-stop — Save final progress
```

## Key Principles

- **Start fast, execute faster** — Get clarification once at the start, then execute
- **The plan is your guide** — Read referenced code, match what exists
- **Test as you go** — Run tests after each change, not at the end
- **Quality is built in** — Follow patterns, write tests, use reviewers for complex work only
- **Ship complete features** — Don't leave features 80% done
- **Track everything** — Every completed task gets an Obsidian update
- **No git writes** — Suggest commits but never run git commands

## Common Pitfalls to Avoid

- **Analysis paralysis** — Don't overthink, read the plan and execute
- **Skipping clarifying questions** — Ask now, not after building the wrong thing
- **Ignoring plan references** — The plan has file paths for a reason
- **Testing at the end** — Test continuously or suffer later
- **80% done syndrome** — Finish the feature, don't move on early
- **Over-reviewing simple changes** — Save reviewer agents for complex work
