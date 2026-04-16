import { useAssistantToolUI } from "@assistant-ui/react";
import { useMemo } from "react";

const nullRender = () => null;

export function HiddenToolUi({ tool }: { tool: string }) {
    const toolDef = useMemo(() => ({ toolName: tool, render: nullRender }), [tool]);
    useAssistantToolUI(toolDef);
    return null;
}
