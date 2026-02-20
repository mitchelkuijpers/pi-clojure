# AGENTS.md

## Project Scope
- This repository is an extension-only PI package: `@mitchelkuijpers/pi-clojure`.
- Keep the package focused on `extensions/clojure.ts`.
- Do not add `skills/` or `prompts/` unless explicitly requested.

## Key Files
- Extension: `extensions/clojure.ts`
- Package manifest: `package.json`
- Docker image: `Dockerfile`
- Compose setup: `docker-compose.yml`
- Smoke scripts: `scripts/smoke-offline.sh`, `scripts/smoke-e2e.sh`, `scripts/smoke.sh`

## Local Workflow
- Type check:
  - `npm run typecheck`
- Preferred validation path:
  - `docker compose build dev`
  - `docker compose run --rm dev bash -lc "npm run smoke"`

## Docker Expectations
- The `dev` service mounts:
  - project workspace at `/workspace`
  - host `~/.pi/agent` at `/home/piuser/.pi/agent`
- Container should provide:
  - `pi`
  - `bb`
  - `cljfmt`
  - `clj-paren-repair`
  - `clj-nrepl-eval`

## Extension Behavior Notes
- `extensions/clojure.ts` listens for edit/write tool results and runs Clojure repair/format commands.
- Preserve command names and state entry types unless migration is intentional:
  - `/clojure-paren-repair`
  - `/clojure-fmt`
  - `auto-paren-repair/state`
  - `auto-cljfmt/state`

## Change Guidelines
- Prefer minimal, targeted edits.
- Keep docs and smoke scripts aligned with runtime behavior.
- If Docker tooling changes, re-run the full smoke flow in container before finalizing.

## Commit Policy
- Use Conventional Commits for all commit messages.
- Format: `<type>(optional-scope): <summary>`
- Examples:
  - `feat: add clj-nrepl-eval tool support`
  - `fix(docker): correct cljfmt wrapper quoting`
