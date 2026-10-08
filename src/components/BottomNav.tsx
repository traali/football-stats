import { NavLink } from 'react-router-dom'
import { Home, Search, LayoutGrid, Heart } from 'lucide-react'
import { cn } from '../utils/cn'
import { FEATURED } from '../config'

const navItems = [
    { to: '/', label: 'Etusivu', icon: Home, end: true },
    { to: '/haku', label: 'Haku', icon: Search, end: false },
    { to: `/competition/${FEATURED.competitionId}`, label: 'Selaa', icon: LayoutGrid, end: false },
    { to: '/favorites', label: 'Suosikit', icon: Heart, end: false },
]

export function BottomNav() {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-surface-1/90 backdrop-blur-xl border-t border-border-hairline pb-[env(safe-area-inset-bottom,0px)] transform-gpu"
            style={{
                transform: 'translate3d(0, 0, 0)',
                WebkitTransform: 'translate3d(0, 0, 0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
            }}
        >
            {navItems.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                        cn(
                            'flex flex-col items-center justify-center gap-0.5 py-2 px-4 min-w-[64px] min-h-[48px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                            isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary',
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_var(--color-accent-glow)]')} />
                            <span className="text-xs font-medium uppercase tracking-wider">{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}
