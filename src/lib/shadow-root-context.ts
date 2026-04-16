import { createContext, useContext } from "react";

export const ShadowRootContext = createContext<ShadowRoot | null>(null);

export function usePortalContainer(): HTMLElement | undefined {
    const shadowRoot = useContext(ShadowRootContext);
    return (shadowRoot as unknown as HTMLElement) ?? undefined;
}
