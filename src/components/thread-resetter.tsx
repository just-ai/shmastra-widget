import {useAui} from "@assistant-ui/react";
import {useEffect} from "react";
import {onResetThread, type ThreadData} from "@/lib/api";

export function ThreadResetter({onThreadData}: {onThreadData: (data: ThreadData) => void}) {
    const runtime = useAui();
    useEffect(() => {
        return onResetThread((data) => {
            onThreadData(data);
            runtime.thread().reset();
        });
    }, [runtime, onThreadData]);
    return null;
}
