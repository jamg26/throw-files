declare module 'socketio-file-upload' {
    import { Router } from 'express';

    interface SavedEvent {
        file: {
            id: string;
            pathName: string;
        };
    }

    class SocketIOFileUpload {
        constructor();
        dir: string;
        listen(socket: unknown): void;
        on(event: 'error', callback: (error: Error) => void): void;
        on(event: 'saved', callback: (event: SavedEvent) => void): void;
        on(event: string, callback: (event: unknown) => void): void;
        static router: Router;
    }

    export = SocketIOFileUpload;
}
