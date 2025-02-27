/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly REACT_APP_BACKEND_URL: string;
    readonly REACT_APP_FRONTEND_URL: string;
    readonly RSBUILD_PUBLIC_URL: string;
  }
}

interface Window {
  clipboardData: any;
}