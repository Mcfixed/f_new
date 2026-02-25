import { NavLink } from 'react-router-dom';

const navItems = [
    {
        to: '/', label: 'Dashboard',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        to: '/sensors', label: 'Análisis de Sensores',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
                <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
            </svg>
        ),
    },
    {
        to: '/logs', label: 'System Logs',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
    },
];

// Radio / logo icon
const RadioIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
);

export default function Sidebar() {
    return (
        <aside style={{
            width: 64, flexShrink: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 4, zIndex: 10,
        }}>
            {/* Logo */}
            <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'linear-gradient(135deg, var(--accent-green) 0%, #00a050 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexShrink: 0, color: '#000',
            }}>
                <RadioIcon />
            </div>

            {/* Nav items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                {navItems.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} end={to === '/'} title={label}
                        style={({ isActive }) => ({
                            width: 44, height: 44, borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            textDecoration: 'none', transition: 'all 0.15s ease',
                            color: isActive ? 'var(--accent-green)' : 'var(--text-muted)',
                            background: isActive ? 'rgba(0,232,122,0.08)' : 'transparent',
                            border: isActive ? '1px solid rgba(0,232,122,0.2)' : '1px solid transparent',
                        })}
                    >
                        {icon}
                    </NavLink>
                ))}
            </nav>

            {/* Live dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className="status-dot online" />
                <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>LIVE</span>
            </div>
        </aside>
    );
}
