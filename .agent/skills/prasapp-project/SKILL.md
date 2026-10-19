---
name: prasapp-project
description: Use when an agent works anywhere in the Prasapp monorepo or operates its prasapp.com VPS applications. Loads stable architecture, project conventions, open TODOs, verification gates, backup discipline, and deployment safety before implementation.
version: 1.0.0
author: Prasapp
license: MIT
metadata:
  hermes:
    tags: [prasapp, monorepo, vps, deployment, avif]
    related_skills: [prasapp-vps-deploy]
---

# Prasapp Project Skill

## Overview

This skill is the entry point for agents working in the Prasapp repository. Repository documents remain the source of truth:

- [`../../../PROJECT.md`](../../../PROJECT.md) — stable architecture, project conventions, VPS paths, verification, and deployment rules.
- [`../../../TODO.md`](../../../TODO.md) — project task ledger; locate active work by each block's `Status` field and preserve completed history.

Read both files before planning, editing, testing, committing, or deploying.

For any upload, deployment, service restart, production verification, or rollback, also load [`../prasapp-vps-deploy/SKILL.md`](../prasapp-vps-deploy/SKILL.md).

## When to use

Load this skill for work involving:

- Any directory under the Prasapp repository.
- Any `*.prasapp.com` application on the VPS.
- PrasCell, PrasEats, Prashine, Prashoes, Novia, or shared infrastructure.
- Shared image conversion, upload handling, database/API changes, or production deployment.

Do not use repository documentation as proof of current production state. Inspect the original source and live runtime first.

## Required workflow

1. **Read context.** Read `PROJECT.md` and `TODO.md` completely. Completion criterion: relevant project, constraints, and open work are identified.
2. **Inspect current state.** Run `git status`; inspect relevant manifests, definitions, usages, and live runtime if production is involved. Completion criterion: no file, API, dependency, service, or domain is assumed.
3. **Protect unrelated work.** Account for all pre-existing modified/untracked files. Completion criterion: the task touches only scoped paths and stages files explicitly.
4. **Implement narrowly.** Preserve historical data, uploads, public contracts, project visual conventions, and existing access/network configuration.
5. **Preview visual work.** Verify desktop/mobile layout and interactions before final tests or commit. Completion criterion: no horizontal overflow, blocked controls, or bottom-navigation overlap.
6. **Verify canonically.** Run the project check/build commands documented in `PROJECT.md`, `git diff --check`, and a focused temporary ad-hoc verifier for changed behavior.
7. **Commit only when requested.** Stage explicit files. Never include secrets, `.env`, `node_modules`, screenshots, browser profiles, temporary scripts, or unrelated worktree changes.
8. **Deploy only when requested.** Backup first, preserve uploads, restart only affected services, use readiness retry, and smoke-test public HTTPS and behavior.
9. **Maintain context.** Update `PROJECT.md` only for stable architecture/procedure changes. Follow the existing task-block format in `TODO.md`; preserve completed entries unless the project owner requests cleanup.

## Shared AVIF rule

All new image-upload paths in Node applications should use:

```js
const { toAvif } = require('../../shared/image-converter');
```

Validate the upload first, convert before final persistence, write `.avif`, then update the database. Delete an old image only after the replacement and associated data update succeed. Do not expose the converter as a public service unless explicitly requested.

## Production safety

- Do not alter SSH, keys, users, permissions, firewall, DNS, VPN/Tailscale, ports, or routing unless explicitly requested.
- Do not touch `coolify-db`.
- Do not remove uploads while replacing build artifacts.
- Do not read or print credentials.
- Do not claim deploy success from a commit or service restart alone; verify the live source and behavior.

## Verification checklist

- [ ] `PROJECT.md` and `TODO.md` read.
- [ ] Relevant source definitions and call sites inspected.
- [ ] `git status` reviewed; unrelated changes preserved.
- [ ] Canonical checks/build pass for every changed project.
- [ ] Focused ad-hoc verification passes and temporary script is removed.
- [ ] `git diff --check` passes.
- [ ] Visual work previewed at desktop and mobile sizes when applicable.
- [ ] Commit contains only explicit scoped files when a commit was requested.
- [ ] Production backup exists before deploy.
- [ ] Affected services are active after readiness retry.
- [ ] Public health and changed live behavior pass.
- [ ] Documentation/TODO updated only if stable context or open work changed.
