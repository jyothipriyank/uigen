import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallBadge, getToolLabel } from "../ToolCallBadge";

// getToolLabel unit tests

test("getToolLabel: str_replace_editor create with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/components/Button.jsx" })).toBe("Creating Button.jsx");
});

test("getToolLabel: str_replace_editor create without path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.tsx" })).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/src/utils.ts" })).toBe("Editing utils.ts");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/index.jsx" })).toBe("Reading index.jsx");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Undoing edit in App.jsx");
});

test("getToolLabel: str_replace_editor unknown command with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown", path: "/App.jsx" })).toBe("Processing App.jsx");
});

test("getToolLabel: str_replace_editor no args", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("Processing file");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx" })).toBe("Renaming old.jsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/components/Unused.jsx" })).toBe("Deleting Unused.jsx");
});

test("getToolLabel: file_manager without path", () => {
  expect(getToolLabel("file_manager", { command: "rename" })).toBe("Renaming file");
});

test("getToolLabel: unknown tool name falls back to tool name", () => {
  expect(getToolLabel("some_other_tool", { command: "foo" })).toBe("some_other_tool");
});

// ToolCallBadge component tests

test("ToolCallBadge shows friendly label for create command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "File created: /App.jsx",
      }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolCallBadge shows friendly label for str_replace command", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "2",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/components/Card.jsx" },
        state: "result",
        result: "Replaced 1 occurrence",
      }}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("ToolCallBadge shows green dot when done", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "3",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallBadge shows spinner when in progress", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "4",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows friendly label for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "5",
        toolName: "file_manager",
        args: { command: "delete", path: "/components/Old.jsx" },
        state: "result",
        result: { success: true },
      }}
    />
  );
  expect(screen.getByText("Deleting Old.jsx")).toBeDefined();
});
