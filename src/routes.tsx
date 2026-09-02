import { createHashRouter, Outlet } from 'react-router-dom'
import { Home } from './pages/Home'
import { MatchPage } from './pages/MatchPage'
import { NotFound } from './pages/NotFound'
import { ErrorBoundaryPage } from './components/ErrorBoundaryPage'
import { GroupPage } from './pages/GroupPage'
import { TeamPage } from './pages/TeamPage'
import { PlayerPage } from './pages/PlayerPage'
import { CompetitionPage } from './pages/CompetitionPage'
import { CategoryPage } from './pages/CategoryPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { TurnauksetPage } from './pages/TurnauksetPage'
import { BottomNav } from './components/BottomNav'

function Layout() {
    const isEmbed =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '').get('embed') === 'true'

    return (
        <div
            className={`min-h-screen min-h-[100dvh] flex flex-col justify-between pt-[env(safe-area-inset-top,0px)] ${
                isEmbed ? 'pb-2' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]'
            }`}
        >
            <div className="flex-1 w-full">
                <Outlet />
            </div>
            {!isEmbed && <BottomNav />}
        </div>
    )
}

export const router = createHashRouter([
    {
        element: <Layout />,
        errorElement: <ErrorBoundaryPage />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/match', element: <MatchPage /> },
            { path: '/match/:matchId', element: <MatchPage /> },
            { path: '/competition/:compId', element: <CompetitionPage /> },
            { path: '/competition/:compId/category/:catId', element: <CategoryPage /> },
            { path: '/group/:compId/:catId/:groupId', element: <GroupPage /> },
            { path: '/team/:teamId', element: <TeamPage /> },
            { path: '/turnaukset/:turnaus/:sarja/:teamId', element: <TurnauksetPage /> },
            { path: '/player/:playerId', element: <PlayerPage /> },
            { path: '/favorites', element: <FavoritesPage /> },
            { path: '*', element: <NotFound /> },
        ],
    },
])