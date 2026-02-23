# @mitchelkuijpers/pi-clojure

PI package that adds automatic Clojure repair/format behavior to PI sessions.

## Quick Start

Install required tooling for this extension:

- `clj-paren-repair` (provided by [clojure-mcp-light](https://github.com/bhauman/clojure-mcp-light/tree/main?tab=readme-ov-file#clj-paren-repair))
- `cljfmt`

Quick check:

```bash
command -v clj-paren-repair
command -v cljfmt
```

Install from local path (recommended while developing)

```bash
pi install /absolute/path/to/pi-clojure -l
```

Install from npm

```bash
pi install npm:@mitchelkuijpers/pi-clojure@0.1.0
```

Install from git

```bash
pi install git:github.com/mitchelkuijpers/pi-clojure
```

Verify installation

```bash
pi list
```

Then edit or write a `.clj`, `.cljs`, `.cljc`, `.bb`, `.edn`, or `.lpy` file in PI.

Use these commands any time:

- `/clojure-paren-repair on|off|status`
- `/clojure-fmt on|off|status`

## What This Package Provides

This package ships one extension: `extensions/clojure.ts`.

It adds these integrations to PI sessions:

- Auto paren repair integration:
  - Triggers on `edit`/`write` tool results.
  - Runs `clj-paren-repair <file>`.
- Auto formatting integration:
  - Triggers on `edit`/`write` tool results.
  - Runs `cljfmt fix <file>`.
- Session command integration:
  - Adds `/clojure-paren-repair` and `/clojure-fmt` commands.
  - Persists on/off state between sessions.

Tooling required by these integrations:

- `clj-paren-repair` (from `clojure-mcp-light`)
- `cljfmt`

Supported file extensions:

- `.clj`
- `.cljs`
- `.cljc`
- `.bb`
- `.edn`
- `.lpy`

How to use:

1. Install the package (see Installation below).
2. Edit or write a supported Clojure file in PI.
3. The extension automatically runs repair/format steps and appends summaries to tool output.

Turn integrations on/off:

- Paren repair:
  - `/clojure-paren-repair status`
  - `/clojure-paren-repair off`
  - `/clojure-paren-repair on`
- Formatting:
  - `/clojure-fmt status`
  - `/clojure-fmt off`
  - `/clojure-fmt on`

The package uses explicit `pi` manifest paths in `package.json`:

- `pi.extensions`: `./extensions/*.ts`

## Installation

### Prerequisite

Install these tools first:

- Required for extension runtime:
  - `clj-paren-repair`
  - `cljfmt`
- Required for this repo's full dev/smoke workflow:
  - `bb`
  - `clj-nrepl-eval`

Quick check:

```bash
for tool in clj-paren-repair cljfmt bb clj-nrepl-eval; do command -v "$tool"; done
```

If you do not want to install these locally, use the Docker workflow below (all tools are preinstalled there).

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

## Example Project

A minimal example Clojure project is available at:

- `examples/basic-clojure`

It includes local PI package wiring in `examples/basic-clojure/.pi/settings.json`:

- `"packages": ["../.."]`

Run it from the example directory:

```bash
cd examples/basic-clojure
pi
```

## Docker Development Environment

The container includes:

- `pi`
- `bb`
- `cljfmt`
- `clj-paren-repair`
- `clj-nrepl-eval`
- `tmux`

It also bind-mounts your host `~/.pi/agent` into `/home/piuser/.pi/agent` so the container reuses your existing Pi auth/settings.

The compose setup also mounts host `~/.gitconfig` into the container so git identity/settings are available for commits made in-container. If you do not have this file yet, create it once on host with:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

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
- `~/.gitconfig` mount errors
  - Ensure host git config exists: `git config --global user.name "Your Name" && git config --global user.email "you@example.com"`.
- `package not found in pi list` after install
  - Confirm the install path and that `package.json` contains a `pi` manifest.
- API-backed E2E skipped
  - Set one provider key in the container environment.
