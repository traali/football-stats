import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

registerSW({
    immediate: true,
    onRegisteredSW(_swUrl: string, r?: ServiceWorkerRegistration) {
        if (!r) return
        // Tarkista päivitys kun käyttäjä palaa sovellukseen (esim. mobiilissa taustalta)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                r.update().catch(() => {})
            }
        })
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
