import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isWidget = mode === "widget"

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isWidget ? [cssInjectedByJsPlugin({
        styleId: 'assistant-widget-styles',
        injectCodeFunction: function(cssCode: string) {
          (window as any).__assistantWidgetCSS = ((window as any).__assistantWidgetCSS || '') + cssCode;
        }
      })] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ...(isWidget
      ? {
          define: {
            "process.env.NODE_ENV": JSON.stringify("production"),
          },
          build: {
            lib: {
              entry: path.resolve(__dirname, "src/widget.tsx"),
              name: "ShmastraWidget",
              fileName: "assistant-widget",
              formats: ["iife"],
            },
            rollupOptions: {
              output: {
                inlineDynamicImports: true,
              },
            },
          },
        }
      : {}),
  }
})
