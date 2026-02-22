import { isEditToolResult, isWriteToolResult } from "@mariozechner/pi-coding-agent";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { extname, resolve } from "node:path";

const PAREN_STATE_ENTRY_TYPE = "auto-paren-repair/state";
const FORMAT_STATE_ENTRY_TYPE = "auto-cljfmt/state";
const CLOJURE_EXTENSIONS = new Set([".clj", ".cljs", ".cljc", ".bb", ".edn", ".lpy"]);
const DEBOUNCE_MS = 300;
const MAX_SNIPPET_CHARS = 600;

function normalizePath(path: string): string {
  return path.startsWith("@") ? path.slice(1) : path;
}

function getInputPath(input: Record<string, unknown>): string | undefined {
  const path = input.path;
  if (typeof path !== "string" || path.trim().length === 0) return undefined;
  return normalizePath(path.trim());
}

function isClojureFile(path: string): boolean {
  return CLOJURE_EXTENSIONS.has(extname(path).toLowerCase());
}

function clip(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_SNIPPET_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_SNIPPET_CHARS)}\n...`;
}

function buildRepairSummary(path: string, stdout: string, stderr: string, code: number): string {
  const parts: string[] = [];

  if (code === 0) {
    parts.push(`[clojure-paren-repair] Ran clj-paren-repair on ${path}.`);
  } else {
    parts.push(`[clojure-paren-repair] clj-paren-repair failed for ${path} (exit ${code}).`);
  }

  const out = clip(stdout);
  const err = clip(stderr);

  if (out.length > 0) parts.push(`stdout:\n${out}`);
  if (err.length > 0) parts.push(`stderr:\n${err}`);

  return parts.join("\n\n");
}

function buildFormatSummary(path: string, stdout: string, stderr: string, code: number): string {
  const parts: string[] = [];

  if (code === 0) {
    parts.push(`[clojure-fmt] Ran cljfmt fix on ${path}.`);
  } else {
    parts.push(`[clojure-fmt] cljfmt fix failed for ${path} (exit ${code}).`);
  }

  const out = clip(stdout);
  const err = clip(stderr);

  if (out.length > 0) parts.push(`stdout:\n${out}`);
  if (err.length > 0) parts.push(`stderr:\n${err}`);

  return parts.join("\n\n");
}

function loadEnabledState(
  ctx: ExtensionContext,
  entryType: string,
  defaultEnabled: boolean,
): boolean {
  let enabled = defaultEnabled;

  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "custom" || entry.customType !== entryType) continue;
    const data = entry.data as { enabled?: unknown } | undefined;
    if (typeof data?.enabled === "boolean") {
      enabled = data.enabled;
    }
  }

  return enabled;
}

export default function (pi: ExtensionAPI) {
  let parenRepairEnabled = true;
  let formatEnabled = true;

  const lastRepairRunByPath = new Map<string, number>();
  const lastFormatRunByPath = new Map<string, number>();

  pi.on("session_start", async (_event, ctx) => {
    parenRepairEnabled = loadEnabledState(ctx, PAREN_STATE_ENTRY_TYPE, true);
    formatEnabled = loadEnabledState(ctx, FORMAT_STATE_ENTRY_TYPE, true);
  });

  pi.registerCommand("clojure-paren-repair", {
    description: "Control auto clj-paren-repair: /clojure-paren-repair on|off|status",
    handler: async (args, ctx) => {
      const command = args.trim().toLowerCase();

      if (command === "status" || command.length === 0) {
        if (ctx.hasUI) {
          ctx.ui.notify(
            `Clojure paren repair is ${parenRepairEnabled ? "on" : "off"}.`,
            "info",
          );
        }
        return;
      }

      if (command === "on") {
        parenRepairEnabled = true;
        pi.appendEntry(PAREN_STATE_ENTRY_TYPE, { enabled: parenRepairEnabled });
        if (ctx.hasUI) {
          ctx.ui.notify("Clojure paren repair enabled.", "info");
        }
        return;
      }

      if (command === "off") {
        parenRepairEnabled = false;
        pi.appendEntry(PAREN_STATE_ENTRY_TYPE, { enabled: parenRepairEnabled });
        if (ctx.hasUI) {
          ctx.ui.notify("Clojure paren repair disabled.", "info");
        }
        return;
      }

      if (ctx.hasUI) {
        ctx.ui.notify("Usage: /clojure-paren-repair on|off|status", "warning");
      }
    },
  });

  pi.registerCommand("clojure-fmt", {
    description: "Control auto cljfmt fix: /clojure-fmt on|off|status",
    handler: async (args, ctx) => {
      const command = args.trim().toLowerCase();

      if (command === "status" || command.length === 0) {
        if (ctx.hasUI) {
          ctx.ui.notify(`Clojure format is ${formatEnabled ? "on" : "off"}.`, "info");
        }
        return;
      }

      if (command === "on") {
        formatEnabled = true;
        pi.appendEntry(FORMAT_STATE_ENTRY_TYPE, { enabled: formatEnabled });
        if (ctx.hasUI) {
          ctx.ui.notify("Clojure format enabled.", "info");
        }
        return;
      }

      if (command === "off") {
        formatEnabled = false;
        pi.appendEntry(FORMAT_STATE_ENTRY_TYPE, { enabled: formatEnabled });
        if (ctx.hasUI) {
          ctx.ui.notify("Clojure format disabled.", "info");
        }
        return;
      }

      if (ctx.hasUI) {
        ctx.ui.notify("Usage: /clojure-fmt on|off|status", "warning");
      }
    },
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.isError) return undefined;
    if (!isEditToolResult(event) && !isWriteToolResult(event)) return undefined;
    if (!parenRepairEnabled && !formatEnabled) return undefined;

    const filePath = getInputPath(event.input);
    if (!filePath) return undefined;

    const absolutePath = resolve(ctx.cwd, filePath);
    if (!isClojureFile(absolutePath)) return undefined;

    const updates: Array<{ type: "text"; text: string }> = [];
    const now = Date.now();

    if (parenRepairEnabled) {
      const lastRepairRun = lastRepairRunByPath.get(absolutePath) ?? 0;
      if (now - lastRepairRun >= DEBOUNCE_MS) {
        lastRepairRunByPath.set(absolutePath, now);

        try {
          const result = await pi.exec("clj-paren-repair", [absolutePath], {
            timeout: 30_000,
          });
          updates.push({
            type: "text",
            text: buildRepairSummary(filePath, result.stdout, result.stderr, result.code),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          updates.push({
            type: "text",
            text: `[clojure-paren-repair] Failed to run clj-paren-repair on ${filePath}: ${message}`,
          });
        } finally {
          // Record completion time so follow-up tool_result events from this run remain debounced.
          lastRepairRunByPath.set(absolutePath, Date.now());
        }
      }
    }

    if (formatEnabled) {
      const lastFormatRun = lastFormatRunByPath.get(absolutePath) ?? 0;
      if (now - lastFormatRun >= DEBOUNCE_MS) {
        lastFormatRunByPath.set(absolutePath, now);

        try {
          const result = await pi.exec("cljfmt", ["fix", absolutePath], {
            cwd: ctx.cwd,
            timeout: 60_000,
          });
          updates.push({
            type: "text",
            text: buildFormatSummary(filePath, result.stdout, result.stderr, result.code),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          updates.push({
            type: "text",
            text: `[clojure-fmt] Failed to run cljfmt fix on ${filePath}: ${message}`,
          });
        } finally {
          // Record completion time so follow-up tool_result events from this run remain debounced.
          lastFormatRunByPath.set(absolutePath, Date.now());
        }
      }
    }

    if (updates.length === 0) return undefined;

    return {
      content: [...event.content, ...updates],
    };
  });
}
