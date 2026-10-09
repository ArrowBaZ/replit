# Sellzy Documentation

Index of project documentation. Start with the root [README.md](../README.md) for setup and [CLAUDE.md](../CLAUDE.md) / [AGENTS.md](../AGENTS.md) for the codebase conventions used by AI coding tools.

## Structure

| Folder | Contents |
|--------|----------|
| [`product/`](product/) | Product requirements (PRDs) and specs: features, i18n refactor, auth migration, insurance billing |
| [`analysis/`](analysis/) | Codebase analysis, audits, gap analysis, completion summaries, and the insurance (T-001) investigation |
| [`brainstorms/`](brainstorms/) | Early exploration documents that preceded the PRDs |
| [`setup/`](setup/) | Docker and local database setup guides |
| [`feature/`](feature/) | Per-feature delta documents for changes in progress |
| [`solutions/`](solutions/) | Solved problems and their fixes, kept as reference |
| [`history/`](history/) | Original AI prompts and the pasted inputs that produced the PRDs. Kept for traceability, not current guidance |

## Where to start

| Need | Read |
|------|------|
| Run the project locally | [`../README.md`](../README.md), then [`setup/README-docker.md`](setup/README-docker.md) |
| Understand a feature's requirements | The matching file in [`product/`](product/) |
| Understand the insurance / billing model | [`analysis/insurance-t001/T-001-FINAL-SUMMARY.md`](analysis/insurance-t001/T-001-FINAL-SUMMARY.md) (supersedes the earlier ANALYSIS and CORRECTED-ANALYSIS files) |
| Understand the i18n work | [`product/i18n-i18next-migration-PRD.md`](product/i18n-i18next-migration-PRD.md), [`analysis/AUDIT_FINDINGS.md`](analysis/AUDIT_FINDINGS.md) |
| Known gaps against the MVP | [`analysis/gap-analysis.md`](analysis/gap-analysis.md) |
| Why a past bug was fixed the way it was | [`solutions/`](solutions/) |

## Conventions

- Product docs in `product/` use the PRD template with YAML front matter (`feature:`, `origin:`).
- Files under `history/` and `brainstorms/` may refer to Obsidian paths (`Copilot/…`) that no longer exist in this repository. Those references are historical.
