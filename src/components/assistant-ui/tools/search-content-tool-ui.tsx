import { makeAssistantToolUI } from "@assistant-ui/react";
import { SearchIcon } from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import { useState } from "react";

type SearchContentArgs = {
    pattern: string;
    path?: string;
    contextLines?: number;
    caseSensitive?: boolean;
    maxCount?: number;
};

type SearchContentResult = string;

function SearchContentRender({ args, result, status }: { args: SearchContentArgs; result?: SearchContentResult; status?: { type: string } }) {
    const [open, setOpen] = useState(false);
    const isRunning = status?.type === "running";

    const text = typeof result === "string" ? result : result ? JSON.stringify(result, null, 2) : "";
    const lines = text ? text.split("\n").filter(Boolean) : [];

    return (
        <div className="rounded-lg border bg-muted/20 text-xs overflow-hidden" {...(result ? {"data-tool-done": ""} : {})}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
                <SearchIcon className="size-3.5 shrink-0" />
                <span className="truncate flex-1 text-left font-mono">
                    <span className="text-foreground">{args.pattern}</span>
                </span>
                {result && (
                    <span className="text-muted-foreground shrink-0">{lines.length} match{lines.length !== 1 ? "es" : ""}</span>
                )}
                <ToolStatusIcon isRunning={isRunning && !result} open={open} />
            </button>
            {open && result && (
                <pre className="border-t px-3 py-2 whitespace-pre-wrap break-all max-h-60 overflow-y-auto text-muted-foreground">
                    {text}
                </pre>
            )}
        </div>
    );
}

export const SearchContentToolUi = makeAssistantToolUI<SearchContentArgs, SearchContentResult>({
    toolName: "search_content",
    render: (props) => <SearchContentRender {...props} />,
});
