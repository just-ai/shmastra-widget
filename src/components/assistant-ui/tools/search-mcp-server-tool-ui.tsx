import { makeAssistantToolUI } from "@assistant-ui/react";

type SearchMcpServerArgs = {
    keywords: string[];
};

type SearchMcpServerResult = {
    content: string;
};

export const SearchMcpServerToolUi = makeAssistantToolUI<SearchMcpServerArgs, SearchMcpServerResult>({
    toolName: "search_mcp_servers",
    render: ({ args, result }) => {
        if (result) return null;

        return (
            <div className="flex items-center text-xs py-2">
                <span className="shimmer text-muted-foreground">
                    Searching MCP servers: {args.keywords?.join(", ")}
                </span>
            </div>
        );
    },
});
