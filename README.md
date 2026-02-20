# @mitchelkuijpers/pi-clojure

PI package scaffold for Clojure and ClojureScript development workflows.

## What This Package Provides

- TypeScript extension: `extensions/clojure.ts`

The package uses explicit `pi` manifest paths in `package.json`:

- `pi.extensions`: `./extensions/*.ts`

## Local Package Usage

Install this package from a local path:

```bash
pi install /absolute/path/to/pi-clojure -l
```

Install from npm (after publish):

```bash
pi install npm:@mitchelkuijpers/pi-clojure@0.1.0
```

Install from git:

```bash
pi install git:github.com/mitchelkuijpers/pi-clojure
```

## Docker Dev/Test Environment

The container includes:
- `pi`
- `clj-paren-repair`
- `clj-nrepl-eval`
- `cljfmt`
- `bb`

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

Run optional API-backed E2E (example with Anthropic):

```bash
ANTHROPIC_API_KEY=your_key_here docker compose run --rm dev bash -lc "npm run smoke:e2e"
```

## Smoke Test Breakdown

- `npm run smoke:offline`
  - Installs dependencies
  - Runs TypeScript checks
  - Verifies `pi` CLI availability
  - Verifies `bb`, `cljfmt`, `clj-paren-repair`, and `clj-nrepl-eval` are installed
  - Installs package locally with `pi install <path> -l`
  - Asserts local source path appears in `pi list` and package name metadata is correct
  - Validates extension file exists
- `npm run smoke:e2e`
  - Runs only when one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_API_KEY` is set
  - Executes a minimal `pi -p` call with explicit `-e`

## Troubleshooting

- `pi: command not found`
  - Use the Docker image where `@mariozechner/pi-coding-agent` is preinstalled.
- `~/.pi/agent` mount errors
  - Ensure the host directory exists: `mkdir -p ~/.pi/agent`.
- `package not found in pi list` after install
  - Confirm the install path and that `package.json` contains a `pi` manifest.
- API-backed E2E skipped
  - Set one provider key in the container environment.
