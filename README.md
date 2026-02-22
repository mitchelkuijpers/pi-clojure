# @mitchelkuijpers/pi-clojure

PI package that adds automatic Clojure repair/format behavior to PI sessions.

## What This Package Offers

This package ships one extension: `extensions/clojure.ts`.

The extension listens to `edit` and `write` tool results and, for Clojure-related files, runs:

- `clj-paren-repair <file>`
- `cljfmt fix <file>`

Supported extensions:
- `.clj`
- `.cljs`
- `.cljc`
- `.bb`
- `.edn`
- `.lpy`

You can control behavior in-session with:
- `/clojure-paren-repair on|off|status`
- `/clojure-fmt on|off|status`

State is persisted through custom entries:
- `auto-paren-repair/state`
- `auto-cljfmt/state`

The package uses explicit `pi` manifest paths in `package.json`:
- `pi.extensions`: `./extensions/*.ts`

## Installation

### Prerequisite

Install PI first (CLI command must be available as `pi`).

### Install from local path (recommended while developing)

```bash
pi install /absolute/path/to/pi-clojure -l
```

### Install from npm

```bash
pi install npm:@mitchelkuijpers/pi-clojure@0.1.0
```

### Install from git

```bash
pi install git:github.com/mitchelkuijpers/pi-clojure
```

### Verify installation

```bash
pi list
```

Look for `@mitchelkuijpers/pi-clojure` in the output.

## Docker Development Environment

The container includes:
- `pi`
- `bb`
- `cljfmt`
- `clj-paren-repair`
- `clj-nrepl-eval`

It also bind-mounts your host `~/.pi/agent` into `/home/piuser/.pi/agent` so the container reuses your existing Pi auth/settings.

Build the image:

```bash
docker compose build dev
```

Open an interactive shell in the container:

```bash
docker compose run --rm dev bash
```

Run smoke checks inside the container:

```bash
docker compose run --rm dev bash -lc "npm run smoke"
```

Run optional API-backed E2E:

```bash
ANTHROPIC_API_KEY=your_key_here docker compose run --rm dev bash -lc "npm run smoke:e2e"
```

## Development Validation

Preferred validation path:

```bash
docker compose build dev
docker compose run --rm dev bash -lc "npm run smoke"
```

Smoke scripts:
- `npm run smoke:offline`
- `npm run smoke:e2e`
- `npm run smoke`

## Troubleshooting

- `pi: command not found`
  - Use the Docker image where `@mariozechner/pi-coding-agent` is preinstalled.
- `~/.pi/agent` mount errors
  - Ensure the host directory exists: `mkdir -p ~/.pi/agent`.
- `package not found in pi list` after install
  - Confirm the install path and that `package.json` contains a `pi` manifest.
- API-backed E2E skipped
  - Set one provider key in the container environment.
