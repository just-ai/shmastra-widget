import { makeAssistantToolUI, useAuiState } from "@assistant-ui/react";
import { CheckIcon, CircleIcon } from "lucide-react";
import { useEffect, useId } from "react";
import { useTasks, type Task } from "@/lib/task-context.ts";

type TaskWriteArgs = {
    tasks: Task[];
};

type TaskWriteResult = {
    content: string;
    isError: boolean;
};

function TaskWriteRender({ args }: { args: TaskWriteArgs; result?: TaskWriteResult }) {
    const instanceId = useId();
    const { updateTasks, claim, getOwner, getTaskStatus } = useTasks();
    const isRunning = useAuiState((s) => s.thread.isRunning);

    // Sync tasks into shared context
    useEffect(() => {
        if (args.tasks) {
            updateTasks(args.tasks);
        }
    }, [args.tasks, updateTasks]);

    if (!args.tasks?.length) return null;
    if (args.tasks.every((t) => !t.content || !t.activeForm)) return null;

    // Find the task this instance should display:
    // The first in_progress or newly-added task that isn't claimed by another instance
    const displayTask = args.tasks.find((t) => {
        if (t.status === "completed") return false;
        const owner = getOwner(t.content);
        return !owner || owner === instanceId;
    });

    // Claim it
    if (displayTask) {
        claim(displayTask.content, instanceId);
    }

    // If no unclaimed active task, this instance has nothing to show
    // (another instance already owns it)
    if (!displayTask) return null;

    // Read live status from context (may have been updated by a later tool call)
    const liveStatus = getTaskStatus(displayTask.content) ?? displayTask.status;

    // Hide non-completed tasks when not processing
    if (!isRunning && liveStatus !== "completed") return null;

    const completed = args.tasks.filter((t) => t.status === "completed").length;
    const total = args.tasks.length;

    const icon = liveStatus === "completed"
        ? <CheckIcon className="size-3.5 text-muted-foreground shrink-0" />
        : <CircleIcon className="size-3.5 text-muted-foreground/40 shrink-0" />;

    const text = liveStatus === "completed"
        ? displayTask.content
        : displayTask.activeForm;

    return (
        <div className="flex items-center gap-2 text-xs py-2 text-muted-foreground" {...(liveStatus === "completed" ? {"data-tool-done": ""} : {})}>
            {icon}
            <span
                className={liveStatus === "in_progress"
                    ? "shimmer text-muted-foreground"
                    : ""}
            >
                {text}
            </span>
            <span className="opacity-40 ml-auto shrink-0">{completed + 1}/{total}</span>
        </div>
    );
}

export const TaskWriteToolUi = makeAssistantToolUI<TaskWriteArgs, TaskWriteResult>({
    toolName: "task_write",
    render: (props) => <TaskWriteRender args={props.args} result={props.result} />,
});
