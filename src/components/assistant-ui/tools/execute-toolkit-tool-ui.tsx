import { makeAssistantToolUI } from "@assistant-ui/react";
import { CheckIcon, LoaderIcon, XIcon } from "lucide-react";

type ExecuteToolkitToolArgs = {
    tool: string;
};

type ExecuteToolkitToolResult = {
    error?: string | null;
    [key: string]: unknown;
};

export const ExecuteToolkitToolUi = makeAssistantToolUI<ExecuteToolkitToolArgs, ExecuteToolkitToolResult>({
    toolName: "execute_toolkit_tool",
    render: ({ args, result }) => {
        const isError = result != null && !!result.error;

        return (
            <div {...(result != null ? { "data-tool-done": "" } : {})} className="flex items-center gap-2 text-xs py-2 text-muted-foreground">
                {!result ? (
                    <>
                        <LoaderIcon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                        <span className="shimmer text-muted-foreground">
                            {args.tool}
                        </span>
                    </>
                ) : isError ? (
                    <>
                        <XIcon className="size-3.5 shrink-0 text-destructive" />
                        <span className="text-destructive">{args.tool}</span>
                    </>
                ) : (
                    <>
                        <CheckIcon className="size-3.5 shrink-0" />
                        <span>{args.tool}</span>
                    </>
                )}
            </div>
        );
    },
});
