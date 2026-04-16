import {type ReactNode, useContext} from "react";
import {ThemeProvider} from "next-themes";
import {ShadowRootContext} from "@/lib/shadow-root-context";

export function ThemeWrapper({children}: {children: ReactNode}) {
    const shadowRoot = useContext(ShadowRootContext);
    // Skip next-themes inside Shadow DOM — theme is applied directly on host
    if (shadowRoot) return <>{children}</>;
    return <ThemeProvider attribute="class" enableSystem>{children}</ThemeProvider>;
}
