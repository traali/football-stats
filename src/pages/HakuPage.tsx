import { useSearchParams } from 'react-router-dom'
import { PageLayout, SearchBox } from '../components'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function HakuPage() {
    const [params, setParams] = useSearchParams()
    useDocumentTitle('Haku')
    return (
        <PageLayout>
            <h1 className="text-2xl font-bold text-text-primary">Haku</h1>
            <SearchBox
                autoFocus
                initialQuery={params.get('q') || ''}
                onQueryChange={q => setParams(q ? { q } : {}, { replace: true })}
            />
        </PageLayout>
    )
}
