declare module 'socketio-file-upload' {
    class SocketIOFileUpload {
        constructor(socket: unknown);
        listenOnInput(input: HTMLElement | null): void;
        submitFiles(files: File[] | FileList): void;
        addEventListener(event: 'progress', callback: (data: { bytesLoaded: number; file: { id: string; size: number } }) => void): void;
        addEventListener(event: 'complete', callback: (event: { file: { id: string; name: string; size: number; type: string; meta?: { compressed?: boolean } } }) => void): void;
        addEventListener(event: 'start', callback: (event: { file: { id: string; name: string; size: number; type: string; meta: { channel: string; type: string; size: number; id: string; compressed: boolean } } }) => void): void;
        addEventListener(event: 'error', callback: (data: { code: number }) => void): void;
        addEventListener(event: string, callback: (data: unknown) => void): void;
        removeEventListener(event: 'progress', callback: (data: { bytesLoaded: number; file: { id: string; size: number } }) => void): void;
        removeEventListener(event: 'complete', callback: (event: { file: { id: string; name: string; size: number; type: string; meta?: { compressed?: boolean } } }) => void): void;
        removeEventListener(event: 'start', callback: (event: { file: { id: string; name: string; size: number; type: string; meta: { channel: string; type: string; size: number; id: string; compressed: boolean } } }) => void): void;
        removeEventListener(event: 'error', callback: (data: { code: number }) => void): void;
        removeEventListener(event: string, callback: (data: unknown) => void): void;
        destroy(): void;
        maxFileSize: number;
        chunkSize: number;
        dir: string;
        listen(socket: unknown): void;
        on(event: string, callback: (data: unknown) => void): void;
        static router: unknown;
    }

    export default SocketIOFileUpload;
}
