import {setApiBaseUrl} from "@/lib/api";
import {Assistant} from "@/components/assistant.tsx";

function App({apiBaseUrl}: {apiBaseUrl?: string}) {
    if (apiBaseUrl) {
        setApiBaseUrl(apiBaseUrl);
    }

    return <Assistant />;
}

export default App;
