import { describe, expect, it } from "vitest";

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

import clojureExtension from "../extensions/clojure.js";

type EventHandler = (event: unknown, ctx: unknown) => Promise<unknown> | unknown;
type CommandHandler = (args: string, ctx: unknown) => Promise<void>;

type CommandRegistration = {
  description?: string;
  handler: CommandHandler;
};

type ExecResult = {
  stdout: string;
  stderr: string;
  code: number;
};

type ExecCall = {
  command: string;
  args: string[];
  options?: Record<string, unknown>;
};

type AppendedEntry = {
  customType: string;
  data: unknown;
};

type ExecImpl = (
  command: string,
  args: string[],
  options?: Record<string, unknown>,
) => Promise<ExecResult>;

function createHarness() {
  const events = new Map<string, EventHandler>();
  const commands = new Map<string, CommandRegistration>();
  const appendEntries: AppendedEntry[] = [];
  const execCalls: ExecCall[] = [];

  let execImpl: ExecImpl = async () => ({ stdout: "", stderr: "", code: 0 });

  const api = {
    on(eventName: string, handler: EventHandler) {
      events.set(eventName, handler);
    },
    registerCommand(name: string, options: CommandRegistration) {
      commands.set(name, options);
    },
    appendEntry(customType: string, data?: unknown) {
      appendEntries.push({ customType, data });
    },
    async exec(command: string, args: string[], options?: Record<string, unknown>) {
      execCalls.push({ command, args, options });
      return execImpl(command, args, options);
    },
  };

  clojureExtension(api as unknown as ExtensionAPI);

  return {
    events,
    commands,
    appendEntries,
    execCalls,
    setExecImpl: (impl: typeof execImpl) => {
      execImpl = impl;
    },
  };
}

function createContext(branchEntries: unknown[] = []) {
  const notifications: Array<{ message: string; level: string }> = [];
  const ctx = {
    cwd: "/workspace",
    hasUI: true,
    ui: {
      notify: (message: string, level: string) => {
        notifications.push({ message, level });
      },
    },
    sessionManager: {
      getBranch: () => branchEntries,
    },
  };

  return { ctx, notifications };
}

function getEventHandler(harness: ReturnType<typeof createHarness>, eventName: string): EventHandler {
  const handler = harness.events.get(eventName);
  if (!handler) {
    throw new Error(`Expected '${eventName}' event handler to be registered.`);
  }
  return handler;
}

function getCommandHandler(harness: ReturnType<typeof createHarness>, command: string): CommandHandler {
  const registration = harness.commands.get(command);
  if (!registration) {
    throw new Error(`Expected '/${command}' command to be registered.`);
  }
  return registration.handler;
}

function makeEditResultEvent(path: string) {
  return {
    type: "tool_result",
    toolCallId: "call-1",
    toolName: "edit",
    input: { path },
    content: [{ type: "text", text: "original content" }],
    isError: false,
    details: undefined,
  };
}

describe("clojure extension", () => {
  it("loads persisted state and command toggles append state entries", async () => {
    const harness = createHarness();
    const sessionStart = getEventHandler(harness, "session_start");
    const parenRepairCommand = getCommandHandler(harness, "clojure-paren-repair");
    const formatCommand = getCommandHandler(harness, "clojure-fmt");
    const { ctx, notifications } = createContext([
      { type: "custom", customType: "auto-paren-repair/state", data: { enabled: true } },
      { type: "custom", customType: "auto-paren-repair/state", data: { enabled: false } },
      { type: "custom", customType: "auto-cljfmt/state", data: { enabled: false } },
    ]);

    await sessionStart({ type: "session_start" }, ctx);

    await parenRepairCommand("status", ctx);
    await formatCommand("status", ctx);
    expect(notifications.at(-2)?.message).toBe("Clojure paren repair is off.");
    expect(notifications.at(-1)?.message).toBe("Clojure format is off.");

    await parenRepairCommand("on", ctx);
    await formatCommand("on", ctx);

    expect(harness.appendEntries).toStrictEqual([
      { customType: "auto-paren-repair/state", data: { enabled: true } },
      { customType: "auto-cljfmt/state", data: { enabled: true } },
    ]);
  });

  it("tool_result runs repair and format for clojure files", async () => {
    const harness = createHarness();
    harness.setExecImpl(async (command: string) => {
      if (command === "clj-paren-repair") {
        return { stdout: "repaired", stderr: "", code: 0 };
      }

      return { stdout: "formatted", stderr: "", code: 0 };
    });

    const toolResult = getEventHandler(harness, "tool_result");
    const { ctx } = createContext();

    const result = (await toolResult(makeEditResultEvent("src/core.clj"), ctx)) as
      | { content: Array<{ type: string; text?: string }> }
      | undefined;

    expect(harness.execCalls).toHaveLength(2);
    expect(harness.execCalls[0]?.command).toBe("clj-paren-repair");
    expect(harness.execCalls[1]?.command).toBe("bb");
    expect(result?.content).toHaveLength(3);
    expect(result?.content[1]?.text ?? "").toMatch(/\[clojure-paren-repair\]/);
    expect(result?.content[2]?.text ?? "").toMatch(/\[clojure-fmt\]/);
  });

  it("debounce uses completion time to suppress follow-up events after slow runs", async () => {
    const harness = createHarness();
    const parenRepairCommand = getCommandHandler(harness, "clojure-paren-repair");
    const formatCommand = getCommandHandler(harness, "clojure-fmt");
    const toolResult = getEventHandler(harness, "tool_result");
    const { ctx } = createContext();

    await parenRepairCommand("on", ctx);
    await formatCommand("off", ctx);

    harness.setExecImpl(async () => ({ stdout: "", stderr: "", code: 0 }));

    const originalNow = Date.now;
    const fakeTimes = [1_000, 1_700, 1_710];
    let index = 0;

    Date.now = () => fakeTimes[Math.min(index++, fakeTimes.length - 1)] as number;

    try {
      await toolResult(makeEditResultEvent("src/slow.clj"), ctx);
      await toolResult(makeEditResultEvent("src/slow.clj"), ctx);
    } finally {
      Date.now = originalNow;
    }

    expect(harness.execCalls).toHaveLength(1);
    expect(harness.execCalls[0]?.command).toBe("clj-paren-repair");
  });
});
