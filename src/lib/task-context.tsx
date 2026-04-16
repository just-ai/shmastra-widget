import { useCallback, useState, type ReactNode } from "react";
import { TaskContext, type Task } from "@/lib/task-context.ts";

export function TaskProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [owners] = useState(() => new Map<string, string>());

    const updateTasks = useCallback((newTasks: Task[]) => {
        setTasks(newTasks);
    }, []);

    const claim = useCallback((content: string, instanceId: string) => {
        const existing = owners.get(content);
        if (!existing || existing === instanceId) {
            owners.set(content, instanceId);
            return true;
        }
        return false;
    }, [owners]);

    const getOwner = useCallback((content: string) => {
        return owners.get(content);
    }, [owners]);

    const getTaskStatus = useCallback((content: string) => {
        return tasks.find((t) => t.content === content)?.status;
    }, [tasks]);

    return (
        <TaskContext.Provider value={{ tasks, updateTasks, claim, getOwner, getTaskStatus }}>
            {children}
        </TaskContext.Provider>
    );
}
