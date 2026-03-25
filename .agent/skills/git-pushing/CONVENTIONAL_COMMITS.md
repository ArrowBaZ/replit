# Conventional Commits Template for git-pushing Skill

This document provides templates and guidelines for creating conventional commit messages using the git-pushing skill.

## Format

```
<type>(<scope>): <description>

<body>

<footer>
```

## Commit Types

### `feat`

A new feature for the application or codebase.

**Template:**

```
feat(scope): add new feature

<Optional detailed description of what was added>

Closes #<issue-number>
```

**Examples:**

```
feat(skill): add template support for conventional commits
feat(component): add dark mode toggle functionality
feat(api): implement authentication endpoint
```

### `fix`

A bug fix in the application.

**Template:**

```
fix(scope): resolve issue description

<Detailed explanation of the bug and how it was fixed>

Fixes #<issue-number>
```

**Examples:**

```
fix(script): correct file path resolution in smart_commit.sh
fix(component): prevent memory leak in event listener
fix(service): handle null responses from API
```

### `docs`

Documentation changes (README, guides, API docs, etc.).

**Template:**

```
docs(scope): update documentation

<Details about what documentation was changed>
```

**Examples:**

```
docs(skill): add usage examples to SKILL.md
docs(readme): update installation instructions
docs(api): document new endpoint parameters
```

### `test`

Adding or updating tests.

**Template:**

```
test(scope): add tests for feature

<Description of test coverage added>
```

**Examples:**

```
test(skill): add unit tests for commit message generation
test(component): add integration tests for dialog
test(service): increase API handler coverage
```

### `chore`

Maintenance tasks, dependency updates, build changes, etc.

**Template:**

```
chore(scope): description

<Details about the maintenance change>
```

**Examples:**

```
chore(dependencies): update npm packages
chore(build): optimize webpack configuration
chore(ci): update GitHub Actions workflow
```

### `refactor`

Code refactoring without changing functionality.

**Template:**

```
refactor(scope): improve code structure

<Explanation of refactoring changes>
```

**Examples:**

```
refactor(skill): simplify commit message logic
refactor(component): extract reusable utility functions
refactor(service): improve error handling patterns
```

### `perf`

Performance improvements.

**Template:**

```
perf(scope): optimize performance metric

<Details about performance improvements>
```

**Examples:**

```
perf(script): reduce commit detection time by 30%
perf(component): optimize render performance with memoization
```

### `style`

Code style changes (formatting, missing semicolons, etc.) - not affecting functionality.

**Template:**

```
style(scope): format code according to standards

<Details about style changes made>
```

**Examples:**

```
style(skill): apply prettier formatting
style(component): align indentation
```

### `ci`

CI/CD configuration and automation changes.

**Template:**

```
ci(scope): update CI pipeline

<Details about CI/CD changes>
```

**Examples:**

```
ci(workflow): add test coverage reporting
ci(github): update action versions
```

## Scope Guidelines

The scope is the area of the codebase affected by the change:

### For git-pushing Skill

```
feat(skill): description
feat(script): description
feat(workflow): description
```

### For Components

```
feat(component): description
feat(ProductCard): description
```

### For Blocks

```
feat(catalog): description
feat(content): description
feat(navigation): description
```

### For Services

```
feat(service): description
feat(ImageService): description
```

### For Infrastructure

```
feat(ci): description
feat(build): description
feat(config): description
```

## Body Guidelines

The body is optional but recommended for substantial changes:

- **Explain the problem** you're solving
- **Describe the solution** implemented
- **List any breaking changes**
- **Reference related issues**

**Template:**

```
This change fixes the issue where commit messages were not properly
detecting the scope of changes. The script now analyzes file patterns
more accurately to determine the appropriate conventional commit type.

The changes include:
- Enhanced pattern matching for file types
- Improved scope detection logic
- Better handling of multi-directory changes
```

## Footer Guidelines

The footer is optional and used for:

- **Issue references:** `Closes #123`, `Fixes #456`
- **Breaking changes:** `BREAKING CHANGE: description`

**Examples:**

```
Closes #123
Fixes #456, #789

BREAKING CHANGE: The commit message format has changed.
Old format no longer supported.
```

## Usage with smart_commit.sh

### Automatic Ticket Detection

The script automatically extracts ticket numbers from branch names and includes them in the commit footer.

**Branch name patterns that are detected:**

- `ECOOREV-1450-description` → Includes `Closes ECOOREV-1450`
- `JIRA-5678-feature-name` → Includes `Closes JIRA-5678`
- Any pattern matching `[A-Z]+-[0-9]+` (e.g., `ABC-123`, `PROJ-999`)

**Example:**
When working on branch `ECOOREV-1450-B2C-Front-end-Add-skill-to-help-Copilot-in-project`, the script will:

1. Detect the ticket number `ECOOREV-1450`
2. Create a commit message with the footer `Closes ECOOREV-1450`

This automatically links the commit to the ticket in your issue tracking system.

### Automatic Detection

The script automatically detects the commit type and generates appropriate messages:

```bash
bash .agents/skills/git-pushing/scripts/smart_commit.sh
```

### Custom Message

Provide a custom conventional commit message:

```bash
bash .agents/skills/git-pushing/scripts/smart_commit.sh "feat(skill): add commit template generation"
```

**Note:** Even with a custom message, the ticket number from the branch name will be automatically appended to the footer.

## Complete Examples

### Feature Example (with automatic ticket)

```
feat(skill): add commit template generation

Add a new feature to the git-pushing skill that generates
conventional commit templates based on the scope and type
of changes being committed.

The implementation includes:
- Template registry for all commit types
- Smart detection of commit scope
- Interactive template selection
- Automatic body and footer generation

Closes ECOOREV-1450
```

### Bug Fix Example

```
fix(script): resolve branch detection issue

The smart_commit.sh script was failing to detect the current
branch correctly when using Git worktrees. This fix adds
proper support for worktree branches.

- Added worktree detection logic
- Fixed branch name extraction
- Updated error handling

Fixes #345
Closes JIRA-678
```

### Documentation Example

```
docs(skill): add comprehensive commit guidelines

Expanded the documentation for the git-pushing skill to
include detailed conventional commit templates and examples
for all commit types and scopes used in the project.

- Added commit type documentation
- Included scope guidelines
- Provided practical examples

Closes ECOOREV-1451
```

## Benefits

Following Conventional Commits:

- ✅ Automatic changelog generation
- ✅ Semantic versioning (semver) compliance
- ✅ Better commit history readability
- ✅ Improved team collaboration
- ✅ Easier debugging and issue tracking
- ✅ Integration with automation tools

## References

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)
- [Semantic Versioning](https://semver.org/)
