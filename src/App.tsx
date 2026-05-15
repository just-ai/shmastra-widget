import {setApiBaseUrl} from "@/lib/api";
import {Assistant} from "@/components/assistant.tsx";
import {WidgetOptionsProvider, type WidgetOptions} from "@/lib/widget-options.tsx";

function App({apiBaseUrl, options}: {apiBaseUrl?: string; options?: Partial<WidgetOptions>}) {
    if (apiBaseUrl) {
        setApiBaseUrl(apiBaseUrl);
    }

    return (
        <WidgetOptionsProvider options={options}>
            <Assistant />
        </WidgetOptionsProvider>
    );
}

export default App;
