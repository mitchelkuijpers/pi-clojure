# AGENTS.md

## Project purpose
This directory is an example Clojure project used to test the parent project:
`@mitchelkuijpers/pi-clojure`.

The parent project is a PI extension package that improves Clojure development
(e.g. auto paren repair and formatting after edit/write tool calls).

## Scope
- Keep this project minimal.
- Use it to validate extension behavior, not to build app features.
- Main sample code: `src/example/core.clj`.

## Quick test commands
Run these from this directory.

### 1) Basic file discovery and grep
```bash
find src -maxdepth 3 -type f | sort
rg "greet|example.core" src
```

### 2) Start an nREPL server and evaluate forms
```bash
tmux new-session -d -s nrepl-server "clj -Sdeps '{:deps {nrepl/nrepl {:mvn/version \"1.3.1\"}}}' -M -m nrepl.cmdline --port 7888"
clj-nrepl-eval --discover-ports
clj-nrepl-eval -p 7888 "(require '[example.core :as ex] :reload)"
clj-nrepl-eval -p 7888 "(ex/greet \"PI\")"
```

### 3) Optional: extension behavior checks inside PI
```bash
pi
```
Then edit `src/example/core.clj` and verify:
- auto paren repair
- auto formatting
- `/clojure-paren-repair status`
- `/clojure-fmt status`
