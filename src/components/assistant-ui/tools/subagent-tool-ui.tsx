import { makeAssistantToolUI } from "@assistant-ui/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SubagentArgs = {
    agentType: string;
    task: string;
};

type SubagentResult = {
    content: string;
    isError: boolean;
};

function parseSubagentMeta(content: string | undefined | null) {
    if (typeof content !== "string") return { text: "", meta: null };
    const metaMatch = content.match(/<subagent-meta\s+([^>]*)>/);
    if (!metaMatch) return { text: content, meta: null };

    const text = content.replace(/<subagent-meta[^>]*>/, "").trim();
    const attrs = metaMatch[1];
    const modelId = attrs.match(/modelId="([^"]*)"/)?.[1];
    const durationMs = attrs.match(/durationMs="([^"]*)"/)?.[1];
    const tools = attrs.match(/tools="([^"]*)"/)?.[1];

    return {
        text,
        meta: { modelId, durationMs: durationMs ? Number(durationMs) : undefined, tools },
    };
}

export const SubagentToolUi = makeAssistantToolUI<SubagentArgs, SubagentResult>({
    toolName: "subagent",
    render: ({ args, result }) => {
        if (!result) {
            return (
                <div className="flex flex-col gap-1.5 text-xs py-2 min-w-0">
                    <span className="shimmer text-muted-foreground">
                        Asking {args.agentType}
                    </span>
                    {args.task && (
                        <div className="rounded-lg bg-muted/60 px-3 py-1.5 text-[10px] text-muted-foreground break-words">
                            {args.task}
                        </div>
                    )}
                </div>
            );
        }

        const { text, meta } = parseSubagentMeta(result.content);

        return (
            <div data-tool-done="" className="text-xs py-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="font-medium text-foreground">{args.agentType}</span>
                    {meta?.durationMs != null && (
                        <span className="text-[10px]">
                            {meta.durationMs >= 1000
                                ? `${(meta.durationMs / 1000).toFixed(1)}s`
                                : `${meta.durationMs}ms`}
                        </span>
                    )}
                    {meta?.modelId && (
                        <span className="text-[10px]">{meta.modelId}</span>
                    )}
                </div>
                {args.task && (
                    <div className="rounded-lg bg-muted/60 px-3 py-1.5 text-[10px] text-muted-foreground break-words">
                        {args.task}
                    </div>
                )}
                {text && (
                    <div className={`rounded-lg bg-muted/40 px-3 py-2 text-[10px] max-h-40 overflow-y-auto leading-relaxed [&_h1]:text-xs [&_h1]:font-semibold [&_h2]:text-[11px] [&_h2]:font-semibold [&_h3]:text-[10px] [&_h3]:font-medium [&_p]:my-0.5 [&_ul]:ml-3 [&_ul]:list-disc [&_ol]:ml-3 [&_ol]:list-decimal [&_code]:text-[0.85em] [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted/30 [&_pre]:p-1.5 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_th]:text-left [&_th]:border-b [&_th]:px-1.5 [&_th]:py-0.5 [&_td]:border-b [&_td]:px-1.5 [&_td]:py-0.5 ${result.isError ? "text-destructive" : "text-muted-foreground"}`}>
                        <Markdown remarkPlugins={[remarkGfm]}>
                            {text}
                        </Markdown>
                    </div>
                )}
            </div>
        );
    },
});
