import { makeAssistantToolUI } from "@assistant-ui/react";
import { CodeIcon } from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import { useState } from "react";

type StringReplaceArgs = {
    path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
};

type StringReplaceResult = string;

function StringReplaceRender({ args, result, status }: { args: StringReplaceArgs; result?: StringReplaceResult; status?: { type: string } }) {
    const [open, setOpen] = useState(false);
    if (!args.path && status?.type !== "running") return null;

    const isRunning = status?.type === "running";
    const lastSlash = args.path?.lastIndexOf("/") ?? -1;
    const dir = lastSlash >= 0 ? args.path.slice(0, lastSlash + 1) : "";
    const filename = lastSlash >= 0 ? args.path.slice(lastSlash + 1) : args.path;

    return (
        <div className="rounded-lg border bg-muted/20 text-xs overflow-hidden" {...(result ? {"data-tool-done": ""} : {})}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
                <CodeIcon className="size-3.5 shrink-0" />
                <span className="truncate flex-1 text-left" style={{ direction: "rtl", textAlign: "left" }}>
                    <bdi><span className="opacity-50">{dir}</span><span className="text-foreground">{filename}</span></bdi>
                </span>
                <ToolStatusIcon isRunning={isRunning && !result} open={open} />
            </button>
            {open && (args.old_string || args.new_string) && (
                <div className="border-t max-h-60 overflow-y-auto">
                    {args.old_string && (
                        <pre className="px-3 py-2 whitespace-pre-wrap break-all text-red-400/70 bg-red-500/5">
                            {args.old_string}
                        </pre>
                    )}
                    {args.new_string && (
                        <pre className="px-3 py-2 whitespace-pre-wrap break-all text-green-400/70 bg-green-500/5 border-t border-dashed">
                            {args.new_string}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

export const StringReplaceToolUi = makeAssistantToolUI<StringReplaceArgs, StringReplaceResult>({
    toolName: "string_replace_lsp",
    render: (props) => <StringReplaceRender {...props} />,
});
