import { makeAssistantToolUI } from "@assistant-ui/react";
import { Button } from "@/components/ui/button.tsx";
import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { sendAnswer } from "@/lib/api.ts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AskUserArgs = {
    question: string;
    options?: { label: string; description?: string }[];
};

type AskUserResult = {
    content: string;
};

function QuestionText({ text }: { text: string }) {
    return (
        <div className="text-sm leading-relaxed [&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0 [&_ul]:ml-3 [&_ul]:list-disc [&_ol]:ml-3 [&_ol]:list-decimal [&_code]:text-[0.85em] [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted/30 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold">
            <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </div>
    );
}

export const AskUserToolUi = makeAssistantToolUI<AskUserArgs, AskUserResult>({
    toolName: "ask_user",
    render: ({ args, result }) => {
        if (result) {
            const answer = typeof result.content === "string"
                ? result.content.replace(/^User answered:\s*/i, "")
                : result.content;
            return (
                <div data-tool-persistent="" className="rounded-lg border bg-muted/30 px-4 py-3 mt-1">
                    <div className="text-muted-foreground">
                        <QuestionText text={args.question} />
                    </div>
                    <div className="mt-2 inline-block rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium">
                        {answer}
                    </div>
                </div>
            );
        }

        const hasOptions = args.options && args.options.length > 0;

        if (hasOptions) {
            return (
                <div data-tool-persistent="" className="rounded-lg border px-4 py-3 mt-1">
                    <div className="mb-3">
                        <QuestionText text={args.question} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {args.options!.map((option) => (
                            <OptionButton key={option.label} option={option} />
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div data-tool-persistent="" className="rounded-lg border px-4 py-3 mt-1">
                <div className="mb-3">
                    <QuestionText text={args.question} />
                </div>
                <TextInput />
            </div>
        );
    },
});

function OptionButton({ option }: { option: { label: string; description?: string } }) {
    const [sending, setSending] = useState(false);

    const handleClick = async () => {
        setSending(true);
        try {
            await sendAnswer(option.label);
        } finally {
            setSending(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            title={option.description}
            disabled={sending}
            onClick={handleClick}
        >
            {option.label}
        </Button>
    );
}

function TextInput() {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await sendAnswer(text);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex gap-2">
            <textarea
                className="flex-1 min-h-[2.5rem] max-h-32 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                placeholder="Type your answer..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                rows={1}
            />
            <Button
                size="icon"
                className="size-9 shrink-0 rounded-full"
                disabled={!text.trim() || sending}
                onClick={handleSend}
            >
                <ArrowUpIcon className="size-4" />
            </Button>
        </div>
    );
}
