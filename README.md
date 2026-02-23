# @mitchelkuijpers/pi-clojure

PI package that adds automatic Clojure repair + formatting after `edit`/`write` tool calls.

## 1) What you need

Required to run the extension:

- `pi`
- `clj-paren-repair`
- `cljfmt`

Required for this repo's full smoke workflow:

- `bb`
- `clj-nrepl-eval`

Quick check:

```bash
for tool in pi clj-paren-repair cljfmt bb clj-nrepl-eval; do command -v "$tool"; done
```

If you do not want to install tools locally, use the Docker workflow below.

## 2) Install

### Local path (recommended while developing)

```bash
pi install /absolute/path/to/pi-clojure -l
```

### npm

```bash
pi install npm:@mitchelkuijpers/pi-clojure@0.1.0
```

### git

```bash
pi install git:github.com/mitchelkuijpers/pi-clojure
```

### Verify

```bash
pi list
```

## 3) Use

Edit or write one of these file types in PI:

- `.clj` `.cljs` `.cljc` `.bb` `.edn` `.lpy`

What happens automatically:

- `clj-paren-repair <file>`
- `cljfmt fix <file>`

Runtime commands:

- `/clojure-paren-repair on|off|status`
- `/clojure-fmt on|off|status`

## 4) Example project

A minimal example is included at `examples/basic-clojure`.

```bash
cd examples/basic-clojure
pi
```

## 5) Docker development

Use Docker if you want all tools preinstalled (`pi`, `bb`, `cljfmt`, `clj-paren-repair`, `clj-nrepl-eval`).

Compose mounts:

- project -> `/workspace`
- host `~/.pi/agent` -> `/home/piuser/.pi/agent`
- host `~/.gitconfig` -> `/home/piuser/.gitconfig` (git identity in container)

If `~/.gitconfig` does not exist yet:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Build and run:

```bash
docker compose build dev
docker compose run --rm dev bash
```

Run smoke checks:

```bash
docker compose run --rm dev bash -lc "npm run smoke"
```

Optional API-backed E2E:

```bash
ANTHROPIC_API_KEY=your_key_here docker compose run --rm dev bash -lc "npm run smoke:e2e"
```

## 6) Contributing quick checks

```bash
npm run typecheck
docker compose build dev
docker compose run --rm dev bash -lc "npm run smoke"
```

## Troubleshooting

- `pi: command not found`
  - Install PI locally or use Docker workflow.
- `~/.pi/agent` mount errors
  - Run: `mkdir -p ~/.pi/agent`
- `~/.gitconfig` mount errors
  - Set global git identity (commands above).
- Package missing in `pi list`
  - Re-check install source and `package.json` manifest.
