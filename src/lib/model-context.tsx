import { createContext, useContext, useState, type ReactNode } from "react";

interface ModelContextValue {
    models: string[];
    modelId: string | null;
    setModelId: (id: string) => void;
}

const ModelContext = createContext<ModelContextValue>({
    models: [],
    modelId: null,
    setModelId: () => {},
});

export function ModelProvider({
    models,
    initialModelId,
    children,
}: {
    models: string[];
    initialModelId: string | null;
    children: ReactNode;
}) {
    const [modelId, setModelId] = useState<string | null>(initialModelId);

    return (
        <ModelContext.Provider value={{ models, modelId, setModelId }}>
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    return useContext(ModelContext);
}
