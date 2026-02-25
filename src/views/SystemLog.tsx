import { useEffect, useRef, useState } from 'react';
import { systemLogs, generateLiveLog, type LogEntry, type LogLevel } from '../data/mockData';

const LEVEL_COLORS: Record<LogLevel, string> = {
    info: 'var(--accent-blue)',
    warning: 'var(--accent-amber)',
    error: 'var(--accent-red)',
};

const LEVEL_BG: Record<LogLevel, string> = {
    info: 'rgba(59,130,246,0.1)',
    warning: 'rgba(245,158,11,0.1)',
    error: 'rgba(239,68,68,0.1)',
};

function LogRow({ entry, index }: { entry: LogEntry; index: number }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0,
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                animation: index === 0 ? 'slide-in-left 0.2s ease forwards' : undefined,
            }}
        >
            {/* Level badge */}
            <div
                style={{
                    width: 72,
                    flexShrink: 0,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <span
                    style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: LEVEL_COLORS[entry.level],
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: `1px solid ${LEVEL_COLORS[entry.level]}`,
                        background: LEVEL_BG[entry.level],
                    }}
                >
                    {entry.level.toUpperCase()}
                </span>
            </div>

            {/* Timestamp */}
            <div
                style={{
                    width: 130,
                    flexShrink: 0,
                    padding: '8px 0',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    fontSize: 10,
                }}
            >
                {new Date(entry.timestamp).toLocaleString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })}
            </div>

            {/* Source */}
            <div
                style={{
                    width: 120,
                    flexShrink: 0,
                    padding: '8px 12px 8px 0',
                    color: 'var(--accent-purple)',
                    fontFamily: 'monospace',
                    fontSize: 10,
                }}
            >
                {entry.source}
            </div>

            {/* Message */}
            <div style={{ flex: 1, padding: '8px 12px 8px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {entry.message}
            </div>

            {/* ID */}
            <div
                style={{
                    width: 80,
                    flexShrink: 0,
                    padding: '8px 12px 8px 0',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    fontSize: 9,
                    textAlign: 'right',
                }}
            >
                {entry.id}
            </div>
        </div>
    );
}

type Filter = LogLevel | 'all';

export default function SystemLog() {
    const [logs, setLogs] = useState<LogEntry[]>(systemLogs);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Simulate live log injection
    useEffect(() => {
        const timer = setInterval(() => {
            setLogs(prev => [generateLiveLog(), ...prev]);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scroll to bottom when new logs arrive (we show newest first, so scroll to top)
    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    const filtered = logs.filter(l => {
        if (filter !== 'all' && l.level !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                l.message.toLowerCase().includes(q) ||
                l.source.toLowerCase().includes(q) ||
                l.id.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const infoCount = logs.filter(l => l.level === 'info').length;
    const warnCount = logs.filter(l => l.level === 'warning').length;
    const errorCount = logs.filter(l => l.level === 'error').length;
    const lastEntry = logs[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Stats bar */}
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    flexShrink: 0,
                    alignItems: 'center',
                }}
            >
                {[
                    { label: 'Total eventos', value: logs.length, color: 'var(--text-primary)' },
                    { label: 'Errores', value: errorCount, color: 'var(--accent-red)' },
                    { label: 'Advertencias', value: warnCount, color: 'var(--accent-amber)' },
                    { label: 'Info', value: infoCount, color: 'var(--accent-blue)' },
                ].map(({ label, value, color }) => (
                    <div
                        key={label}
                        className="glass-card"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
                    </div>
                ))}

                <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
                    Último evento:{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {lastEntry
                            ? new Date(lastEntry.timestamp).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })
                            : '–'}
                    </span>
                </div>

                {/* Live indicator */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 10,
                        color: 'var(--accent-green)',
                    }}
                >
                    <div className="status-dot online" style={{ animation: 'pulse-glow 1s infinite' }} />
                    LIVE
                </div>
            </div>

            {/* Filter bar */}
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    flexShrink: 0,
                    alignItems: 'center',
                }}
            >
                {(['all', 'info', 'warning', 'error'] as Filter[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '5px 14px',
                            borderRadius: 6,
                            border: `1px solid ${filter === f
                                    ? f === 'all'
                                        ? 'var(--border-light)'
                                        : LEVEL_COLORS[f as LogLevel]
                                    : 'var(--border)'
                                }`,
                            background:
                                filter === f
                                    ? f === 'all'
                                        ? 'var(--bg-hover)'
                                        : LEVEL_BG[f as LogLevel]
                                    : 'transparent',
                            color:
                                filter === f
                                    ? f === 'all'
                                        ? 'var(--text-primary)'
                                        : LEVEL_COLORS[f as LogLevel]
                                    : 'var(--text-muted)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            textTransform: 'capitalize',
                        }}
                    >
                        {f === 'all' ? 'Todos' : f}
                    </button>
                ))}

                <input
                    type="text"
                    placeholder="Filtrar mensajes…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        marginLeft: 8,
                        flex: 1,
                        maxWidth: 320,
                        padding: '5px 12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        fontSize: 11,
                        outline: 'none',
                    }}
                    onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--accent-green)')}
                    onBlur={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--border)')}
                />

                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {filtered.length} entradas
                </span>

                <button
                    onClick={() => setAutoScroll(p => !p)}
                    style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: `1px solid ${autoScroll ? 'var(--accent-green)' : 'var(--border)'}`,
                        background: autoScroll ? 'rgba(0,232,122,0.08)' : 'transparent',
                        color: autoScroll ? 'var(--accent-green)' : 'var(--text-muted)',
                        fontSize: 11,
                        cursor: 'pointer',
                    }}
                >
                    {autoScroll ? '⏸ Auto-scroll on' : '▶ Auto-scroll off'}
                </button>
            </div>

            {/* Log table header */}
            <div
                style={{
                    display: 'flex',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border)',
                    flexShrink: 0,
                }}
            >
                {[
                    { label: 'Nivel', width: 72 },
                    { label: 'Timestamp', width: 130 },
                    { label: 'Origen', width: 120 },
                    { label: 'Mensaje', width: undefined },
                    { label: 'ID', width: 80 },
                ].map(col => (
                    <div
                        key={col.label}
                        style={{
                            width: col.width,
                            flex: col.width ? undefined : 1,
                            padding: '6px 10px',
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            letterSpacing: 0.8,
                            textAlign: col.label === 'ID' ? 'right' : undefined,
                        }}
                    >
                        {col.label.toUpperCase()}
                    </div>
                ))}
            </div>

            {/* Log entries */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {filtered.map((entry, i) => (
                    <LogRow key={entry.id + entry.timestamp} entry={entry} index={i} />
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
