import { makeAssistantToolUI, useAui, useAuiState } from "@assistant-ui/react";
import { useServerStatus } from "@/lib/server-status-context.tsx";
import { useTasks } from "@/lib/task-context.ts";
import { useEffect, useRef } from "react";
import { CheckIcon, CircleIcon, XIcon } from "lucide-react";

type ApplyChangesArgs = { notify?: boolean };
type ApplyChangesResult = { success: true, version: string } | { success: false; error: string };

function ApplyChangesRender({ args, result }: { args: ApplyChangesArgs; result?: ApplyChangesResult }) {
    const aui = useAui();
    const { waitForServer, restarting } = useServerStatus();
    const isRunning = useAuiState((s) => s.thread.isRunning);
    const { tasks } = useTasks();
    const triggered = useRef(false);
    const notified = useRef(false);
    const wasRestarting = useRef(false);
    // Track if we saw this tool call arrive during a live stream
    const wasLive = useRef(false);
    // If there's an in_progress task, task-write already shows status — suppress our deploying UI
    const hasActiveTasks = tasks.some((t) => t.status === "in_progress");

    useEffect(() => {
        if (!result && isRunning) {
            wasLive.current = true;
        }
    }, [result, isRunning]);

    useEffect(() => {
        if (result?.success && !isRunning && wasLive.current && !triggered.current) {
            triggered.current = true;
            waitForServer(result.version);
        }
    }, [result, isRunning, waitForServer]);

    useEffect(() => {
        if (restarting) {
            wasRestarting.current = true;
            return;
        }
        if (
            wasRestarting.current &&
            triggered.current &&
            !notified.current &&
            args?.notify &&
            result &&
            "success" in result &&
            result.success
        ) {
            notified.current = true;
            aui.thread().append("<continue/>");
        }
    }, [restarting, args?.notify, result, aui]);

    // Determine visual phase
    const isError = result && !result.success;
    const deploying = !result || (result.success && restarting);
    const done = result?.success && !restarting;

    if (isError) {
        return (
            <div className="rounded-lg border bg-muted/20 text-xs overflow-hidden" data-tool-done="">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 text-muted-foreground">
                    <XIcon className="size-3.5 shrink-0 text-destructive" />
                    <span className="text-destructive truncate">Failed to apply changes</span>
                </div>
                {"error" in result && (
                    <pre className="border-t px-3 py-2 whitespace-pre-wrap break-all max-h-60 overflow-y-auto text-muted-foreground">
                        {result.error}
                    </pre>
                )}
            </div>
        );
    }

    if (done) {
        return (
            <div className="flex items-center gap-2 text-xs py-2 text-muted-foreground" data-tool-done="">
                <CheckIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span>Changes applied</span>
            </div>
        );
    }

    // If task-write is already showing an in_progress task, don't duplicate status
    if (!deploying || hasActiveTasks) return null;

    return (
        <div className="flex items-center gap-2 text-xs py-2 text-muted-foreground">
            <CircleIcon className="size-3.5 text-muted-foreground/40 shrink-0" />
            <span className="shimmer text-muted-foreground">
                {restarting ? "Restarting" : "Applying changes"}
            </span>
        </div>
    );
}

export const ApplyChangesToolUi = makeAssistantToolUI<ApplyChangesArgs, ApplyChangesResult>({
    toolName: "apply_changes",
    render: (props) => <ApplyChangesRender {...props} />,
});
