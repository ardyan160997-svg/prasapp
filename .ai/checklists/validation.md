# Validation Checklist

## General

- [ ] Classification was written before editing.
- [ ] Only files in scope changed.
- [ ] Existing conventions were preserved.
- [ ] No secret or credential was exposed.
- [ ] `TODO.md` was updated.
- [ ] Remaining risks were reported.

## HTML and CSS

- [ ] HTML structure is valid.
- [ ] Links and buttons work.
- [ ] Asset paths are correct.
- [ ] Desktop layout was checked.
- [ ] Mobile layout was checked.
- [ ] There is no unintended horizontal overflow.
- [ ] Styles do not leak into unrelated components.

## JavaScript

- [ ] No new console error appears.
- [ ] Null/undefined states are handled.
- [ ] Event listeners are not duplicated.
- [ ] User input is validated.
- [ ] Loading, empty, success, and error states are handled where relevant.

## API

- [ ] Backend input validation exists.
- [ ] HTTP status codes are appropriate.
- [ ] JSON response shape is consistent.
- [ ] Success, validation error, not found, authorization failure, and server error were considered.
- [ ] Secrets and stack traces are not returned.
- [ ] Database queries are parameterized.

## Database

- [ ] Schema changes use migrations.
- [ ] Rollback steps exist.
- [ ] Indexes and foreign keys were reviewed.
- [ ] Destructive operations were not run without approval.
- [ ] Transactions are used for multi-step writes when needed.
- [ ] Production backup requirements were identified.

## Planning and Audit

- [ ] No source file changed during read-only planning.
- [ ] Facts are separated from assumptions.
- [ ] Findings identify relevant files.
- [ ] Risks are prioritized.
- [ ] Recommendations have an implementation order.
- [ ] Migration and rollback implications are addressed.
