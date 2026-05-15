"use client";

import { ChevronDownIcon } from "lucide-react";

import { type FC, forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {AssistantModalPrimitive, useAuiState} from "@assistant-ui/react";

import { Thread } from "@/components/assistant-ui/thread";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { usePortalContainer } from "@/lib/shadow-root-context";

const MIN_WIDTH = 320;
const MAX_WIDTH = 900;
const STORAGE_KEY = "assistant-widget-width";

export const AssistantModal: FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const container = usePortalContainer();
  const readyRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    readyRef.current = false;
    const readyTimer = setTimeout(() => { readyRef.current = true; }, 800);
    return () => { clearTimeout(readyTimer); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const w = Number(saved);
    if (w < MIN_WIDTH || w > MAX_WIDTH) return;
    const id = requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.style.width = `${w}px`;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;

    const startX = e.clientX;
    const el = contentRef.current;
    if (!el) return;
    const startWidth = el.getBoundingClientRect().width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = startX - ev.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      el.style.width = `${newWidth}px`;
    };

    const onMouseUp = () => {
      draggingRef.current = false;
      if (el) {
        localStorage.setItem(STORAGE_KEY, String(Math.round(el.getBoundingClientRect().width)));
      }
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <AssistantModalPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AssistantModalPrimitive.Anchor className="aui-root aui-modal-anchor fixed right-4 bottom-4">
        <AssistantModalPrimitive.Trigger asChild>
          <AssistantModalButton />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        ref={contentRef}
        sideOffset={16}
        portalProps={{ container }}
        dissmissOnInteractOutside
        onInteractOutside={(e) => {
          if (!readyRef.current || draggingRef.current) {
            e.preventDefault();
          }
        }}
        onAnimationEnd={(e) => {
          if (e.animationName === "enter") {
            const input = (e.currentTarget as HTMLElement).querySelector<HTMLTextAreaElement>(".aui-composer-input");
            input?.focus();
          }
        }}
        className="aui-root aui-modal-content data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=closed]:zoom-out data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-right-1/2 data-[state=open]:zoom-in z-50 h-[var(--widget-height,calc(100vh-6rem))] w-[var(--widget-width,25rem)] overflow-clip overscroll-contain rounded-xl border border-border/50 bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=closed]:animate-out data-[state=open]:animate-in [&>.aui-thread-root]:bg-inherit [&>.aui-thread-root_.aui-thread-viewport-footer]:bg-inherit"
      >
        <div
          className="aui-resize-handle"
          onMouseDown={onResizeStart}
        />
        <Thread />
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

type AssistantModalButtonProps = { "data-state"?: "open" | "closed" };

const AssistantModalButton = forwardRef<
  HTMLButtonElement,
  AssistantModalButtonProps
>(({ "data-state": state, ...rest }, ref) => {
  const isRunning = useAuiState((s) => s.thread.isRunning);

  if (state === "open") {
    return (
      <TooltipIconButton
        variant="default"
        tooltip="Close Assistant"
        side="left"
        {...rest}
        className="aui-modal-button size-11 rounded-full shadow transition-transform hover:scale-110 active:scale-90"
        ref={ref}
      >
        <ChevronDownIcon className="size-6" />
      </TooltipIconButton>
    );
  }

  return (
    <Button
      variant="default"
      size="lg"
      {...rest}
      className="aui-modal-button rounded-full shadow transition-transform hover:scale-110 active:scale-90"
      ref={ref}
    >
      <span className={isRunning ? "shimmer shimmer-invert" : ""}>Shmastra</span>
    </Button>
  );
});

AssistantModalButton.displayName = "AssistantModalButton";
