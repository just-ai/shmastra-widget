# Shmastra Widget

Chat widget for the [Shmastra](https://github.com/just-ai/shmastra) coding agent. Lives in a separate repo so Shmastra stays a valid [Mastra template](https://mastra.ai/) — installable via `npx create-mastra@latest --template` without becoming a monorepo.

Built as a standalone IIFE bundle and embedded into Mastra Studio via Shadow DOM.

[Read the docs →](https://just-ai.github.io/shmastra-docs/shmastra/the-chat-widget.html)

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

## Features

- Streaming responses with Markdown rendering (GFM, code highlighting)
- Model selector with provider grouping and recent history
- Resizable panel via left-edge drag handle
- Voice input (Web Speech API)
- File attachments (drag-and-drop)
- Browser notifications on response completion or action requests
- Session reset (new thread)
- Automatic server restart detection with UI blocking until ready
- Specialized UI for agent tool calls (file diffs, OAuth prompts, env var forms, sub-agent cards)

## Development

```bash
npm run dev       # Dev server with HMR (http://localhost:5173)
npm run build     # Full build (tsc + vite)
npm run lint      # ESLint
npm run preview   # Preview production build
```

In `dev` mode the widget runs as a regular React app (no Shadow DOM), connecting to `http://localhost:4111`. To test the IIFE bundle, use `example.html` after running `npm run build:widget`.
