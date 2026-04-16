import { makeAssistantToolUI } from "@assistant-ui/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileTextIcon } from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import { useState } from "react";

type ViewArgs = { path: string };
type ViewResult = string;

function ViewRender({ args, result, status }: { args: ViewArgs; result?: ViewResult; status?: { type: string } }) {
    const [open, setOpen] = useState(false);
    if (!result && status?.type !== "running") return null;

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
                <FileTextIcon className="size-3.5 shrink-0" />
                <span className="truncate flex-1 text-left" style={{ direction: "rtl", textAlign: "left" }}>
                    <bdi><span className="opacity-50">{dir}</span><span className="text-foreground">{filename}</span></bdi>
                </span>
                <ToolStatusIcon isRunning={isRunning} open={open} />
            </button>
            {open && result && (
                <div className="border-t px-3 py-2 max-h-60 overflow-y-auto text-muted-foreground leading-relaxed [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:text-xs [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-medium [&_p]:my-1 [&_ul]:ml-3 [&_ul]:list-disc [&_ol]:ml-3 [&_ol]:list-decimal [&_code]:text-[0.85em] [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted/30 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-primary [&_a]:underline">
                    <Markdown remarkPlugins={[remarkGfm]}>
                        {result}
                    </Markdown>
                </div>
            )}
        </div>
    );
}

export const ViewToolUi = makeAssistantToolUI<ViewArgs, ViewResult>({
    toolName: "view",
    render: (props) => <ViewRender {...props} />,
});
