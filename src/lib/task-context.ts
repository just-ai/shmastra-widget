import { createContext, useContext } from "react";

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
    content: string;
    status: TaskStatus;
    activeForm: string;
}

export interface TaskContextValue {
    tasks: Task[];
    updateTasks: (tasks: Task[]) => void;
    claim: (content: string, instanceId: string) => boolean;
    getOwner: (content: string) => string | undefined;
    getTaskStatus: (content: string) => TaskStatus | undefined;
}

export const TaskContext = createContext<TaskContextValue>({
    tasks: [],
    updateTasks: () => {},
    claim: () => false,
    getOwner: () => undefined,
    getTaskStatus: () => undefined,
});

export function useTasks() {
    return useContext(TaskContext);
}
