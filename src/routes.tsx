import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Home } from './pages/Home'
import { MatchPage } from './pages/MatchPage'
import { NotFound } from './pages/NotFound'
import { BottomNav } from './components/BottomNav'

function Layout() {
    return (
        <div className="pb-20">
            <Outlet />
            <BottomNav />
        </div>
    )
}

export const router = createBrowserRouter([
    {
        element: <Layout />,
        errorElement: <NotFound />,
        children: [
            {
                path: '/',
                element: <Home />,
            },
            {
                path: '/match/:matchId',
                element: <MatchPage />,
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
], {
    basename: import.meta.env.BASE_URL,
})
