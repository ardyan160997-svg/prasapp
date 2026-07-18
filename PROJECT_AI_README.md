# Per-Project AI Agent Package

Extract this ZIP directly into the root of each project.

Expected result:

```text
project-root/
├── AGENTS.md
├── CLAUDE.md
├── GEMINI.md
├── TODO.md
├── AI_WORKFLOW.md
├── PROJECT_AI_README.md
└── .ai/
    ├── templates/
    │   └── task.md
    └── checklists/
        └── validation.md
```

## macOS installation

```bash
cd /path/to/your/project
unzip -n ~/Downloads/ai-project-agent-root.zip -d .
```

`-n` prevents existing files from being overwritten.

To intentionally replace an existing template after making a backup:

```bash
cp AGENTS.md AGENTS.md.backup
unzip -o ~/Downloads/ai-project-agent-root.zip -d .
```

## Files used by each CLI

- Codex CLI and OpenCode: `AGENTS.md`
- Claude Code: `CLAUDE.md`
- Gemini CLI: `GEMINI.md`

The three instruction files contain the same project rules so the repository works
with different Agent CLIs.

## First use

1. Replace the example task in `TODO.md`.
2. Start the Agent CLI from the project root.
3. Prompt:

```text
Read the active project instruction file, AI_WORKFLOW.md, and TODO.md.
Select the highest-priority pending task whose dependencies are complete.
Classify it before editing. If the current combo is wrong, stop and report
the combo I must select.
```

## Version control

Normally commit these files so every session and collaborator receives the same
project rules. Do not place credentials or environment secrets in them.
