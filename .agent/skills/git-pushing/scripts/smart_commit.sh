#!/bin/bash
# Smart Git Commit Script for git-pushing skill
# Handles staging, commit message generation, and pushing

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
info() { echo -e "${GREEN}→${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1" >&2; }

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
info "Current branch: $CURRENT_BRANCH"

# Extract ticket number from branch name (e.g., ECOOREV-1450 from ECOOREV-1450-description)
extract_ticket_number() {
    local branch="$1"
    # Match pattern like ECOOREV-1234 or JIRA-5678
    if [[ $branch =~ ^[A-Z]+-[0-9]+ ]]; then
        echo "${BASH_REMATCH[0]}"
    fi
}

TICKET_NUMBER=$(extract_ticket_number "$CURRENT_BRANCH")
if [ -n "$TICKET_NUMBER" ]; then
    info "Found ticket number: $TICKET_NUMBER"
fi

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
    warn "No changes to commit"
    exit 0
fi

# Stage all changes
info "Staging all changes..."
git add .

# Get staged files for commit message analysis
STAGED_FILES=$(git diff --cached --name-only)
DIFF_STAT=$(git diff --cached --stat)

# Analyze changes to determine commit type
determine_commit_type() {
    local files="$1"

    # Check for specific patterns
    if echo "$files" | grep -q "test"; then
        echo "test"
    elif echo "$files" | grep -qE "\.(md|txt|rst)$"; then
        echo "docs"
    elif echo "$files" | grep -qE "package\.json|requirements\.txt|Cargo\.toml"; then
        echo "chore"
    elif git diff --cached | grep -qE "^\+.*\b(fix|bug)(es|ed|ing|s)?\b"; then
        echo "fix"
    elif git diff --cached | grep -qE "^\+.*\brefactor\b"; then
        echo "refactor"
    else
        echo "feat"
    fi
}

# Analyze files to determine scope
determine_scope() {
    local files="$1"

    # Extract directory or component name
    local scope=$(echo "$files" | head -1 | cut -d'/' -f1)

    # Check for common patterns
    if echo "$files" | grep -q "plugin"; then
        echo "plugin"
    elif echo "$files" | grep -q "skill"; then
        echo "skill"
    elif echo "$files" | grep -q "agent"; then
        echo "agent"
    elif [ -n "$scope" ] && [ "$scope" != "." ]; then
        echo "$scope"
    else
        echo ""
    fi
}

# Generate commit message if not provided
if [ -z "$1" ]; then
    COMMIT_TYPE=$(determine_commit_type "$STAGED_FILES")
    SCOPE=$(determine_scope "$STAGED_FILES")

    # Count files changed
    NUM_FILES=$(echo "$STAGED_FILES" | wc -l | xargs)

    # Generate description based on changes
    if [ "$COMMIT_TYPE" = "docs" ]; then
        DESCRIPTION="update documentation"
    elif [ "$COMMIT_TYPE" = "test" ]; then
        DESCRIPTION="update tests"
    elif [ "$COMMIT_TYPE" = "chore" ]; then
        DESCRIPTION="update dependencies"
    else
        DESCRIPTION="update $NUM_FILES file(s)"
    fi

    # Build commit message
    if [ -n "$SCOPE" ]; then
        COMMIT_MSG="${COMMIT_TYPE}(${SCOPE}): ${DESCRIPTION}"
    else
        COMMIT_MSG="${COMMIT_TYPE}: ${DESCRIPTION}"
    fi

    info "Generated commit message: $COMMIT_MSG"
else
    COMMIT_MSG="$1"
    info "Using provided message: $COMMIT_MSG"
fi

# Build footer with ticket number if found
FOOTER=""
if [ -n "$TICKET_NUMBER" ]; then
    FOOTER="Closes $TICKET_NUMBER"
fi

# Create commit with ticket reference in footer
if [ -n "$FOOTER" ]; then
    git commit -m "$(cat <<EOF
${COMMIT_MSG}

${FOOTER}
EOF
)"
else
    git commit -m "${COMMIT_MSG}"
fi

COMMIT_HASH=$(git rev-parse --short HEAD)
info "Created commit: $COMMIT_HASH"

# Fetch latest changes from remote
info "Fetching latest changes from remote..."
git fetch origin main

# Check if branch is behind main and rebase if needed
info "Checking if branch is up to date with main..."
MERGE_BASE=$(git merge-base "$CURRENT_BRANCH" origin/main)
CURRENT_COMMIT=$(git rev-parse "$CURRENT_BRANCH")

if [ "$MERGE_BASE" != "$CURRENT_COMMIT" ]; then
    # Branch is behind main, need to rebase
    info "Branch is behind main. Rebasing from main..."
    if git rebase origin/main; then
        info "Successfully rebased from main"
    else
        error "Rebase failed. Please resolve conflicts and run 'git rebase --continue'"
        exit 1
    fi
fi

# Push to remote
info "Pushing to origin/$CURRENT_BRANCH..."

# Check if branch exists on remote
if git ls-remote --exit-code --heads origin "$CURRENT_BRANCH" >/dev/null 2>&1; then
    # Branch exists, just push (may need force push after rebase)
    if git push; then
        info "Successfully pushed to origin/$CURRENT_BRANCH"
        echo "$DIFF_STAT"
    else
        # If push fails, try force push (safe after rebase)
        warn "Push failed, attempting force push after rebase..."
        if git push --force-with-lease; then
            info "Successfully force-pushed to origin/$CURRENT_BRANCH"
            echo "$DIFF_STAT"
        else
            error "Force push failed"
            exit 1
        fi
    fi
else
    # New branch, push with -u
    if git push -u origin "$CURRENT_BRANCH"; then
        info "Successfully pushed new branch to origin/$CURRENT_BRANCH"
        echo "$DIFF_STAT"

        # Check if it's GitHub and show PR link
        REMOTE_URL=$(git remote get-url origin)
        if echo "$REMOTE_URL" | grep -q "github.com"; then
            REPO=$(echo "$REMOTE_URL" | sed -E 's/.*github\.com[:/](.*)\.git/\1/')
            warn "Create PR: https://github.com/$REPO/pull/new/$CURRENT_BRANCH"
        fi
    else
        error "Push failed"
        exit 1
    fi
fi

exit 0
