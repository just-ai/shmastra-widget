"use client";

import { memo, useState } from "react";
import {
  WrenchIcon,
} from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import type {
  ToolCallMessagePartComponent,
} from "@assistant-ui/react";
import { cn } from "@/lib/utils.ts";

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null) return <span className="text-orange-400">null</span>;
  if (value === undefined) return <span className="text-orange-400">undefined</span>;
  if (typeof value === "boolean")
    return <span className="text-orange-400">{String(value)}</span>;
  if (typeof value === "number")
    return <span className="text-blue-400">{String(value)}</span>;
  if (typeof value === "string") {
    if (value.length > 300) {
      return <span className="text-green-400">"{value.slice(0, 300)}…"</span>;
    }
    return <span className="text-green-400">"{value}"</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">[]</span>;
    return (
      <span>
        <span className="text-muted-foreground">[</span>
        <div className="ml-4">
          {value.map((item, i) => (
            <div key={i}>
              <JsonValue value={item} depth={depth + 1} />
              {i < value.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">]</span>
      </span>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-muted-foreground">{"{}"}</span>;
    return (
      <span>
        <span className="text-muted-foreground">{"{"}</span>
        <div className="ml-4">
          {entries.map(([key, val], i) => (
            <div key={key}>
              <span className="text-purple-400">{key}</span>
              <span className="text-muted-foreground">: </span>
              <JsonValue value={val} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">{"}"}</span>
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

function ResultContent({ result }: { result: unknown }) {
  if (result === undefined || result === null) return null;
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return <JsonValue value={parsed} />;
    } catch {
      return <span className="text-muted-foreground whitespace-pre-wrap">{result}</span>;
    }
  }
  return <JsonValue value={result} />;
}

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const [open, setOpen] = useState(false);
  const isRunning = status?.type === "running";
  const isCancelled =
    status?.type === "incomplete" && status.reason === "cancelled";

  const errorText =
    status?.type === "incomplete" && status.error
      ? typeof status.error === "string"
        ? status.error
        : JSON.stringify(status.error)
      : null;

  let parsedArgs: Record<string, unknown> | null = null;
  if (argsText) {
    try {
      parsedArgs = JSON.parse(argsText);
    } catch {
      // keep null
    }
  }

  return (
    <div
      {...(result !== undefined ? {"data-tool-done": ""} : {})}
      className={cn(
        "rounded-lg border bg-muted/20 text-xs overflow-hidden",
        isCancelled && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <WrenchIcon className="size-3.5 shrink-0" />
        <span className="truncate flex-1 text-left">
          <span className="text-foreground font-medium">{toolName}</span>
        </span>
        <ToolStatusIcon isRunning={isRunning} isError={!!errorText} open={open} />
      </button>
      {open && (
        <div className="border-t px-3 py-2 max-h-80 overflow-y-auto font-mono leading-relaxed">
          {errorText && (
            <div className="text-destructive mb-2">{errorText}</div>
          )}
          {parsedArgs && Object.keys(parsedArgs).length > 0 && (
            <div className="mb-2">
              <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wider mb-1">Args</div>
              <JsonValue value={parsedArgs} />
            </div>
          )}
          {!parsedArgs && argsText && (
            <div className="mb-2">
              <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wider mb-1">Args</div>
              <pre className="whitespace-pre-wrap text-muted-foreground">{argsText}</pre>
            </div>
          )}
          {result !== undefined && !isCancelled && (
            <div>
              <div className="text-muted-foreground/60 text-[10px] uppercase tracking-wider mb-1">Result</div>
              <ResultContent result={result} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ToolFallback = memo(
  ToolFallbackImpl,
) as unknown as ToolCallMessagePartComponent;

ToolFallback.displayName = "ToolFallback";

export { ToolFallback };
