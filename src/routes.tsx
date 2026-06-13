import { createHashRouter, Outlet } from 'react-router-dom'
import { Home } from './pages/Home'
import { MatchPage } from './pages/MatchPage'
import { NotFound } from './pages/NotFound'
import { GroupPage } from './pages/GroupPage'
import { TeamPage } from './pages/TeamPage'
import { PlayerPage } from './pages/PlayerPage'
import { CompetitionPage } from './pages/CompetitionPage'
import { CategoryPage } from './pages/CategoryPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { BottomNav } from './components/BottomNav'

function Layout() {
    return (
        <div className="pb-20">
            <Outlet />
            <BottomNav />
        </div>
    )
}

export const router = createHashRouter([
    {
        element: <Layout />,
        errorElement: <NotFound />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/match/:matchId', element: <MatchPage /> },
            { path: '/competition/:compId', element: <CompetitionPage /> },
            { path: '/competition/:compId/category/:catId', element: <CategoryPage /> },
            { path: '/group/:compId/:catId/:groupId', element: <GroupPage /> },
            { path: '/team/:teamId', element: <TeamPage /> },
            { path: '/player/:playerId', element: <PlayerPage /> },
            { path: '/favorites', element: <FavoritesPage /> },
            { path: '*', element: <NotFound /> },
        ],
    },
])