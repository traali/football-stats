import { NavLink } from 'react-router-dom'
import { Home, Search, LayoutGrid, Heart } from 'lucide-react'
import { cn } from '../utils/cn'

const navItems = [
    { to: '/', label: 'Etusivu', icon: Home },
    { to: '/competition/spl', label: 'Selaa', icon: LayoutGrid },
    { to: '/match', label: 'Ottelu', icon: Search },
    { to: '/favorites', label: 'Suosikit', icon: Heart },
]

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-surface-1/80 backdrop-blur-xl border-t border-border-hairline pb-[env(safe-area-inset-bottom,0px)]">
            {navItems.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.to}
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