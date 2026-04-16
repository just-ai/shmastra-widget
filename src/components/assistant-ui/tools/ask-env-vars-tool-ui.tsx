import {makeAssistantToolUI, useAui} from "@assistant-ui/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button.tsx";
import { useState } from "react";
import { sendEnvVars } from "@/lib/api.ts";

type EnvVar = {
    name: string;
    type: "text" | "password";
    required: boolean;
};

type AskEnvVarsArgs = {
    description: string;
    vars: EnvVar[];
};

type AskEnvVarsResult = string;

export const AskEnvVarsToolUi = makeAssistantToolUI<AskEnvVarsArgs, AskEnvVarsResult>({
    toolName: "ask_env_vars_safely",
    render: ({ args, result }) => {
        return (
            <div className="rounded-lg border px-4 py-3">
                <div className="text-sm mb-4 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{args.description}</Markdown>
                </div>
                { !result && args.vars && <EnvVarsForm vars={args.vars} /> }
            </div>
        );
    },
});

function EnvVarsForm({ vars }: { vars: EnvVar[] }) {
    const aui = useAui();
    const [values, setValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(vars.map((v) => [v.name, ""]))
    );
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cancelled, setCancelled] = useState(false);

    const setValue = (name: string, value: string) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const isValid = vars
        .filter((v) => v.required)
        .every((v) => values[v.name]?.trim());

    const handleSave = async () => {
        if (!isValid || sending) return;
        setSending(true);
        setError(null);
        try {
            await sendEnvVars(values);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save variables");
        } finally {
            setSending(false);
        }
    };

    const handleCancel = () => {
        setCancelled(true);
        aui.thread().cancelRun();
    };

    if (cancelled) return null;

    return (
        <div className="flex flex-col gap-3">
            {vars.map((v) => (
                <div key={v.name} className="flex flex-col gap-1">
                    <label className="text-sm font-medium">
                        {v.name}
                        {v.required && <span className="text-destructive ml-0.5">*</span>}
                    </label>
                    <input
                        type={v.type}
                        value={values[v.name] ?? ""}
                        onChange={(e) => setValue(v.name, e.target.value)}
                        placeholder={v.name}
                        required={v.required}
                        className="rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    />
                </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 mt-1">
                <Button
                    size="sm"
                    disabled={!isValid || sending}
                    onClick={handleSave}
                >
                    Save
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={sending}
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
