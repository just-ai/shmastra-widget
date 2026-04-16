# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A standalone chat widget for the Shmastra coding agent (https://github.com/just-ai/shmastra). It builds as a single IIFE JS bundle that embeds into Mastra Studio via Shadow DOM. This is a separate repo (not a monorepo) so that Shmastra remains a valid Mastra template.

## Commands

```bash
npm run dev           # Vite dev server with HMR (http://localhost:5173)
npm run build:widget  # Production IIFE bundle → dist/assistant-widget.iife.js
npm run build         # Full build (tsc + vite, standard app mode)
npm run lint          # ESLint
```

Test the IIFE bundle by opening `example.html` after `build:widget`.

## Architecture

### Two build modes (controlled by vite.config.ts)

- **Default mode** (`npm run dev` / `npm run build`): standard React SPA, mounts to `#root` via `src/main.tsx`. No Shadow DOM.
- **Widget mode** (`npm run build:widget`): IIFE library build from `src/widget.tsx`. All CSS is injected into JS via `vite-plugin-css-injected-by-js` and applied inside a Shadow Root at runtime. React, React DOM, and all dependencies are bundled inline.

### Entry points

- `src/main.tsx` — dev/SPA entry, renders `<App>` directly.
- `src/widget.tsx` — IIFE entry, exports `initAssistantWidget()`. Creates Shadow DOM, injects CSS, handles theme, mounts React. Also supports auto-init via `<div id="assistant-widget">`.

### Shadow DOM considerations

All CSS uses `:host` and `:host(.dark)` selectors alongside `:root` (see `src/index.css`). The `ShadowRootContext` (`src/lib/shadow-root-context.ts`) provides the shadow root to components that need portal containers (modals, tooltips). `ThemeWrapper` skips `next-themes` when inside Shadow DOM since theme classes are applied directly to the shadow host.

### Core component tree

`App` → `Assistant` (`src/components/assistant.tsx`) → `AssistantRuntimeProvider` → `AssistantModal` + all Tool UIs.

`Assistant` fetches thread data on mount, sets up the `useChatRuntime` transport to `/shmastra/api/chat`, and registers all tool UI components as children of the runtime provider.

### Tool UI pattern

Each tool UI in `src/components/assistant-ui/tools/` registers itself with `@assistant-ui/react`'s tool call rendering system. Interactive tools (`ask_user`, `ask_env_vars_safely`, `connect_toolkit`) submit results back via API calls. File/command tools use a collapsible wrapper pattern from `collapsible-tools.tsx` that auto-collapses completed tools. `HiddenToolUi` renders `null` for tools that should be invisible.

### API layer

`src/lib/api.ts` — all server communication. Thread ID is persisted in `localStorage` under `shmastra_thread_id`. The `apiBaseUrl` is set once via `setApiBaseUrl()` and all endpoints are relative to it under `/shmastra/api/`.

### Key contexts

- `ModelContext` (`src/lib/model-context.tsx`) — selected model ID and available models list.
- `ServerStatusContext` (`src/lib/server-status-context.tsx`) — tracks server restarts, blocks UI with a full-screen overlay during restart polling.
- `TaskContext` (`src/lib/task-context.ts` + `.tsx`) — shared task list state with claim-based ownership for deduplication across multiple `task_write` tool call instances.
- `ShadowRootContext` — provides shadow root for portal containers.

## Style system

Tailwind CSS v4 with `@tailwindcss/vite` plugin. shadcn/ui components (new-york style) in `src/components/ui/`. Theme variables defined in `src/index.css` using oklch colors with both `:root`/`:host` (light) and `.dark`/`:host(.dark)` variants. The `components.json` configures shadcn CLI with `@/` path aliases.
