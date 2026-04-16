import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { probeServer } from "@/lib/api";

interface ServerStatusContextValue {
    restarting: boolean;
    waitForServer: () => void;
}

const ServerStatusContext = createContext<ServerStatusContextValue>({
    restarting: false,
    waitForServer: () => {},
});

export function useServerStatus() {
    return useContext(ServerStatusContext);
}

const POLL_INTERVAL = 1500;
const APPLY_DELAY = 7000;

/**
 * Creates a full-screen overlay on document.body to block all mouse interaction
 * while changes are being applied and the server is restarting.
 */
function useClickBlocker(active: boolean) {
    const overlayRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (active) {
            const overlay = document.createElement("div");
            overlay.style.cssText =
                "position:fixed;inset:0;z-index:2147483647;cursor:wait;";
            document.body.appendChild(overlay);
            overlayRef.current = overlay;
            document.dispatchEvent(new CustomEvent("assistant:applying", { detail: { applying: true } }));
        } else if (overlayRef.current) {
            overlayRef.current.remove();
            overlayRef.current = null;
            document.dispatchEvent(new CustomEvent("assistant:applying", { detail: { applying: false } }));
        }

        return () => {
            if (overlayRef.current) {
                overlayRef.current.remove();
                overlayRef.current = null;
            }
        };
    }, [active]);
}

export function ServerStatusProvider({ children }: { children: ReactNode }) {
    const [restarting, setRestarting] = useState(false);
    const polling = useRef(false);

    useClickBlocker(restarting);

    const waitForServer = useCallback(() => {
        if (polling.current) return;
        polling.current = true;
        setRestarting(true);

        const probe = () => {
            probeServer().then((ok) => {
                if (ok) {
                    polling.current = false;
                    setRestarting(false);
                } else {
                    setTimeout(probe, POLL_INTERVAL);
                }
            });
        };

        // Wait for file copy + rebuild before polling
        setTimeout(probe, APPLY_DELAY);
    }, []);

    return (
        <ServerStatusContext.Provider value={{ restarting, waitForServer }}>
            {children}
        </ServerStatusContext.Provider>
    );
}
