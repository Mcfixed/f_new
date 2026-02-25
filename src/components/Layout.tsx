import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
    '/': { title: 'Dashboard', subtitle: 'Live sensor map & alert feed' },
    '/sensors': { title: 'Análisis de Sensores', subtitle: 'Calidad de señal, búsqueda y datos por sensor' },
    '/logs': { title: 'System Log', subtitle: 'Full audit trail of network events' },
};

export default function Layout() {
    const location = useLocation();
    const info = VIEW_TITLES[location.pathname] ?? VIEW_TITLES['/'];

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top header */}
                <header
                    style={{
                        height: 52,
                        flexShrink: 0,
                        background: 'var(--bg-surface)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 20px',
                        gap: 12,
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                lineHeight: 1.2,
                            }}
                        >
                            {info.title}
                        </h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            {info.subtitle}
                        </p>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            250 sensores activos
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: 'rgba(0,232,122,0.08)',
                                border: '1px solid rgba(0,232,122,0.2)',
                            }}
                        >
                            <div className="status-dot online" />
                            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 500 }}>
                                Red operativa
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
