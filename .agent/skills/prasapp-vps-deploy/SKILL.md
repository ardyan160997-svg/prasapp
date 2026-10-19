---
name: prasapp-vps-deploy
description: Use when uploading, deploying, restarting, verifying, or rolling back a Prasapp application on the VPS. Enforces runtime inventory, scoped backups, upload preservation, explicit file transfer, readiness retry, live smoke tests, and safe rollback without modifying remote access or networking.
version: 1.0.0
author: Prasapp
license: MIT
metadata:
  hermes:
    tags: [prasapp, vps, upload, deploy, rollback]
    related_skills: [prasapp-project]
---

# Prasapp VPS Upload and Deployment

## Overview

Use this skill only after reading:

- [`../../../PROJECT.md`](../../../PROJECT.md)
- [`../../../TODO.md`](../../../TODO.md)
- [`../prasapp-project/SKILL.md`](../prasapp-project/SKILL.md)

Default VPS alias:

```text
agent-public
```

Default production root:

```text
/root/prasapp
```

These values are starting points, not proof. Inspect the active service, nginx host, working directory, and health endpoint before every deployment.

## When to use

Use this skill when the user asks to:

- Upload project files to the Prasapp VPS.
- Deploy a commit or local change.
- Restart a Prasapp service after a release.
- Verify or roll back a deployment.
- Install or update shared runtime code such as `shared/image-converter`.

Do not deploy merely because implementation is finished. Deployment requires an explicit user request such as `deploy`, `commit deploy`, or equivalent.

## Non-negotiable safety boundaries

- Do not alter SSH configuration, keys, users, permissions, firewall, DNS, VPN/Tailscale, ports, proxy routing, or nginx unless the user explicitly requests that specific change.
- Do not touch `coolify-db`.
- Do not read, print, transfer into chat, or commit `.env`, passwords, tokens, private keys, or database URLs.
- Do not use `rsync --delete` against a runtime root containing uploads, environment files, data, or backups.
- Do not delete or replace upload directories.
- Do not deploy unrelated dirty-worktree changes.
- Do not restart unaffected services.
- Do not run a database migration without a database backup and explicit scope.
- Do not claim success from `systemctl restart`, a commit, or an HTTP `200` alone. Verify the changed behavior.

## Known services

| Project | Service | Public health |
|---|---|---|
| PrasCell | `adminprascell.service` | `https://adminprascell.prasapp.com/api/health` |
| PrasEats | `adminpraseats.service` | `https://adminpraseats.prasapp.com/api/health` |
| Prashine | `adminprashine.service` | `https://adminprashine.prasapp.com/api/health` |
| Prashoes | `adminprashoes.service` | `https://adminprashoes.prasapp.com/api/health` |

Always re-check service names and working directories with systemd before relying on this table.

## Deployment workflow

### 1. Establish exact scope

From repository root:

```bash
git branch --show-current
git status --short
git diff --check -- .
git diff --stat -- <scoped-paths>
```

Inspect the commit or files requested by the user. Account for every staged file and every pre-existing unrelated modification.

Completion criterion: the release file list is explicit, and no unrelated path will be transferred or committed.

### 2. Run canonical local verification

Use the commands documented in `PROJECT.md` for every changed project. Typical examples:

```bash
(cd prascell && npm run check && npm run build)
(cd praseats && npm run check && npm run build)
(cd prashoes/adminprashoes && npm run check && npm run build)
git diff --check -- .
```

Also create a focused temporary verifier for the changed behavior:

- Create with Python `tempfile`.
- Directory: `/private/var/folders/6f/yz97kp1s4vl2pp0bvqxrzl6r0000gn/T` when available on the current Mac.
- Filename prefix: `hermes-verify-`.
- Describe it as **ad-hoc verification**, not as the full suite.
- Remove it after execution.

Completion criterion: all canonical commands and focused verification exit `0` with current source.

### 3. Inspect live runtime before changing it

Read-only inspection:

```bash
ssh agent-public 'systemctl show <service>.service -p WorkingDirectory -p ExecStart -p EnvironmentFiles --no-pager'
ssh agent-public 'systemctl is-active <service>.service'
curl -fsSL 'https://<domain>/api/health'
```

If the deployment changes static files, inspect where the service serves them from. If it changes uploads, inspect the durable upload path. Never infer these paths from local layout alone.

Completion criterion: active working directory, start command, artifact path, upload path, and health URL are known.

### 4. Create a release backup

Use a timestamped directory under the affected runtime or the shared root:

```text
/root/prasapp/<project>/<runtime>/.release-backups/YYYYMMDD-HHMMSS-<release-name>
```

For shared changes:

```text
/root/prasapp/.release-backups/YYYYMMDD-HHMMSS-<release-name>
```

Backup at minimum:

- Runtime files that will be replaced.
- Existing build artifact that will be replaced.
- Related upload directory when upload behavior changes.
- Shared library when shared runtime changes.
- Database dump when schema or data changes.

Example pattern; adapt only after inspecting real paths:

```bash
ssh agent-public '
  set -e
  BACKUP=/root/prasapp/.release-backups/<timestamp>-<release>
  mkdir -p "$BACKUP"
  cp <runtime-server-file> "$BACKUP/"
  cp -a <runtime-dist> "$BACKUP/dist"
  if [ -d <uploads> ]; then tar -czf "$BACKUP/uploads.tgz" -C <runtime-root> uploads; fi
  echo "backup:PASS:$BACKUP"
'
```

Never print environment contents. If a database dump needs environment variables, source the service environment only inside the remote shell and do not echo it.

Completion criterion: backup path is printed, exists, and required files/dump are non-empty.

### 5. Package only the release payload

Prefer a small tarball or explicit `scp` files. Suppress macOS metadata:

```bash
COPYFILE_DISABLE=1 tar --no-xattrs -czf /tmp/<release>.tgz -C <artifact-dir> .
scp -q /tmp/<release>.tgz agent-public:/tmp/<release>.tgz
```

For a single backend file:

```bash
scp -q <local-server.js> agent-public:/tmp/<unique-release-server.js>
```

For the shared AVIF converter:

```bash
COPYFILE_DISABLE=1 tar --no-xattrs --exclude=node_modules \
  -czf /tmp/prasapp-image-converter.tgz -C shared image-converter
scp -q /tmp/prasapp-image-converter.tgz agent-public:/tmp/
```

Do not package `node_modules`, `.env`, screenshots, browser profiles, `.hermes`, temporary verifiers, or unrelated files.

Completion criterion: payload contains exactly the scoped release files.

### 6. Install the release narrowly

Use `set -e`. Replace only the inspected artifact/source path. Preserve uploads and environment files.

Static artifact pattern:

```bash
ssh agent-public '
  set -e
  R=<runtime-root>
  NEW="$R/.release-new"
  rm -rf "$NEW"
  mkdir -p "$NEW"
  tar -xzf /tmp/<release>.tgz -C "$NEW"
  test -f "$NEW/<expected-marker-file>"
  rm -rf "$R/dist"
  mv "$NEW" "$R/dist"
'
```

Use this pattern only when `dist` is confirmed disposable and uploads are outside it. If uploads live under `dist`, stop and redesign the release rather than deleting them.

Backend source pattern:

```bash
ssh agent-public '
  set -e
  cp /tmp/<unique-release-server.js> <runtime-root>/server.js
  node --check <runtime-root>/server.js
'
```

Shared converter pattern:

```bash
ssh agent-public '
  set -e
  mkdir -p /root/prasapp/shared
  tar -xzf /tmp/prasapp-image-converter.tgz -C /root/prasapp/shared
  cd /root/prasapp/shared/image-converter
  npm ci --omit=dev --no-audit --no-fund
'
```

Completion criterion: expected marker files exist and syntax/dependency checks pass before restart.

### 7. Restart only affected services with readiness retry

```bash
ssh agent-public '
  set -e
  systemctl restart <service>.service
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS http://127.0.0.1:<port>/api/health >/dev/null; then
      echo "readiness:PASS:attempt-$i"
      systemctl is-active <service>.service
      exit 0
    fi
    sleep 2
  done
  systemctl status <service>.service --no-pager
  journalctl -u <service>.service -n 80 --no-pager
  exit 1
'
```

A failed first request immediately after restart is normal; readiness retry handles startup races. A service that never becomes ready is a failed deployment and triggers rollback evaluation.

Completion criterion: service is `active`, local health passes, and retry reports the successful attempt.

### 8. Verify public production behavior

Minimum checks:

```bash
curl -fsSL 'https://<domain>/api/health'
curl -fsSL 'https://<domain>/<changed-page>?verify=<commit-or-release>'
```

When static or server files changed, compare exact hashes:

```bash
shasum -a 256 <local-file>
ssh agent-public 'sha256sum <remote-file>'
```

For browser-visible work, verify the live UI—not only source text—including mobile layout and cache-busted assets. For data/API work, use a non-destructive read or isolated test record and clean it up after verification.

For image conversion, generate a temporary image, convert it through the deployed shared library, inspect the AVIF metadata, then delete the temporary file. Do not leave smoke files in uploads.

Completion criterion:

- Public HTTPS health passes.
- Local and remote hashes match when applicable.
- Changed behavior passes on the live endpoint/UI.
- Temporary test data/files are removed.

### 9. Report release evidence

Report only verified facts:

- Commit or release identifier.
- Backup path.
- Service state and readiness attempt.
- Domain/health result.
- Changed behavior smoke result.
- Any nonfatal warning.

Never report a deployment as complete if backup, readiness, or live behavior verification failed.

## Rollback

Rollback when the service does not become ready, live behavior fails, or the release causes regression.

1. Stop making additional edits.
2. Identify the exact backup created for this release.
3. Restore only files/artifact changed by the release.
4. Restore the database only if the release changed schema/data and file rollback is insufficient.
5. Restart the affected service with readiness retry.
6. Verify public health and the pre-release behavior.
7. Report the rollback and the concrete failure; do not claim the original deployment succeeded.

Never guess a backup path. List the release backup directory and choose the timestamp created during the current deployment.

## Project-specific notes

### PrasCell

- Admin artifact: `prascell/dist/adminprascell` locally.
- Runtime commonly serves `/root/prasapp/prascell/adminprascell/dist`.
- Preserve `/root/prasapp/prascell/adminprascell/uploads`.
- Uploads and server source are not part of disposable `dist`.

### PrasEats

- Verify both root build and admin backend checks.
- Preserve admin uploads and payment/menu media.
- Image upload changes can affect menu, profile, and payment flows; verify their storage contract without changing real order state.

### Prashoes

- Backend data may override frontend source.
- Preserve uploads and PostgreSQL data.
- Verify public/customer scoping for order, chat, payment, and push changes.
- Do not use a broad public smoke that notifies real users.

### Prashine

- Inspect current runtime before deployment; do not assume its artifact layout matches the other apps.
- Keep database and service isolated from the other Prasapp applications.

## Common pitfalls

1. **Deploying from a dirty monorepo.** Stage and transfer explicit files only.
2. **Replacing the whole runtime root.** This can delete `.env`, uploads, backups, or dependencies. Replace only inspected artifacts.
3. **Using one sleep after restart.** Use readiness retry and show the successful attempt.
4. **Checking only health.** Health proves the process responds, not that the changed behavior works.
5. **Checking only HTML markers.** Compare changed asset hashes or browser-computed behavior when cache can hide a stale release.
6. **Leaking credentials through debug output.** Never print environment files or expanded secret-bearing commands.
7. **Running synthetic writes against real customers.** Prefer non-destructive verification; isolate and clean test data when a write is unavoidable.
8. **Restarting all services for one project.** Restart only the affected service unless a shared dependency truly requires coordinated restarts.
9. **Treating warnings as failures or ignoring real failures.** Record harmless deprecation warnings separately; any nonzero verification command blocks completion.

## Final checklist

- [ ] Explicit user deployment request exists.
- [ ] `PROJECT.md`, `TODO.md`, and project skill read.
- [ ] Worktree and release scope audited.
- [ ] Canonical checks/build and focused ad-hoc verification pass.
- [ ] Live runtime paths and service inspected.
- [ ] Timestamped backup verified.
- [ ] Payload excludes secrets, uploads, dependencies, and unrelated files.
- [ ] Only scoped runtime files replaced.
- [ ] Only affected service restarted.
- [ ] Readiness retry passes.
- [ ] Public health and changed behavior pass.
- [ ] Exact hashes match when relevant.
- [ ] Temporary smoke files/data removed.
- [ ] Backup path and evidence reported.
