/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TASO_PROXY?: string
}

declare module 'virtual:pwa-register' {
    export function registerSW(options?: { immediate?: boolean }): (reloadPage?: boolean) => Promise<void>
}
