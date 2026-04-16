# Shmastra Widget

Chat widget for the [Shmastra](https://github.com/just-ai/shmastra) coding agent. 
Built as a standalone IIFE bundle and embedded into [Mastra Studio](https://mastra.ai/) via Shadow DOM. 
This keeps Shmastra from becoming a monorepo and preserves compatibility with the Mastra template format.

## Building

```bash
npm install

# Development mode (standard React app with HMR)
npm run dev

# Production widget build (IIFE bundle)
npm run build:widget
```

`build:widget` produces a single file `dist/assistant-widget.iife.js` containing all JS, CSS, and React. CSS is injected via JS and placed inside the Shadow DOM, so it never affects host page styles.

## Usage

### Programmatic initialization

```html
<script src="assistant-widget.iife.js"></script>
<script>
  AssistantWidget.initAssistantWidget({
    apiBaseUrl: 'http://localhost:4111',
    theme: 'dark',           // 'light' | 'dark' | 'system' (default)
    element: '#my-container', // CSS selector or HTMLElement (optional)
    width: '30rem',          // CSS value for --widget-width
    height: '80vh',          // CSS value for --widget-height
  });
</script>
```

### Auto-initialization

If the page contains a `<div id="assistant-widget">`, the widget mounts there automatically. Settings are passed via `data-*` attributes:

```html
<div id="assistant-widget"
     data-api-base-url="http://localhost:4111"
     data-theme="light">
</div>
<script src="assistant-widget.iife.js"></script>
```

### `initAssistantWidget` options

| Option       | Type                             | Default              | Description                                                                 |
|--------------|----------------------------------|----------------------|-----------------------------------------------------------------------------|
| `element`    | `HTMLElement \| string`          | new `div`            | Mount container. Selector or element. If omitted, a new `div` is appended to `body`. |
| `apiBaseUrl` | `string`                         | `""`                 | Base URL of the Shmastra server (e.g. `http://localhost:4111`).              |
| `theme`      | `'light' \| 'dark' \| 'system'` | `'system'`           | Color theme. `system` tracks `prefers-color-scheme`.                         |
| `width`      | `string`                         | `25rem`              | Widget panel width (any CSS value).                                          |
| `height`     | `string`                         | `calc(100vh - 6rem)` | Widget panel height (any CSS value).                                         |

Returns `{ unmount: () => void }` to remove the widget.

### Host page CSS variables

The panel shadow is controlled by a variable on the host element:

```css
body {
  --widget-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
}
```

## Architecture

- **Shadow DOM** — the widget mounts into a Shadow Root. All styles (Tailwind CSS v4, shadcn/ui) are encapsulated and won't conflict with the host page.
- **IIFE bundle** — `vite build --mode widget` bundles everything (React, React DOM, libraries) into a single `assistant-widget.iife.js`. CSS is inlined via `vite-plugin-css-injected-by-js`.
- **API** — the widget communicates with the Shmastra server over REST:
  - `GET /shmastra/api/thread` — create or retrieve a thread
  - `POST /shmastra/api/chat` — stream responses (AI SDK compatible)
  - `POST /shmastra/api/answer` — user response to `ask_user`
  - `POST /shmastra/api/vars` — submit environment variables
  - `GET/POST /shmastra/api/connection/:toolkit` — OAuth toolkit connection
  - `POST /shmastra/api/files` — file attachment upload
  - `GET /health` — server availability check

## Features

- Streaming assistant responses with Markdown rendering (GFM, code highlighting)
- Model selector with provider grouping and recent history
- Resizable panel via left-edge drag handle
- Voice input (Web Speech API)
- File attachments (drag-and-drop)
- Browser notifications on response completion or action requests
- Session reset (new thread)
- Automatic server restart detection with UI blocking until ready

## Tool UI

The widget includes specialized UI components for agent tool calls:

### Interactive (require user action)

| Tool | Description |
|------|-------------|
| `ask_user` | Question card from the agent. Shows predefined options as buttons or a free-text input field. |
| `ask_env_vars_safely` | Form for entering environment variables (with password fields for secrets). |
| `connect_toolkit` | Authorization button for external toolkits via OAuth popup, with logo and connection status. |

### File operations

| Tool | Description |
|------|-------------|
| `view` | Collapsible block with file contents rendered as Markdown. |
| `write_file` | Shows the file path and content being written. |
| `string_replace_lsp` | Diff view: old text (red) and new text (green). |
| `delete_file` | Row with trash icon and target file path. |
| `find_files` | File search — shows pattern, match count, and list of found files. |
| `search_content` | Grep-style content search — pattern, match count, and results. |
| `apply_changes` | Three-phase indicator: applying changes, server restart, done. |

### Tasks and skills

| Tool | Description |
|------|-------------|
| `task_write` | Current active task with progress counter (completed/total). |
| `task_check` | Task status summary with list and status icons. |
| `skill` | Skill learning indicator: "Learning..." / "Learned [name]". |
| `skill_read` | Skill file reading indicator. |

### Commands and integrations

| Tool | Description |
|------|-------------|
| `execute_command` | Terminal command — shows command and stdout/stderr in a monospace block. |
| `execute_toolkit_tool` | Minimal inline status for toolkit tool execution. |
| `search_toolkits` | Shimmer indicator while searching toolkits. |
| `search_mcp_servers` | Shimmer indicator while searching MCP servers. |
| `subagent` | Sub-agent card: type, task, execution time, model, and Markdown response. |

### Hidden

`get_toolkit_tool_schema` and `recall` are registered but not displayed in the UI.

Unrecognized tool calls use a fallback component with a JSON tree of arguments and result.

## Tech stack

- React 19, TypeScript, Vite 7
- [assistant-ui](https://github.com/assistant-ui/assistant-ui) — chat interface primitives
- [AI SDK](https://sdk.vercel.ai/) — streaming transport
- Tailwind CSS v4, shadcn/ui (new-york)
- Zustand — state management
- Shadow DOM — style isolation

## Development

```bash
npm run dev       # Dev server with HMR (http://localhost:5173)
npm run build     # Full build (tsc + vite)
npm run lint      # ESLint
npm run preview   # Preview production build
```

In `dev` mode the widget runs as a regular React app (no Shadow DOM), connecting to `http://localhost:4111`. To test the IIFE bundle, use `example.html` after running `npm run build:widget`.
