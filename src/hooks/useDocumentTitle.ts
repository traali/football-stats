import { useEffect } from 'react'

/**
 * Brand in the tab title. The Hakemisto gate (sports-federation scripts/check-site.mjs)
 * requires index.html's <title> to be exactly this, so the home route uses it as is and
 * every other route keeps its own Finnish title in front of it.
 */
export const APP_TITLE = 'Football Stats & H2H'

export function useDocumentTitle(title?: string | null) {
    useEffect(() => {
        document.title = title ? `${title} · ${APP_TITLE}` : APP_TITLE
    }, [title])
}
