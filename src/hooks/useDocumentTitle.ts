import { useEffect } from 'react'

const APP = 'Jalkapallo'

export function useDocumentTitle(title?: string | null) {
    useEffect(() => {
        document.title = title ? `${title} · ${APP}` : APP
    }, [title])
}
