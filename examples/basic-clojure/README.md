# basic-clojure example

Minimal Clojure project configured to load the local `@mitchelkuijpers/pi-clojure` package.

## Structure

- `.pi/settings.json` loads this repo as a local PI package
- `deps.edn` minimal Clojure project config
- `src/example/core.clj` sample file for testing auto repair/format behavior

## Use

From this directory:

```bash
pi
```

Then edit `src/example/core.clj` using PI tools (`edit`/`write`) to verify:

- auto paren repair (`clj-paren-repair`)
- auto formatting (`cljfmt`)

Optional PI commands:

- `/clojure-paren-repair status`
- `/clojure-fmt status`
