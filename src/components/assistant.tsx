import {AssistantRuntimeProvider, useAui, useAuiState, Suggestions} from "@assistant-ui/react";
import {useChatRuntime, AssistantChatTransport} from "@assistant-ui/react-ai-sdk";
import {useEffect, useRef, useState} from "react";

const INTERACTIVE_TOOLS = ["ask_user", "connect_toolkit"];

function notify(body: string, tag: string) {
    if (Notification.permission !== "granted" || document.hasFocus()) return;
    const n = new Notification("Shmastra", {body, tag});
    n.onclick = () => { window.focus(); n.close(); };
}

function RunEndNotifier({onExpand}: {onExpand: () => void}) {
    const isRunning = useAuiState((s) => s.thread.isRunning);
    const wasRunning = useRef(false);

    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const lastMessageText = useAuiState((s) => {
        const msgs = s.thread.messages;
        const last = msgs[msgs.length - 1];
        if (!last) return "";
        const textPart = [...last.content].reverse().find((p) => p.type === "text");
        return textPart?.type === "text" ? textPart.text : "";
    });

    const pendingToolCall = useAuiState((s) => {
        const msgs = s.thread.messages;
        const last = msgs[msgs.length - 1];
        if (!last) return null;
        const tc = [...last.content].reverse().find(
            (p) => p.type === "tool-call" && INTERACTIVE_TOOLS.includes(p.toolName) && p.result === undefined
        );
        if (!tc || tc.type !== "tool-call") return null;
        try { JSON.parse(tc.argsText); } catch { return null; }
        return tc;
    });
    const prevPendingId = useRef<string | null>(null);

    useEffect(() => {
        if (!pendingToolCall) {
            prevPendingId.current = null;
            return;
        }
        if (pendingToolCall.toolCallId === prevPendingId.current) return;
        const timer = setTimeout(() => {
            prevPendingId.current = pendingToolCall.toolCallId;
            const body = pendingToolCall.toolName === "ask_user"
                ? (pendingToolCall.args as { question?: string }).question?.slice(0, 200) || "Question from assistant"
                : `Connect ${(pendingToolCall.args as { toolkit?: string }).toolkit || "toolkit"}`;
            notify(body, "shmastra-action");
            onExpand();
        }, 1500);
        return () => clearTimeout(timer);
    }, [pendingToolCall]);

    useEffect(() => {
        if (wasRunning.current && !isRunning) {
            notify(lastMessageText.slice(0, 200) || "Response is ready", "shmastra-done");
            onExpand();
        }
        wasRunning.current = isRunning;
    }, [isRunning]);

    return null;
}
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {ViewToolUi} from "@/components/assistant-ui/tools/view-tool-ui.tsx";
import {AskUserToolUi} from "@/components/assistant-ui/tools/ask-user-tool-ui.tsx";
import {ExecuteCommandToolUi} from "@/components/assistant-ui/tools/execute-command-tool-ui.tsx";
import {AskEnvVarsToolUi} from "@/components/assistant-ui/tools/ask-env-vars-tool-ui.tsx";
import {TaskWriteToolUi} from "@/components/assistant-ui/tools/task-write-tool-ui.tsx";
import {TaskCheckToolUi} from "@/components/assistant-ui/tools/task-check-tool-ui.tsx";
import {FindFilesToolUi} from "@/components/assistant-ui/tools/find-files-tool-ui.tsx";
import {ApplyChangesToolUi} from "@/components/assistant-ui/tools/apply-changes-tool-ui.tsx";
import {WriteFileToolUi} from "@/components/assistant-ui/tools/write-file-tool-ui.tsx";
import {StringReplaceToolUi} from "@/components/assistant-ui/tools/string-replace-tool-ui.tsx";
import {SkillToolUi, SkillReadToolUi} from "@/components/assistant-ui/tools/skill-tool-ui.tsx";
import {DeleteFileToolUi} from "@/components/assistant-ui/tools/delete-file-tool-ui.tsx";
import {SearchContentToolUi} from "@/components/assistant-ui/tools/search-content-tool-ui.tsx";
import {ConnectToolkitToolUi} from "@/components/assistant-ui/tools/connect-toolkit-tool-ui.tsx";
import {SearchToolkitsToolUi} from "@/components/assistant-ui/tools/search-toolkits-tool-ui.tsx";
import {SearchMcpServerToolUi} from "@/components/assistant-ui/tools/search-mcp-server-tool-ui.tsx";
import {HiddenToolUi} from "@/components/assistant-ui/tools/hidden-tool-ui.tsx";
import {SubagentToolUi} from "@/components/assistant-ui/tools/subagent-tool-ui.tsx";
import {ExecuteToolkitToolUi} from "@/components/assistant-ui/tools/execute-toolkit-tool-ui.tsx";
import {TaskProvider} from "@/lib/task-context.tsx";
import {ServerStatusProvider} from "@/lib/server-status-context.tsx";
import {getChatUrl, getThread, type ThreadData} from "@/lib/api";
import {fileAttachmentAdapter} from "@/lib/file-attachment-adapter";
import {WebSpeechDictationAdapter} from "@assistant-ui/core";
import {ModelProvider, useModel} from "@/lib/model-context";
import {AssistantModal} from "@/components/assistant-ui/assistant-modal.tsx";
import {ThreadResetter} from "@/components/thread-resetter.tsx";
import {ThemeWrapper} from "@/components/theme-wrapper.tsx";

function AssistantChat({threadData, setThreadData}: {
    threadData: ThreadData;
    setThreadData: (data: ThreadData) => void;
}) {
    const {modelId} = useModel();
    const [modalOpen, setModalOpen] = useState(false);
    const runtime = useChatRuntime({
        messages: threadData.messages,
        transport: new AssistantChatTransport({
            api: getChatUrl(),
            body: {
                modelId,
                threadId: threadData.threadId,
                path: window.location.pathname,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        }),
        adapters: {
            attachments: fileAttachmentAdapter,
            dictation: new WebSpeechDictationAdapter(),
        },
    });
    const aui = useAui({
        suggestions: Suggestions([
            "Create new agent",
            "Create new workflow",
            "Create app for this workflow",
            "How many tokens did this agent spend?",
            "Fix errors in this conversation"
        ])
    });

    useEffect(() => {
        setTimeout(() => setModalOpen(true), 300);
    }, []);

    return (
        <AssistantRuntimeProvider runtime={runtime} aui={aui}>
            <RunEndNotifier onExpand={() => setModalOpen(true)}/>
            <ThreadResetter onThreadData={setThreadData}/>
            <ServerStatusProvider>
            <TaskProvider>
                <TooltipProvider>
                    <div className="h-full">
                        <AssistantModal open={modalOpen} onOpenChange={setModalOpen}/>
                        <ViewToolUi/>
                        <AskUserToolUi/>
                        <ExecuteCommandToolUi/>
                        <AskEnvVarsToolUi/>
                        <TaskWriteToolUi/>
                        <TaskCheckToolUi/>
                        <FindFilesToolUi/>
                        <ApplyChangesToolUi/>
                        <WriteFileToolUi/>
                        <StringReplaceToolUi/>
                        <SkillToolUi/>
                        <SkillReadToolUi/>
                        <DeleteFileToolUi/>
                        <SearchContentToolUi/>
                        <ConnectToolkitToolUi/>
                        <SearchToolkitsToolUi/>
                        <SearchMcpServerToolUi/>
                        <SubagentToolUi/>
                        <ExecuteToolkitToolUi/>
                        <HiddenToolUi tool="get_toolkit_tool_schema"/>
                        <HiddenToolUi tool="recall"/>
                    </div>
                </TooltipProvider>
            </TaskProvider>
            </ServerStatusProvider>
        </AssistantRuntimeProvider>
    );
}

export function Assistant() {
    const [threadData, setThreadData] = useState<ThreadData | null>(null);

    useEffect(() => {
        getThread().then(setThreadData);
    }, []);

    if (!threadData) return null;

    return (
        <ThemeWrapper>
            <ModelProvider models={threadData.models} initialModelId={threadData.currentModelId}>
                <AssistantChat threadData={threadData} setThreadData={setThreadData}/>
            </ModelProvider>
        </ThemeWrapper>
    );
}
