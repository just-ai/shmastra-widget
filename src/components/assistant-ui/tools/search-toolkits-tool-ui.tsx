import { makeAssistantToolUI } from "@assistant-ui/react";

type SearchToolkitsArgs = {
    query: string;
};

type SearchToolkitsResult = {
    content: string;
};

export const SearchToolkitsToolUi = makeAssistantToolUI<SearchToolkitsArgs, SearchToolkitsResult>({
    toolName: "search_toolkits",
    render: ({ args, result }) => {
        if (result) return null;

        return (
            <div className="flex items-center text-xs py-2">
                <span className="shimmer text-muted-foreground">
                    Searching toolkits: {args.query}
                </span>
            </div>
        );
    },
});
