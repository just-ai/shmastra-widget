import { makeAssistantToolUI } from "@assistant-ui/react";
import { CheckIcon, ClipboardCheckIcon, LoaderIcon, AlertCircleIcon, CircleIcon } from "lucide-react";
import { ToolStatusIcon } from "@/components/assistant-ui/tools/tool-status-icon.tsx";
import { useState } from "react";
import { useTasks, type Task } from "@/lib/task-context.ts";

type TaskCheckArgs = Record<string, never>;

type TaskCheckResult = {
    content: string;
    isError: boolean;
};

function splitContent(content: string) {
    const match = content.match(/^(Task Status:\s*\[\d+\/\d+\s+completed])\s*[-–—]?\s*(.*)/s);
    if (!match) return { title: content, details: [] };
    const rest = match[2].split(/\s*[-–—]\s*/).map((s) => s.trim()).filter(Boolean);
    return { title: match[1], details: rest };
}

const statusIcon: Record<Task["status"], React.ReactNode> = {
    completed: <CheckIcon className="size-3.5 text-muted-foreground shrink-0" />,
    in_progress: <CircleIcon className="size-3.5 text-muted-foreground/40 shrink-0" />,
    pending: <CircleIcon className="size-3.5 text-muted-foreground/40 shrink-0" />,
};

function TaskCheckRender({ result }: { result?: TaskCheckResult }) {
    const [open, setOpen] = useState(false);
    const { tasks } = useTasks();

    if (!result) {
        return (
            <div className="rounded-lg border bg-muted/20 text-xs overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 text-muted-foreground">
                    <LoaderIcon className="size-3.5 shrink-0 animate-spin text-blue-500" />
                    <span className="animate-pulse">Checking tasks…</span>
                </div>
            </div>
        );
    }

    if (!result.content) return null;

    const { title } = splitContent(result.content);
    const hasTasks = tasks.length > 0;

    return (
        <div className="rounded-lg border bg-muted/20 text-xs overflow-hidden" data-tool-done="">
            <button
                type="button"
                onClick={() => hasTasks && setOpen(!open)}
                className={`flex w-full items-center gap-2 px-3 py-2 bg-muted/30 text-muted-foreground transition-colors ${hasTasks ? "hover:bg-muted/50 cursor-pointer" : ""}`}
            >
                {result.isError
                    ? <AlertCircleIcon className="size-3.5 shrink-0 text-destructive" />
                    : <ClipboardCheckIcon className="size-3.5 shrink-0 text-green-500" />
                }
                <span className={`flex-1 text-left ${result.isError ? "text-destructive" : "text-foreground"}`}>
                    {title}
                </span>
                {hasTasks && (
                    <ToolStatusIcon isRunning={false} isError={result.isError} open={open} />
                )}
            </button>
            {open && hasTasks && (
                <div className="border-t px-3 py-2 flex flex-col gap-1">
                    {tasks.map((task, i) => (
                        <div key={i} className="flex items-start gap-2">
                            {statusIcon[task.status]}
                            <span className={
                                task.status === "completed"
                                    ? "text-muted-foreground"
                                    : task.status === "in_progress"
                                      ? "shimmer text-muted-foreground"
                                      : "text-muted-foreground/60"
                            }>
                                {task.content}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export const TaskCheckToolUi = makeAssistantToolUI<TaskCheckArgs, TaskCheckResult>({
    toolName: "task_check",
    render: (props) => <TaskCheckRender result={props.result} />,
});
