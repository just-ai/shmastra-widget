import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { ChevronRightIcon, WrenchIcon } from "lucide-react";
import { useAuiState } from "@assistant-ui/react";

const COLLAPSE_DELAY = 1500;
const ANIM_DURATION = 250;
const ENTER_DURATION = 200;
const ENTER_STAGGER = 80;

/** Selector for elements that should be treated as collapsible (done OR interrupted) */
const COLLAPSIBLE_SELECTOR = "[data-tool-done], [data-tool-interrupted]";

export function CollapsibleTools({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [doneCount, setDoneCount] = useState(0);
    const [collapsed, setCollapsed] = useState(true);
    const collapseTimers = useRef(new Map<HTMLElement, number>());
    const seenElements = useRef(new WeakSet<HTMLElement>());
    const isRunning = useAuiState((s) => s.thread.isRunning);
    const wasRunning = useRef(false);

    const sync = useCallback(() => {
        if (!ref.current) return;
        const els = ref.current.querySelectorAll<HTMLElement>(COLLAPSIBLE_SELECTOR);
        setDoneCount(els.length);
    }, []);

    const hideElement = useCallback((el: HTMLElement) => {
        el.style.transition = `opacity ${ANIM_DURATION}ms ease-out, max-height ${ANIM_DURATION}ms ease-out, margin ${ANIM_DURATION}ms ease-out`;
        el.style.opacity = "0";
        el.style.maxHeight = "0";
        el.style.overflow = "hidden";
        el.style.marginTop = "0";
        el.style.marginBottom = "0";
        setTimeout(() => {
            el.hidden = true;
            el.style.removeProperty("transition");
            el.style.removeProperty("opacity");
            el.style.removeProperty("max-height");
            el.style.removeProperty("overflow");
            el.style.removeProperty("margin-top");
            el.style.removeProperty("margin-bottom");
        }, ANIM_DURATION);
    }, []);

    // When processing stops, mark all non-done, non-text children as interrupted so they collapse.
    // Text parts (MarkdownText) have the "aui-md" class and should be left alone.
    useEffect(() => {
        if (isRunning) {
            wasRunning.current = true;
            return;
        }
        if (!wasRunning.current || !ref.current) return;
        wasRunning.current = false;

        const children = ref.current.children;
        for (let i = 0; i < children.length; i++) {
            const el = children[i] as HTMLElement;
            if (
                !el.hasAttribute("data-tool-done") &&
                !el.hasAttribute("data-tool-interrupted") &&
                !el.hasAttribute("data-tool-persistent") &&
                !el.classList.contains("aui-md")
            ) {
                el.setAttribute("data-tool-interrupted", "");
            }
        }
    }, [isRunning]);

    // Entrance animation for new tool elements (only while running)
    useEffect(() => {
        if (!ref.current || !isRunning) return;
        const container = ref.current;

        const animateNewChildren = (nodes: NodeList) => {
            let staggerIndex = 0;
            nodes.forEach((node) => {
                if (!(node instanceof HTMLElement) || seenElements.current.has(node)) return;
                seenElements.current.add(node);

                const delay = staggerIndex * ENTER_STAGGER;
                node.style.opacity = "0";
                node.style.transform = "translateY(4px)";

                // Double rAF ensures the initial "hidden" state is painted
                // before we apply the transition to the "visible" state
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        node.style.transition = `opacity ${ENTER_DURATION}ms ease-out ${delay}ms, transform ${ENTER_DURATION}ms ease-out ${delay}ms`;
                        node.style.opacity = "1";
                        node.style.transform = "translateY(0)";
                        setTimeout(() => {
                            node.style.removeProperty("opacity");
                            node.style.removeProperty("transform");
                            node.style.removeProperty("transition");
                        }, ENTER_DURATION + delay);
                    });
                });

                staggerIndex++;
            });
        };

        // Animate existing unseen children
        animateNewChildren(container.childNodes);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.addedNodes.length > 0) {
                    animateNewChildren(m.addedNodes);
                }
            });
        });
        observer.observe(container, { childList: true });
        return () => observer.disconnect();
    }, [isRunning]);

    // Auto-collapse newly completed tools with delay + animation (only while running)
    useEffect(() => {
        if (!ref.current || !collapsed || !isRunning) return;
        const doneEls = ref.current.querySelectorAll<HTMLElement>("[data-tool-done]");
        doneEls.forEach((el) => {
            if (el.hidden || collapseTimers.current.has(el)) return;
            const timer = window.setTimeout(() => {
                collapseTimers.current.delete(el);
                if (collapsed) hideElement(el);
            }, COLLAPSE_DELAY);
            collapseTimers.current.set(el, timer);
        });
    }, [doneCount, collapsed, isRunning, hideElement]);

    // On toggle: instantly hide/show (no animation)
    useEffect(() => {
        if (!ref.current) return;
        collapseTimers.current.forEach((timer) => clearTimeout(timer));
        collapseTimers.current.clear();

        const els = ref.current.querySelectorAll<HTMLElement>(COLLAPSIBLE_SELECTOR);
        els.forEach((el) => {
            el.hidden = collapsed;
        });
    }, [collapsed]);

    // When not running and new done/interrupted elements appear: instantly hide them
    useEffect(() => {
        if (!ref.current || isRunning || !collapsed) return;
        const els = ref.current.querySelectorAll<HTMLElement>(COLLAPSIBLE_SELECTOR);
        els.forEach((el) => {
            el.hidden = true;
        });
    }, [doneCount, isRunning, collapsed]);

    useEffect(() => {
        if (!ref.current) return;
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(ref.current, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-tool-done", "data-tool-interrupted"],
        });
        return () => observer.disconnect();
    }, [sync]);

    return (
        <>
            {doneCount > 0 && (
                <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-2"
                >
                    <WrenchIcon className="size-3 shrink-0" />
                    <span>{doneCount} completed tool call{doneCount !== 1 ? "s" : ""}</span>
                    <ChevronRightIcon className={`size-3 shrink-0 transition-transform duration-200 ${!collapsed ? "rotate-90" : ""}`} />
                </button>
            )}
            <div ref={ref} className="space-y-1">
                {children}
            </div>
        </>
    );
}
