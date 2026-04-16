import { makeAssistantToolUI } from "@assistant-ui/react";
import { BookOpenIcon, LoaderIcon } from "lucide-react";

type SkillArgs = { name: string };
type SkillResult = string;

export const SkillToolUi = makeAssistantToolUI<SkillArgs, SkillResult>({
    toolName: "skill",
    render: ({ args, result }) => {
        if (!result) {
            return (
                <div className="flex items-center gap-2 text-xs py-1 text-muted-foreground">
                    <LoaderIcon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                    <span className="animate-pulse">Learning <span className="text-foreground">{args.name}</span>…</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 text-xs py-2 text-muted-foreground" data-tool-done="">
                <BookOpenIcon className="size-3.5 shrink-0" />
                <span>Learned <span className="text-foreground">{args.name}</span></span>
            </div>
        );
    },
});

type SkillReadArgs = { skillName: string; path: string };
type SkillReadResult = string;

export const SkillReadToolUi = makeAssistantToolUI<SkillReadArgs, SkillReadResult>({
    toolName: "skill_read",
    render: ({ args, result }) => {
        const filename = args.path?.split("/").pop() ?? args.path;

        if (!result) {
            return (
                <div className="flex items-center gap-2 text-xs py-1 text-muted-foreground">
                    <LoaderIcon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                    <span className="animate-pulse">Reading <span className="text-foreground">{args.skillName}</span> / {filename}…</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 text-xs py-2 text-muted-foreground" data-tool-done="">
                <BookOpenIcon className="size-3.5 shrink-0" />
                <span>Read <span className="text-foreground">{args.skillName}</span> / {filename}</span>
            </div>
        );
    },
});
