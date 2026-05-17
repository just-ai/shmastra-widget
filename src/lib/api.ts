import type {UIMessage} from "ai";

let apiBaseUrl = "";
const THREAD_ID_KEY = "shmastra_thread_id";

export interface ThreadData {
    threadId: string;
    messages: UIMessage[];
    models: string[];
    currentModelId: string | null;
}

export function setApiBaseUrl(url: string) {
    apiBaseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getChatUrl(): string {
    return `${apiBaseUrl}/shmastra/api/chat`;
}

export function getFilesUrl(fileName?: string): string {
    const base = `${apiBaseUrl}/shmastra/api/files`;
    return fileName ? `${base}/${fileName}` : base;
}

let threadPromise: Promise<ThreadData> | null = null;

export function getThread(): Promise<ThreadData> {
    const stored = localStorage.getItem(THREAD_ID_KEY);
    const url = stored
        ? `${apiBaseUrl}/shmastra/api/thread/${stored}`
        : `${apiBaseUrl}/shmastra/api/thread`;

    if (!threadPromise) {
        threadPromise = fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to get thread: ${res.status}`);
                return res.json();
            })
            .then(({ thread, messages, models }) => {
                localStorage.setItem(THREAD_ID_KEY, thread.id);
                return {
                    threadId: thread.id,
                    messages: messages ?? [],
                    models: models ?? [],
                    currentModelId: thread.metadata?.modeModelId_build ?? thread.metadata?.currentModelId ?? null,
                };
            })
            .catch(err => {
                threadPromise = null;
                throw err;
            });
    }
    return threadPromise;
}

type ResetListener = (data: ThreadData) => void;
const resetListeners = new Set<ResetListener>();

export function onResetThread(listener: ResetListener): () => void {
    resetListeners.add(listener);
    return () => { resetListeners.delete(listener); };
}

export function resetThread(): Promise<ThreadData> {
    localStorage.removeItem(THREAD_ID_KEY);
    threadPromise = null;
    return getThread().then((data) => {
        resetListeners.forEach((l) => l(data));
        return data;
    });
}

export async function sendAnswer(answer: string): Promise<Response> {
    return fetch(`${apiBaseUrl}/shmastra/api/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
    });
}

export async function sendEnvVars(vars: Record<string, string>): Promise<Response> {
    return fetch(`${apiBaseUrl}/shmastra/api/vars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
    });
}

export interface ToolkitConnection {
    redirectUrl: string;
    toolkit: {
        name: string;
        slug: string;
        logo?: string;
        description?: string;
    };
}

export async function getToolkitConnection(toolkit: string): Promise<ToolkitConnection> {
    const res = await fetch(`${apiBaseUrl}/shmastra/api/connection/${encodeURIComponent(toolkit)}`);
    if (!res.ok) throw new Error(`Failed to get toolkit connection: ${res.status}`);
    return res.json();
}

export async function confirmToolkitConnection(toolkit: string): Promise<Response> {
    return fetch(`${apiBaseUrl}/shmastra/api/connection/${encodeURIComponent(toolkit)}`, {
        method: "POST",
    });
}

export function probeServerVersion(): Promise<string | null> {
    return fetch(`${apiBaseUrl}/shmastra/api/version`, { method: "GET" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => (data && typeof data.version === "string" ? data.version : null))
        .catch(() => null);
}
