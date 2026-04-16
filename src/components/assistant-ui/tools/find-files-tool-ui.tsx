import { makeAssistantToolUI } from "@assistant-ui/react";
import { SearchIcon } from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import { useState } from "react";

type FindFilesArgs = {
    path: string;
};

type FindFilesResult = string;

function FindFilesRender({ args, result, status }: { args: FindFilesArgs; result?: FindFilesResult; status?: { type: string } }) {
    const [open, setOpen] = useState(false);
    const isRunning = status?.type === "running";

    const lastSlash = args.path?.lastIndexOf("/") ?? -1;
    const dir = lastSlash >= 0 ? args.path.slice(0, lastSlash + 1) : "";
    const name = lastSlash >= 0 ? args.path.slice(lastSlash + 1) : args.path;

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
                <span className="truncate flex-1 text-left" style={{ direction: "rtl", textAlign: "left" }}>
                    <bdi><span className="opacity-50">{dir}</span><span className="text-foreground">{name}</span></bdi>
                </span>
                {result && (
                    <span className="text-muted-foreground shrink-0">{lines.length} file{lines.length !== 1 ? "s" : ""}</span>
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

export const FindFilesToolUi = makeAssistantToolUI<FindFilesArgs, FindFilesResult>({
    toolName: "find_files",
    render: (props) => <FindFilesRender {...props} />,
});
