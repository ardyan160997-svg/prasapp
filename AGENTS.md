# Project AI Agent Instructions

## Startup Procedure

At the start of a task:

1. Read `TODO.md`.
2. Read `AI_WORKFLOW.md`.
3. Inspect the files relevant to the selected task.
4. Select exactly one combo:
   - `quick-edit`
   - `webdev-build`
   - `plan`
5. Before editing, write:

```text
SELECTED_COMBO: <combo>
REASON: <specific reason>
SCOPE: <expected files and layers>
RISK: low | medium | high
```

If the currently active combo is not the selected combo and the CLI cannot switch
models itself, stop before editing and tell the user which combo to select.

## Local Routing Summary

Select `quick-edit` for an isolated, low-risk change affecting one layer and no
more than three files, such as CSS, navbar, text, assets, a simple HTML page based
on an existing layout, or inspection of one SQL/API file.

Select `webdev-build` for feature work, new endpoints, CRUD, API integration,
database implementation, authentication, schema implementation, more than three
files, or work spanning frontend, API, and SQL.

Select `plan` for architecture, database design, audit, unknown root cause,
ambiguous requirements, migration strategy, security review, or possible data loss.

## Scope and Safety

- Do not edit files outside the task scope without documenting why.
- Do not change the framework or project architecture without approval.
- Do not add production dependencies without approval.
- Do not expose secrets or credentials.
- Do not execute destructive production SQL automatically.
- Use prepared statements or parameterized queries.
- Use migrations and rollback steps for schema changes.
- Preserve existing project conventions.
- Validate desktop and mobile UI where relevant.
- Validate API success and failure paths.
- Update the task status and result in `TODO.md`.

## Completion Report

```text
STATUS: completed | partially-completed | blocked
COMBO_USED: quick-edit | webdev-build | plan

SUMMARY:
- <result>

FILES_CHANGED:
- <path> — <change>

VALIDATION:
- <test/check and result>

RISKS_OR_NOTES:
- <remaining risk or assumption>

TODO_STATUS:
- <task ID and final status>
```
