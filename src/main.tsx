import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, r) {
        if (!r) return
        // Tarkista päivitys heti kun käyttäjä palaa sovellukseen (esim. puhelimessa taustalta)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                r.update().catch(() => {})
            }
        })
        // Säännöllinen taustatarkistus 30 min välein jos sovellus on auki
        setInterval(() => {
            r.update().catch(() => {})
        }, 30 * 60 * 1000)
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
