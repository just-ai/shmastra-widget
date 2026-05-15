import {createContext, useContext, type ReactNode} from "react";

export interface WidgetOptions {
    openOnStart: boolean;
}

const DEFAULT_WIDGET_OPTIONS: WidgetOptions = {
    openOnStart: true,
};

const WidgetOptionsContext = createContext<WidgetOptions>(DEFAULT_WIDGET_OPTIONS);

export function WidgetOptionsProvider({options, children}: {
    options?: Partial<WidgetOptions>;
    children: ReactNode;
}) {
    const value: WidgetOptions = {...DEFAULT_WIDGET_OPTIONS, ...options};
    return <WidgetOptionsContext.Provider value={value}>{children}</WidgetOptionsContext.Provider>;
}

export function useWidgetOptions(): WidgetOptions {
    return useContext(WidgetOptionsContext);
}
