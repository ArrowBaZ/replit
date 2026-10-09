# Sellzy Documentation

Start with the root [README.md](../README.md) for setup. [AGENTS.md](../AGENTS.md) holds the shared project context for AI agents, and [CLAUDE.md](../CLAUDE.md) imports it.

## Structure

| Folder | Contents |
|--------|----------|
| [`product/`](product/) | Current PRDs, specs, and per-feature delta notes |
| [`reference/`](reference/) | Detailed codebase reference: schema, endpoints, storage interface (snapshot, verify against code) |
| [`analysis/`](analysis/) | Codebase analysis, i18n audit, gap analysis, and the insurance (T-001) model |
| [`setup/`](setup/) | Local database setup with Docker |
| [`solutions/`](solutions/) | Solved problems and their fixes, kept as reference |
| [`history/`](history/) | Superseded material kept for traceability: brainstorms, original AI prompts and their inputs, agent run logs, superseded analyses, screenshots and logos |

## Where to start

| Need | Read |
|------|------|
| Run the project locally | [`../README.md`](../README.md), then [`setup/docker.md`](setup/docker.md) |
| Project context for an AI agent | [`../AGENTS.md`](../AGENTS.md) |
| Requirements for a feature | The matching file in [`product/`](product/) |
| Insurance and billing model | [`analysis/insurance-t001/T-001-FINAL-SUMMARY.md`](analysis/insurance-t001/T-001-FINAL-SUMMARY.md). Earlier drafts are in `history/analysis-superseded/` |
| Auth migration (completed) | [`product/authjs-migration-phase1.md`](product/authjs-migration-phase1.md) |
| i18n work | [`product/i18n-i18next-migration-PRD.md`](product/i18n-i18next-migration-PRD.md), [`analysis/AUDIT_FINDINGS.md`](analysis/AUDIT_FINDINGS.md) |
| Known gaps against the MVP | [`analysis/gap-analysis.md`](analysis/gap-analysis.md) |
| Why a past bug was fixed the way it was | [`solutions/`](solutions/) |

## Conventions

- Files in `history/` and `brainstorms/` may refer to Obsidian paths (`Copilot/...`) that no longer exist here. Those references are historical.
- Product docs use YAML front matter (`feature:`, `origin:`) where it applies.
