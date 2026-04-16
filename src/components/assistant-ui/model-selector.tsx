import { ChevronDownIcon, ClockIcon, SearchIcon } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type FC, type RefCallback } from "react";
import { useModel } from "@/lib/model-context";
import { ShadowRootContext } from "@/lib/shadow-root-context";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const RECENT_MODELS_KEY = "recent-models";
const MAX_RECENT = 3;

function getRecentModels(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_MODELS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
    } catch {
        return [];
    }
}

function addRecentModel(model: string): void {
    const recent = getRecentModels().filter((m) => m !== model);
    recent.unshift(model);
    localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function groupByProvider(models: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const model of models) {
        const slashIdx = model.indexOf("/");
        const provider = slashIdx > 0 ? model.slice(0, slashIdx) : "other";
        const list = groups.get(provider);
        if (list) list.push(model);
        else groups.set(provider, [model]);
    }
    return groups;
}

function formatModelName(model: string): string {
    const idx = model.indexOf("/");
    return idx > 0 ? model.slice(idx + 1) : model;
}

function formatProviderName(provider: string): string {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function eventIsInside(e: Event, container: HTMLElement): boolean {
    const path = e.composedPath();
    return path.includes(container);
}

const TruncatedText: FC<{ text: string; tooltip?: string; maxWidth: string; className?: string }> = ({ text, tooltip, maxWidth, className }) => {
    const span = (
        <span
            className={cn("block overflow-hidden whitespace-nowrap text-ellipsis", className)}
            style={{ maxWidth }}
        >
            {text}
        </span>
    );
    if (!tooltip) return span;
    return (
        <Tooltip>
            <TooltipTrigger asChild>{span}</TooltipTrigger>
            <TooltipContent side="bottom">{tooltip}</TooltipContent>
        </Tooltip>
    );
};

export const ModelSelector: FC = () => {
    const { models, modelId, setModelId } = useModel();
    const shadowRoot = useContext(ShadowRootContext);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [recentModels, setRecentModels] = useState<string[]>(getRecentModels);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const inputRefCallback: RefCallback<HTMLInputElement> = useCallback((node) => {
        inputRef.current = node;
        if (node) {
            requestAnimationFrame(() => {
                node.focus();
            });
        }
    }, []);

    const filtered = useMemo(() => {
        if (!search) return models;
        const q = search.toLowerCase();
        return models.filter((m) => m.toLowerCase().includes(q));
    }, [models, search]);

    const filteredRecent = useMemo(() => {
        const valid = recentModels.filter((m) => models.includes(m));
        if (!search) return valid;
        const q = search.toLowerCase();
        return valid.filter((m) => m.toLowerCase().includes(q));
    }, [recentModels, models, search]);

    const groups = useMemo(() => groupByProvider(filtered), [filtered]);

    const close = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);

    const focusComposerInput = useCallback(() => {
        const root = shadowRoot ?? document;
        const input = root.querySelector<HTMLTextAreaElement>(".aui-composer-input");
        if (input) requestAnimationFrame(() => input.focus());
    }, [shadowRoot]);

    const selectModel = useCallback((model: string) => {
        setModelId(model);
        addRecentModel(model);
        setRecentModels(getRecentModels());
        close();
        focusComposerInput();
    }, [setModelId, close, focusComposerInput]);

    useEffect(() => {
        if (!open) return;
        const eventRoot: EventTarget = shadowRoot ?? document;

        const handlePointerDown = (e: Event) => {
            if (containerRef.current && !eventIsInside(e, containerRef.current)) {
                close();
            }
        };
        const handleFocusIn = (e: Event) => {
            if (containerRef.current && !eventIsInside(e, containerRef.current)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                inputRef.current?.focus();
            }
        };
        eventRoot.addEventListener("pointerdown", handlePointerDown, true);
        eventRoot.addEventListener("focusin", handleFocusIn, true);
        return () => {
            eventRoot.removeEventListener("pointerdown", handlePointerDown, true);
            eventRoot.removeEventListener("focusin", handleFocusIn, true);
        };
    }, [open, close, shadowRoot]);


    if (models.length === 0) return null;

    const entries = Array.from(groups.entries());

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 h-8",
                    "text-xs text-muted-foreground",
                    "hover:bg-muted-foreground/15 transition-colors",
                    "outline-none cursor-pointer",
                )}
                aria-label="Select model"
                onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
            >
                <TruncatedText
                    text={modelId ? formatModelName(modelId) : "Select model"}
                    tooltip={modelId || undefined}
                    maxWidth="6rem"
                />
                <ChevronDownIcon className={cn("size-3 shrink-0 transition-transform duration-200", open && "rotate-180")} />
            </button>
            {open && (
                <div
                    className={cn(
                        "absolute bottom-full left-0 mb-1 z-50 min-w-48 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md",
                        "animate-in fade-in-0 zoom-in-95",
                    )}
                >
                    <div className="flex items-center gap-2 border-b px-2.5 py-1.5">
                        <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                        <input
                            ref={inputRefCallback}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search models..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {entries.length === 0 && (
                            <div className="px-2.5 py-2 text-sm text-muted-foreground">No models found</div>
                        )}
                        {filteredRecent.length > 0 && !search && (
                            <div>
                                <div className="px-2.5 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <ClockIcon className="size-3" />
                                    Recent
                                </div>
                                {filteredRecent.map((model) => (
                                    <button
                                        key={model}
                                        type="button"
                                        className={cn(
                                            "relative w-full cursor-pointer select-none rounded-md px-2.5 py-1.5 pl-4 text-sm text-left truncate outline-none",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            model === modelId && "font-medium",
                                        )}
                                        onClick={() => selectModel(model)}
                                    >
                                        {formatModelName(model)}
                                    </button>
                                ))}
                                {entries.length > 0 && <div className="mx-1 my-1 h-px bg-border" />}
                            </div>
                        )}
                        {entries.map(([provider, providerModels], i) => (
                            <div key={provider}>
                                {i > 0 && <div className="mx-1 my-1 h-px bg-border" />}
                                <div className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    {formatProviderName(provider)}
                                </div>
                                {providerModels.map((model) => (
                                    <button
                                        key={model}
                                        type="button"
                                        className={cn(
                                            "relative w-full cursor-pointer select-none rounded-md px-2.5 py-1.5 pl-4 text-sm text-left truncate outline-none",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            model === modelId && "font-medium",
                                        )}
                                        onClick={() => selectModel(model)}
                                    >
                                        {formatModelName(model)}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
