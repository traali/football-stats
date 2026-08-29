import { ReactNode } from 'react'

interface PageLayoutProps {
    children: ReactNode
    className?: string
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
    return (
        <div className={`min-h-screen px-4 py-6 ${className}`}>
            <div className="max-w-3xl mx-auto space-y-6">
                {children}
            </div>
        </div>
    )
}
