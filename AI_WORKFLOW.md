# AI Workflow for This Project

## 1. Select a task

Choose a `pending` task whose dependencies are complete. Use priority order:

1. critical
2. high
3. medium
4. low

Set its status to `in-progress` only after classification.

## 2. Classify the task

Use the project instruction file and global routing rules.

| Task characteristics | Combo |
|---|---|
| Small, isolated, one layer, ≤3 files | `quick-edit` |
| Feature, API, SQL, database, multiple layers | `webdev-build` |
| Analysis, architecture, audit, uncertainty, high risk | `plan` |

## 3. Inspect before editing

- Read relevant source files.
- Search for existing components and reusable functions.
- Identify project conventions.
- Identify affected data and API contracts.
- Determine validation commands.
- Confirm the task scope.

## 4. Execute within scope

For frontend work:

- preserve responsive behavior;
- check links, assets, and console errors;
- implement loading, empty, success, and error states when calling an API.

For API work:

- validate input on the server;
- use appropriate HTTP status codes;
- keep JSON response structures consistent;
- do not leak stack traces or secrets;
- enforce authorization where required.

For SQL/database work:

- use parameterized queries;
- use migrations for schema changes;
- provide rollback steps;
- use transactions for multi-step writes;
- do not perform destructive production actions automatically.

## 5. Validate

Use `.ai/checklists/validation.md` and the task-specific validation criteria.

## 6. Update TODO.md

Allowed statuses:

- pending
- in-progress
- completed
- partially-completed
- blocked
- cancelled

Fill:

- `Selected combo`
- `Risk`
- `Status`
- `Result`

## 7. Report

Use the completion report format in the project instruction file.
