import { makeAssistantToolUI } from "@assistant-ui/react";
import { Button } from "@/components/ui/button.tsx";
import { useEffect, useState } from "react";
import { getToolkitConnection, confirmToolkitConnection, type ToolkitConnection } from "@/lib/api.ts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const connectionCache = new Map<string, Promise<ToolkitConnection>>();

function getCachedConnection(toolkit: string): Promise<ToolkitConnection> {
    const existing = connectionCache.get(toolkit);
    if (existing) return existing;
    const promise = getToolkitConnection(toolkit).catch((e) => {
        connectionCache.delete(toolkit);
        throw e;
    });
    connectionCache.set(toolkit, promise);
    return promise;
}

type ConnectToolkitArgs = {
    reason: string;
    toolkit: string;
};

type ConnectToolkitResult = {
    isConnected: boolean;
};

function ReasonText({ text }: { text: string }) {
    return (
        <div className="text-sm leading-relaxed [&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0 [&_ul]:ml-3 [&_ul]:list-disc [&_ol]:ml-3 [&_ol]:list-decimal [&_code]:text-[0.85em] [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted/30 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold">
            <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </div>
    );
}

function ConnectButton({ toolkit, connection }: { toolkit: string; connection: ToolkitConnection }) {
    const [connected, setConnected] = useState(false);

    const handleClick = () => {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            connection.redirectUrl,
            "toolkit_auth",
            `width=${width},height=${height},left=${left},top=${top},popup=yes`,
        );

        if (!popup) return;

        const timer = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(timer);
                    confirmToolkitConnection(toolkit).then(() => setConnected(true));
                }
            } catch {
                // ignore COOP warnings
            }
        }, 500);
    };

    if (connected) return null;

    return (
        <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={handleClick}
        >
            {connection.toolkit.logo && (
                <img
                    src={connection.toolkit.logo}
                    alt=""
                    className="size-5 shrink-0 rounded"
                />
            )}
            <span className="text-sm font-medium">Connect {connection.toolkit.name}</span>
        </Button>
    );
}

function ConnectToolkitRender({ args, result }: { args: ConnectToolkitArgs; result?: ConnectToolkitResult }) {
    const [connection, setConnection] = useState<ToolkitConnection | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!args.toolkit) return;
        let cancelled = false;

        if (result) {
            connectionCache.delete(args.toolkit);
        } else {
            getCachedConnection(args.toolkit)
                .then((conn) => {
                    if (!cancelled) setConnection(conn);
                })
                .catch((e) => {
                    if (!cancelled) {
                        setError(e instanceof Error ? e.message : "Failed to load connection");
                    }
                });
        }

        return () => { cancelled = true; };
    }, [args.toolkit, result]);

    return (
        <div
            data-tool-persistent=""
            className={`flex flex-col rounded-lg border px-4 py-3 mt-1 ${
                result
                    ? result.isConnected
                        ? "border-green-300 dark:border-green-700"
                        : "border-red-300 dark:border-red-700"
                    : ""
            }`}
        >
            <div className={`min-w-0 ${result ? "opacity-40" : ""}`}>
                <ReasonText text={args.reason} />
            </div>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <div className="flex h-12 w-full shrink-0 items-center">
                {result ? (
                    <div className="flex w-full justify-end">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                result.isConnected
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                        >
                            <span
                                className={`size-1.5 rounded-full ${
                                    result.isConnected ? "bg-green-500" : "bg-red-500"
                                }`}
                            />
                            {result.isConnected ? "Connected" : "Not connected"}
                        </span>
                    </div>
                ) : connection ? (
                    <ConnectButton toolkit={args.toolkit} connection={connection} />
                ) : null}
            </div>
        </div>
    );
}

export const ConnectToolkitToolUi = makeAssistantToolUI<ConnectToolkitArgs, ConnectToolkitResult>({
    toolName: "connect_toolkit",
    render: (props) => <ConnectToolkitRender args={props.args} result={props.result} />,
});
