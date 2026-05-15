import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setApiBaseUrl } from '@/lib/api'
import { ShadowRootContext } from '@/lib/shadow-root-context'
import type { WidgetOptions } from '@/lib/widget-options.tsx'

declare global {
    interface Window {
        __assistantWidgetCSS?: string;
    }
}

export interface AssistantWidgetOptions extends Partial<WidgetOptions> {
    element?: HTMLElement | string;
    apiBaseUrl?: string;
    theme?: 'light' | 'dark' | 'system';
    width?: string;
    height?: string;
}

export function initAssistantWidget(options: AssistantWidgetOptions = {}) {
    let container: Element | null = null;

    if (options.element) {
        container = typeof options.element === 'string'
            ? document.querySelector(options.element)
            : options.element;
        if (!container) {
            throw new Error(`Container element not found: ${options.element}`);
        }
    } else {
        container = document.createElement('div');
        document.body.appendChild(container);
    }

    if (options.apiBaseUrl) {
        setApiBaseUrl(options.apiBaseUrl);
    }

    // Make the host element transparent so it doesn't paint over the page
    const hostEl = container as HTMLElement;
    hostEl.style.background = 'transparent';
    if (options.width) hostEl.style.setProperty('--widget-width', options.width);
    if (options.height) hostEl.style.setProperty('--widget-height', options.height);

    const shadow = container.attachShadow({ mode: 'open' });

    // Inject bundled CSS into shadow root
    if (window.__assistantWidgetCSS) {
        const style = document.createElement('style');
        style.textContent = window.__assistantWidgetCSS;
        shadow.appendChild(style);
    }

    const mountPoint = document.createElement('div');
    mountPoint.style.height = '100%';
    shadow.appendChild(mountPoint);

    // Apply dark/light mode to shadow host and mount point
    const theme = options.theme ?? document.documentElement?.className ?? 'system';
    const applyTheme = (dark: boolean) => {
        const method = dark ? 'add' : 'remove';
        (container as HTMLElement).classList[method]('dark');
        mountPoint.classList[method]('dark');
    };
    if (theme === 'dark') {
        applyTheme(true);
    } else if (theme === 'light') {
        applyTheme(false);
    } else {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(mql.matches);
        mql.addEventListener('change', (e) => applyTheme(e.matches));
    }

    const root = createRoot(mountPoint);
    root.render(
        <StrictMode>
            <ShadowRootContext.Provider value={shadow}>
                <App options={{openOnStart: options.openOnStart}} />
            </ShadowRootContext.Provider>
        </StrictMode>,
    );

    return {
        unmount: () => root.unmount(),
    };
}

// Auto-init: if a <div id="assistant-widget"> exists, mount there
if (typeof document !== 'undefined') {
    const autoContainer = document.getElementById('assistant-widget');
    if (autoContainer) {
        initAssistantWidget({
            element: autoContainer,
            apiBaseUrl: autoContainer.dataset.apiBaseUrl,
            theme: (autoContainer.dataset.theme as AssistantWidgetOptions['theme']) || undefined,
            openOnStart: autoContainer.dataset.openOnStart === undefined
                ? undefined
                : autoContainer.dataset.openOnStart !== 'false',
        });
    }
}
