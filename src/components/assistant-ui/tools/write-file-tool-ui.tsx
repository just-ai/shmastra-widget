import { makeAssistantToolUI } from "@assistant-ui/react";
import { FilePenIcon } from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import { useState } from "react";

type WriteFileArgs = {
    path: string;
    content: string;
    overwrite?: boolean;
};

type WriteFileResult = string;

function WriteFileRender({ args, result, status }: { args: WriteFileArgs; result?: WriteFileResult; status?: { type: string } }) {
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
                <FilePenIcon className="size-3.5 shrink-0" />
                <span className="truncate flex-1 text-left" style={{ direction: "rtl", textAlign: "left" }}>
                    <bdi><span className="opacity-50">{dir}</span><span className="text-foreground">{filename}</span></bdi>
                </span>
                <ToolStatusIcon isRunning={isRunning && !result} open={open} />
            </button>
            {open && args.content && (
                <pre className="border-t px-3 py-2 whitespace-pre-wrap break-all max-h-60 overflow-y-auto text-muted-foreground">
                    {args.content}
                </pre>
            )}
        </div>
    );
}

export const WriteFileToolUi = makeAssistantToolUI<WriteFileArgs, WriteFileResult>({
    toolName: "write_file",
    render: (props) => <WriteFileRender {...props} />,
});
