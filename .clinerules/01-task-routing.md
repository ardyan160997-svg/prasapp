# Prashoes — Task, Combo, and Execution Rules

## Startup procedure

Before changing any project file:

1. Read `TODO.md`, `AGENTS.md`, and `AI_WORKFLOW.md` when they exist.
2. Inspect only the files relevant to the selected task.
3. Preserve all existing task history, deployment information, paths, and configuration notes.
4. Do not replace the entire `TODO.md`; update only the relevant task or append a new task.
5. Classify the task before editing.

Required classification output:

```text
SELECTED_COMBO: quick-edit | webdev-build | plan
REASON: <specific reason>
SCOPE: <expected files, folders, and application layers>
RISK: low | medium | high
ACTIVE_MODEL: <current model/combo when known>
```

## Combo selection

### `quick-edit`

Use only when all of these are true:

- the change is small and isolated;
- no more than three files are expected to change;
- only one application layer is involved;
- no schema, API contract, authentication, authorization, or deployment change is required.

Typical tasks:

- CSS colors, typography, spacing, borders, sizing, or responsive fixes;
- text, link, logo, icon, image, or navbar changes;
- simple static HTML based on an existing layout;
- inspection of one SQL file or one API endpoint;
- one simple function or query fix.

### `webdev-build`

Use when any of these apply:

- a new page or feature is being implemented;
- an API endpoint is created or changed;
- frontend code is connected to an API;
- CRUD, upload, pagination, search, filtering, or sorting is involved;
- frontend, API, and database layers are involved;
- authentication, session, role, or authorization is involved;
- more than three files are expected to change;
- an approved database migration must be implemented;
- production upload or deployment has a verified scope and explicit approval.

### `plan`

Use when any of these apply:

- requirements are ambiguous or contradictory;
- the root cause is unknown;
- database schema or API architecture must be designed;
- the entire project must be audited;
- migration or refactoring strategy must be prepared;
- security, credential, production, or possible data-loss risk exists;
- deployment paths or hosting structure are not yet verified.

During `plan`, do not edit source files unless implementation is explicitly approved afterward.

## Model mismatch rule

After classification:

1. Compare `SELECTED_COMBO` with the active model/combo.
2. If they do not match, do not edit files and do not run deployment.
3. Stop and return the exact restart command:

```bash
cline -m <selected-combo> -c ~/Documents/prashoes
```

For planning tasks, use:

```bash
cline -p -m plan -c ~/Documents/prashoes
```

Continue only after the session is running with the selected combo.

## Project safety

- Preserve the current framework, folder structure, naming conventions, and UI patterns.
- Do not add or replace a production dependency without approval.
- Do not expose passwords, API keys, tokens, database credentials, or FTP/SFTP credentials.
- Do not upload `.env`, backups, logs, database dumps, or local configuration files.
- Do not run destructive production SQL automatically.
- Use prepared statements or parameterized queries.
- Use migrations and rollback steps for schema changes.
- Validate input on the backend even when frontend validation exists.
- Check desktop and mobile behavior for UI changes.
- Check loading, empty, success, and error states for API-driven UI.
- Check success, validation failure, not found, authorization failure, and server error paths for API changes.
- Never use a remote delete or mirror operation unless explicitly approved.
- Create a backup before replacing production files.

## TODO update rules

After execution:

- keep completed and historical tasks;
- update only the relevant task status;
- record the selected combo;
- record changed files and validation results;
- do not copy secrets into `TODO.md`;
- append a new task when the requested work is not already represented.

Allowed statuses:

```text
pending
in-progress
completed
partially-completed
blocked
cancelled
```

## Completion report

```text
STATUS: completed | partially-completed | blocked
COMBO_USED: quick-edit | webdev-build | plan

SUMMARY:
- <result>

FILES_CHANGED:
- <path> — <change>

VALIDATION:
- <test or check>
- <result>

RISKS_OR_NOTES:
- <remaining risk, assumption, or follow-up>

TODO_STATUS:
- <task ID and final status>
```
