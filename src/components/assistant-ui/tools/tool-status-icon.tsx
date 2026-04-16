import { ChevronRightIcon, CircleIcon, LoaderIcon } from "lucide-react";
import { useState, useEffect } from "react";

type ToolStatusIconProps = {
    isRunning: boolean;
    isError?: boolean;
    open?: boolean;
};

export function ToolStatusIcon({ isRunning, isError, open }: ToolStatusIconProps) {
    const [showArrow, setShowArrow] = useState(false);
    const done = !isRunning;

    useEffect(() => {
        if (!done) {
            setShowArrow(false);
            return;
        }
        const t = setTimeout(() => setShowArrow(true), 2000);
        return () => clearTimeout(t);
    }, [done]);

    if (isRunning) {
        return <LoaderIcon className="size-3.5 shrink-0 animate-spin text-muted-foreground" />;
    }

    if (!showArrow) {
        return <CircleIcon className={`size-2 shrink-0 ${isError ? "fill-destructive text-destructive" : "fill-green-500 text-green-500"}`} />;
    }

    return <ChevronRightIcon className={`size-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />;
}
