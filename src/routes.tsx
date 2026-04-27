import { createBrowserRouter } from 'react-router-dom'
import { Home } from './pages/Home'
import { MatchPage } from './pages/MatchPage'
import { NotFound } from './pages/NotFound'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
        errorElement: <NotFound />,
    },
    {
        path: '/match/:matchId',
        element: <MatchPage />,
    },
    {
        path: '*',
        element: <NotFound />,
    },
], {
    basename: import.meta.env.BASE_URL,
})
