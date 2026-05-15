import { createContext, useContext } from "react";

export const ShadowRootContext = createContext<ShadowRoot | null>(null);
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer(): HTMLElement | undefined {
    // Prefer the React root's mount point so portaled content stays inside
    // React's synthetic event delegation tree. Falls back to shadow root for
    // dev/SPA mode where there's no shadow boundary.
    const mount = useContext(PortalContainerContext);
    if (mount) return mount;
    const shadowRoot = useContext(ShadowRootContext);
    return (shadowRoot as unknown as HTMLElement) ?? undefined;
}
