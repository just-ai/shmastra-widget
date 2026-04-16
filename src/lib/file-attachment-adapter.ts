import type {AttachmentAdapter} from "@assistant-ui/react";
import type {PendingAttachment, CompleteAttachment} from "@assistant-ui/core";

const FILES_ENDPOINT = "/shmastra/api/files";

async function uploadFile(file: File): Promise<{ fileName: string; url: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(FILES_ENDPOINT, {method: "POST", body: form});
    if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
    const json = await res.json();
    return {fileName: json.fileName, url: `${FILES_ENDPOINT}/${json.fileName}`};
}

export const fileAttachmentAdapter: AttachmentAdapter = {
    accept: "*",

    async add({file}) {
        const {fileName, url} = await uploadFile(file);
        return {
            id: crypto.randomUUID(),
            type: file.type.startsWith("image/") ? "image" : "file",
            name: fileName,
            contentType: file.type,
            file: new File([], fileName, {type: file.type}),
            status: {type: "requires-action", reason: "composer-send"},
            content: [{type: "file" as const, data: url, mimeType: file.type, filename: fileName}],
        } satisfies PendingAttachment;
    },

    async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
        return {
            ...attachment,
            status: {type: "complete"},
            content: attachment.content ?? [],
        };
    },

    async remove() {},
};
