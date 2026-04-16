import { makeAssistantToolUI } from "@assistant-ui/react";
import { TerminalIcon } from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import { useState } from "react";

type ExecuteCommandArgs = {
    command: string;
    cwd?: string;
};

type ExecuteCommandResult = string;

function ExecuteCommandRender({ args, result, status }: { args: ExecuteCommandArgs; result?: ExecuteCommandResult; status?: { type: string } }) {
    const [open, setOpen] = useState(false);
    const isRunning = status?.type === "running";

    const spaceIdx = args.command?.indexOf(" ") ?? -1;
    const cmd = spaceIdx >= 0 ? args.command.slice(0, spaceIdx) : args.command;
    const cmdArgs = spaceIdx >= 0 ? args.command.slice(spaceIdx + 1) : null;

    const MAX = 40;
    const TAIL = 16;
    const truncatedArgs = cmdArgs && cmdArgs.length > MAX
        ? cmdArgs.slice(0, MAX - TAIL - 3) + "..." + cmdArgs.slice(-TAIL)
        : cmdArgs;

    return (
        <div className="rounded-lg border bg-muted/20 text-xs font-mono overflow-hidden" {...(result ? {"data-tool-done": ""} : {})}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
                <TerminalIcon className="size-3.5 shrink-0" />
                <span className="truncate flex-1 text-left">
                    <span className="text-foreground">{cmd}</span>
                    {truncatedArgs && <span className="opacity-50"> {truncatedArgs}</span>}
                </span>
                <ToolStatusIcon isRunning={isRunning && !result} open={open} />
            </button>
            {open && result && (
                <pre className="px-3 py-2 whitespace-pre-wrap break-all max-h-60 overflow-y-auto border-t text-muted-foreground">
                    {result}
                </pre>
            )}
        </div>
    );
}

export const ExecuteCommandToolUi = makeAssistantToolUI<ExecuteCommandArgs, ExecuteCommandResult>({
    toolName: "execute_command",
    render: (props) => <ExecuteCommandRender {...props} />,
});
