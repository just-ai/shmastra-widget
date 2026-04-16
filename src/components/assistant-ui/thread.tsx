import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tools/tool-fallback.tsx";
import { CollapsibleTools } from "@/components/assistant-ui/tools/collapsible-tools.tsx";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  useAuiState,
  SuggestionPrimitive,
  ThreadPrimitive, useThreadViewportStore,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  LoaderIcon,
  AudioLinesIcon,
  RotateCcwIcon,
  SquareIcon,
} from "lucide-react";
import {type FC, useCallback, useContext, useEffect, useRef, useState} from "react";
import { ModelSelector } from "@/components/assistant-ui/model-selector";
import { resetThread } from "@/lib/api";
import { ShadowRootContext } from "@/lib/shadow-root-context";
import { useServerStatus } from "@/lib/server-status-context.tsx";

export const Thread: FC = () => {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const threadViewportStore = useThreadViewportStore();

  useEffect(() => {
    setTimeout(() => {
      threadViewportStore.getState().scrollToBottom();
    }, 100);
  }, [threadViewportStore]);

  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "100%",
      }}
    >
      <ThreadPrimitive.Viewport
        autoScroll={isRunning}
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col items-start justify-center px-4">
      <h1 className="aui-thread-welcome-title fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-xl">
        <span className="shimmer text-foreground/60">Shmastra</span>
      </h1>
      <div className="mt-3 flex flex-col items-start gap-1">
        <ThreadPrimitive.Suggestions
          components={{
            Suggestion: ThreadSuggestionItem,
          }}
        />
        <a href="https://github.com/just-ai/shmastra" target="_blank"
           className="text-sm font-light tracking-wide text-muted-foreground/70 underline decoration-dotted underline-offset-4 decoration-muted-foreground/30 transition-colors hover:text-foreground hover:decoration-foreground/40"
        >
          Learn more
        </a>
      </div>
    </div>
  );
};

const ThreadSuggestionItem: FC = () => {
  return (
    <SuggestionPrimitive.Trigger send asChild>
      <button className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-sm font-light tracking-wide text-muted-foreground/70 transition-colors hover:text-foreground cursor-pointer">
        <SuggestionPrimitive.Title />
      </button>
    </SuggestionPrimitive.Trigger>
  );
};

const Composer: FC = () => {
  const { restarting } = useServerStatus();
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone className={cn(
        "aui-composer-attachment-dropzone flex w-full flex-col rounded-2xl border bg-background px-1 pt-2 outline-none transition-shadow",
        restarting
          ? "aui-composer-restarting border-transparent"
          : "border-input has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50",
      )}>
        <ComposerAttachments />
        <ComposerPrimitive.Input
          placeholder="Send me a message"
          submitOnEnter={!restarting}
          className="aui-composer-input mb-1 max-h-32 min-h-14 w-full resize-none bg-transparent px-4 pt-2 pb-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <ComposerAction />
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

function eventIsInside(e: Event, container: HTMLElement): boolean {
  return e.composedPath().includes(container);
}

const ResetThreadButton: FC = () => {
  const [open, setOpen] = useState(false);
  const shadowRoot = useContext(ShadowRootContext);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const handleReset = useCallback(() => {
    close();
    resetThread();
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const eventRoot: EventTarget = shadowRoot ?? document;
    const handlePointerDown = (e: Event) => {
      if (containerRef.current && !eventIsInside(e, containerRef.current)) {
        close();
      }
    };
    eventRoot.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      eventRoot.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [open, close, shadowRoot]);

  return (
    <div ref={containerRef} className="relative">
      <TooltipIconButton
        tooltip="New Session"
        className="size-8 text-muted-foreground"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <RotateCcwIcon className="size-3.5" />
      </TooltipIconButton>
      {open && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 w-56 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          <div className="p-3 space-y-2">
            <p className="text-sm font-medium">Start new session?</p>
            <p className="text-xs text-muted-foreground">
              Current conversation will be lost
            </p>
            <div className="flex justify-end pt-1">
              <Button variant="destructive" size="sm" className="h-7 text-xs px-2.5" onClick={handleReset}>
                Yes, start new session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ComposerAction: FC = () => {
  const { restarting } = useServerStatus();
  return (
    <div className="aui-composer-action-wrapper relative mx-2 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <ComposerAddAttachment />
        <ModelSelector />
        <ResetThreadButton />
      </div>
      <AuiIf condition={(s) => !s.thread.isRunning && s.composer.dictation != null}>
        <ComposerPrimitive.StopDictation asChild>
          <TooltipIconButton
            tooltip="Stop dictation"
            side="bottom"
            variant="destructive"
            size="icon"
            className="aui-composer-stop-dictation relative size-8 rounded-full"
            aria-label="Stop dictation"
          >
            <span className="absolute inset-0 rounded-full animate-[dictation-ping_1.5s_ease-out_infinite] bg-destructive/40" />
            <span className="absolute inset-0 rounded-full animate-[dictation-ping_1.5s_ease-out_0.5s_infinite] bg-destructive/30" />
            <SquareIcon className="relative size-3 fill-current" />
          </TooltipIconButton>
        </ComposerPrimitive.StopDictation>
      </AuiIf>
      <AuiIf condition={(s) => !s.thread.isRunning && s.composer.dictation == null}>
        {restarting ? (
          <Button
            type="button"
            variant="default"
            size="icon"
            disabled
            className="aui-composer-send size-8 rounded-full opacity-70 cursor-not-allowed"
            aria-label="Waiting for server"
          >
            <LoaderIcon className="size-4 animate-spin" />
          </Button>
        ) : (
          <>
            <AuiIf condition={(s) => s.composer.isEmpty}>
              <ComposerPrimitive.Dictate asChild>
                <TooltipIconButton
                  tooltip="Voice input"
                  side="bottom"
                  variant="default"
                  size="icon"
                  className="aui-composer-dictate size-8 rounded-full"
                  aria-label="Voice input"
                >
                  <AudioLinesIcon className="size-4" />
                </TooltipIconButton>
              </ComposerPrimitive.Dictate>
            </AuiIf>
            <AuiIf condition={(s) => !s.composer.isEmpty}>
              <ComposerPrimitive.Send asChild>
                <TooltipIconButton
                  tooltip="Send message"
                  side="bottom"
                  variant="default"
                  size="icon"
                  className="aui-composer-send size-8 rounded-full"
                  aria-label="Send message"
                >
                  <ArrowUpIcon className="aui-composer-send-icon size-4" />
                </TooltipIconButton>
              </ComposerPrimitive.Send>
            </AuiIf>
          </>
        )}
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-8 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};

function extractErrorMessage(error: unknown): string {
  const str = String(error);
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed.message === "string") return parsed.message;
  } catch {
    // not JSON
  }
  return str;
}

const ErrorMessageText: FC = () => {
  const error = useAuiState((s) =>
    s.message.status?.type === "incomplete" && s.message.status.reason === "error"
      ? s.message.status.error
      : undefined,
  );
  if (error === undefined) return null;
  return <>{extractErrorMessage(error)}</>;
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message">
          <ErrorMessageText />
        </ErrorPrimitive.Message>
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150 group"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content relative wrap-break-word px-2 text-foreground leading-relaxed">
        <CollapsibleTools>
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              tools: { Fallback: ToolFallback },
            }}
          />
        </CollapsibleTools>
        <MessageError />
        <AssistantActionBar />
      </div>

      <div className="aui-assistant-message-footer mt-1 ml-2 flex">
        <BranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root absolute right-0 bottom-0 flex gap-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          <MessagePrimitive.Parts />
        </div>
      </div>

      <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
