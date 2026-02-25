import { useMemo, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ScatterChart,
    Scatter, ZAxis, Legend,
} from 'recharts';
import sensors from '../data/sensors';
import { sensorSignalSummaries, generatePacketsForSensor } from '../data/mockData';

// ── Server status data ────────────────────────────────────────────────────────
type SrvStatus = 'online' | 'degraded' | 'offline';

interface ServerInfo {
    id: string;
    label: string;
    status: SrvStatus;
    latency: string;
    uptime: string;
    version: string;
}

const servers: ServerInfo[] = [
    { id: 'lorawan', label: 'LoRaWAN NS', status: 'online', latency: '12 ms', uptime: '21d 4h', version: 'ChirpStack v4.7' },
    { id: 'nodered', label: 'Node-RED', status: 'online', latency: '4 ms', uptime: '21d 4h', version: 'v3.1.9' },
    { id: 'backend', label: 'Backend API', status: 'online', latency: '28 ms', uptime: '14d 8h', version: 'v2.4.1' },
    { id: 'frontend', label: 'Frontend', status: 'online', latency: '—', uptime: '14d 8h', version: 'v1.0.0' },
    { id: 'mqtt', label: 'MQTT Broker', status: 'online', latency: '6 ms', uptime: '21d 4h', version: 'Mosquitto 2.0' },
    { id: 'influx', label: 'InfluxDB', status: 'degraded', latency: '85 ms', uptime: '4d 2h', version: 'v2.7.5' },
    { id: 'psql', label: 'PostgreSQL', status: 'online', latency: '18 ms', uptime: '21d 4h', version: 'v15.6' },
    { id: 'vpn', label: 'VPN Tunnel', status: 'online', latency: '9 ms', uptime: '18d 6h', version: 'WireGuard' },
];

// ── Server status bar ─────────────────────────────────────────────────────────
function ServerStatusBar() {
    const [hovered, setHovered] = useState<string | null>(null);
    return (
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0 16px', height: 46, flexShrink: 0, overflowX: 'auto' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.8, marginRight: 14, flexShrink: 0 }}>SERVIDORES</span>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                {servers.map(srv => {
                    const color = srv.status === 'online' ? 'var(--accent-green)' : srv.status === 'degraded' ? 'var(--accent-amber)' : 'var(--accent-red)';
                    const isHov = hovered === srv.id;
                    return (
                        <div key={srv.id} onMouseEnter={() => setHovered(srv.id)} onMouseLeave={() => setHovered(null)}
                            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 5, flexShrink: 0, border: `1px solid ${srv.status === 'online' ? `${color}35` : `${color}60`}`, background: isHov ? `${color}14` : `${color}08`, cursor: 'default', transition: 'all 0.15s' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, animation: srv.status === 'degraded' ? 'pulse-glow 1.4s infinite' : undefined }} />
                            <span style={{ fontSize: 11, color, fontWeight: 500 }}>{srv.label}</span>
                            {isHov && (
                                <div style={{ position: 'absolute', top: 34, left: 0, zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '8px 12px', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', animation: 'fade-in 0.15s ease', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{srv.label}</div>
                                    {([['Estado', srv.status.toUpperCase(), color], ['Versión', srv.version, ''], ['Latencia', srv.latency, ''], ['Uptime', srv.uptime, '']]).map(([l, v, c]) => (
                                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11, paddingBottom: 3 }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                                            <span style={{ color: c || 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginLeft: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: 'var(--accent-green)' }}>{servers.filter(s => s.status === 'online').length} online</span>
                {servers.filter(s => s.status === 'degraded').length > 0 && <span style={{ fontSize: 10, color: 'var(--accent-amber)' }}>{servers.filter(s => s.status === 'degraded').length} degradado</span>}
                {servers.filter(s => s.status === 'offline').length > 0 && <span style={{ fontSize: 10, color: 'var(--accent-red)' }}>{servers.filter(s => s.status === 'offline').length} offline</span>}
            </div>
        </div>
    );
}

// ── Tooltips ──────────────────────────────────────────────────────────────────
const LineTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
        </div>
    );
};

const ScatterTip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>{d.sensorName}</div>
            <div style={{ color: 'var(--accent-blue)' }}>RSSI: {d.avgRssi} dBm</div>
            <div style={{ color: 'var(--accent-green)' }}>SNR: {d.avgSnr} dB</div>
        </div>
    );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const qColor = (rssi: number) => rssi > -80 ? 'var(--accent-green)' : rssi > -100 ? 'var(--accent-amber)' : 'var(--accent-red)';
const snrColor = (snr: number) => snr > 5 ? 'var(--accent-green)' : snr > 0 ? 'var(--accent-amber)' : 'var(--accent-red)';
const pktTypeColor = (t: string) => t === 'freefall' ? 'var(--accent-red)' : t === 'motion' ? 'var(--accent-amber)' : 'var(--text-muted)';
const pktTypeLabel = (t: string) => t === 'freefall' ? '↓ CAÍDA' : t === 'motion' ? '↗ MOVIM.' : 'HEARTBEAT';

// ── Scatter chart (reusable) ──────────────────────────────────────────────────
function ScatterAll({ height = 360 }: { height?: number }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
                <CartesianGrid stroke="var(--border)" />
                <XAxis dataKey="avgRssi" name="RSSI" unit=" dBm" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} label={{ value: 'RSSI (dBm)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis dataKey="avgSnr" name="SNR" unit=" dB" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <ZAxis range={[26, 26]} />
                <Tooltip content={<ScatterTip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} />
                <Scatter name="Online" data={sensorSignalSummaries.filter(s => s.status === 'online')} fill="var(--accent-green)" fillOpacity={0.7} />
                <Scatter name="Warning" data={sensorSignalSummaries.filter(s => s.status === 'warning')} fill="var(--accent-amber)" fillOpacity={0.7} />
                <Scatter name="Offline" data={sensorSignalSummaries.filter(s => s.status === 'offline')} fill="#555" fillOpacity={0.5} />
            </ScatterChart>
        </ResponsiveContainer>
    );
}

// ── Main View ─────────────────────────────────────────────────────────────────
type SortKey = 'avgSnr' | 'avgRssi';

export default function SensorAnalysis() {
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('avgRssi');
    const [sortAsc, setSortAsc] = useState(false);
    const [showScatter, setShowScatter] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [expandedPkt, setExpandedPkt] = useState<string | null>(null);


    const sortedList = useMemo(() => {
        const base = query.trim()
            ? sensors.filter(s =>
                s.id.toLowerCase().includes(query.toLowerCase()) ||
                s.name.toLowerCase().includes(query.toLowerCase()) ||
                s.eui.toLowerCase().includes(query.toLowerCase()) ||
                s.devAddr.toLowerCase().includes(query.toLowerCase()))
            : sensors;
        const withSig = base.map(s => ({ ...s, sig: sensorSignalSummaries.find(ss => ss.sensorId === s.id)! }));
        return withSig.sort((a, b) => {
            const av = a.sig?.[sortKey] ?? 0;
            const bv = b.sig?.[sortKey] ?? 0;
            return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
    }, [query, sortKey, sortAsc]);

    const packets = useMemo(() => selectedId ? generatePacketsForSensor(selectedId) : [], [selectedId]);
    const chartData = packets.map(p => ({
        time: new Date(p.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        rssi: p.rssi, snr: p.snr, battery: p.battery,
    }));

    const selectedSensor = selectedId ? sensors.find(s => s.id === selectedId) ?? null : null;
    const selectedSig = selectedId ? sensorSignalSummaries.find(s => s.sensorId === selectedId) : null;

    const toggleSort = (k: SortKey) => { if (sortKey === k) setSortAsc(p => !p); else { setSortKey(k); setSortAsc(false); } };

    // ── Component health (deterministic from sensor id) ───────────────────────
    type CompStatus = 'ok' | 'warn' | 'error';
    function sensorCompStatus(sensorId: string, comp: string): CompStatus {
        const seed = [...sensorId, ...comp].reduce((a, c) => a + c.charCodeAt(0), 0);
        const r = Math.abs(Math.sin(seed) * 10000) % 1;
        return r > 0.92 ? 'error' : r > 0.82 ? 'warn' : 'ok';
    }
    const [revisionRequested, setRevisionRequested] = useState(false);
    const [revisionPending, setRevisionPending] = useState(false);
    function requestRevision() {
        setRevisionPending(true);
        setRevisionRequested(false);
        setTimeout(() => { setRevisionPending(false); setRevisionRequested(true); }, 1800);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Server bar */}
            <ServerStatusBar />


            {/* Main 3-panel layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ── LEFT: Sensor list ── */}
                <div style={{ width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    {/* Search */}
                    <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>🔍</span>
                            <input type="text" placeholder="Buscar sensor, EUI, devAddr…" value={query} onChange={e => setQuery(e.target.value)}
                                style={{ width: '100%', padding: '6px 8px 6px 26px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => (e.target.style.borderColor = 'var(--accent-green)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{sortedList.length} sensores</div>
                    </div>
                    {/* Sort */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.6, flexShrink: 0 }}>ORDENAR:</span>
                        {([['avgRssi', 'RSSI'], ['avgSnr', 'SNR']] as [SortKey, string][]).map(([k, lbl]) => (
                            <button key={k} onClick={() => toggleSort(k)}
                                style={{ padding: '2px 8px', borderRadius: 10, border: `1px solid ${sortKey === k ? 'var(--accent-green)' : 'var(--border)'}`, background: sortKey === k ? 'rgba(0,232,122,0.1)' : 'transparent', color: sortKey === k ? 'var(--accent-green)' : 'var(--text-muted)', fontSize: 9, cursor: 'pointer', fontWeight: 600, letterSpacing: 0.4 }}>
                                {lbl} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
                            </button>
                        ))}
                    </div>
                    {/* Rows */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {sortedList.map(sensor => {
                            const sig = sensor.sig;
                            const isSel = sensor.id === selectedId;
                            return (
                                <div key={sensor.id} onClick={() => setSelectedId(isSel ? null : sensor.id)}
                                    style={{ padding: '7px 10px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSel ? 'rgba(0,232,122,0.05)' : 'transparent', borderLeft: `2px solid ${isSel ? 'var(--accent-green)' : 'transparent'}`, transition: 'background 0.1s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>{sensor.name}</span>
                                        <div className={`status-dot ${sensor.status}`} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                        <span style={{ fontSize: 10, color: qColor(sig?.avgRssi ?? -120) }}>{sig?.avgRssi} dBm</span>
                                        <span style={{ fontSize: 10, color: snrColor(sig?.avgSnr ?? -15) }}>{sig?.avgSnr} dB</span>
                                        <span style={{ fontSize: 10, color: sensor.batteryLevel < 30 ? 'var(--accent-red)' : 'var(--text-muted)' }}>🔋{sensor.batteryLevel}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT: detail or scatter ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedSensor ? (
                        <>
                            {/* Sensor header */}
                            <div className="glass-card" style={{ margin: '8px 10px 0', padding: '10px 14px', flexShrink: 0, borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{selectedSensor.name}</h2>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>EUI: {selectedSensor.eui}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button onClick={() => setShowScatter(s => !s)}
                                            style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${showScatter ? 'var(--accent-blue)' : 'var(--border)'}`, background: showScatter ? 'rgba(96,165,250,0.1)' : 'transparent', color: showScatter ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: 10, cursor: 'pointer', fontWeight: 500 }}>
                                            {showScatter ? '✕ Cerrar red' : '⊞ Ver red completa'}
                                        </button>
                                        <button onClick={() => setShowMap(true)}
                                            style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', fontWeight: 500 }}>
                                            📍 Ubicación
                                        </button>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, color: selectedSensor.status === 'online' ? 'var(--accent-green)' : selectedSensor.status === 'warning' ? 'var(--accent-amber)' : '#555', border: `1px solid ${selectedSensor.status === 'online' ? 'var(--accent-green)' : selectedSensor.status === 'warning' ? 'var(--accent-amber)' : '#555'}` }}>
                                            {selectedSensor.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 8 }}>
                                    {[
                                        ['devAddr', selectedSensor.devAddr, true, undefined],
                                        ['Firmware', selectedSensor.firmware, false, undefined],
                                        ['Batería', `${selectedSensor.batteryLevel}%`, false, selectedSensor.batteryLevel < 30 ? 'var(--accent-red)' : undefined],
                                        ['RSSI prom.', `${selectedSig?.avgRssi} dBm`, false, undefined],
                                        ['SNR prom.', `${selectedSig?.avgSnr} dB`, false, undefined],
                                        ['Alertas', String(selectedSensor.alertCount), false, undefined],
                                    ].map(([l, v, mono, col]) => (
                                        <div key={l as string}>
                                            <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 2 }}>{(l as string).toUpperCase()}</div>
                                            <div style={{ fontSize: 11, color: (col as string) ?? 'var(--text-primary)', fontFamily: mono ? 'monospace' : undefined }}>{v as string}</div>
                                        </div>
                                    ))}
                                    {/* Mode badge */}
                                    <div>
                                        <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 4 }}>MODO</div>
                                        {(() => {
                                            const modeColor = selectedSensor.mode === 'production' ? 'var(--accent-green)' : selectedSensor.mode === 'maintenance' ? 'var(--accent-amber)' : 'var(--accent-blue)';
                                            const modeLabel = selectedSensor.mode === 'production' ? '⚡ Producción' : selectedSensor.mode === 'maintenance' ? '🔧 Mantención' : '🚚 Transporte';
                                            return <span style={{ fontSize: 10, fontWeight: 600, color: modeColor, padding: '2px 6px', borderRadius: 4, border: `1px solid ${modeColor}50`, background: `${modeColor}12`, whiteSpace: 'nowrap' }}>{modeLabel}</span>;
                                        })()}
                                    </div>
                                </div>

                                {/* ── Second row: Last data + Component health ── */}
                                <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                                    {/* ÚLTIMO DATO */}
                                    <div style={{ flexShrink: 0 }}>
                                        <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 3 }}>ÚLTIMO DATO</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'monospace' }}>
                                            {new Date(selectedSensor.lastSeen).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {new Date(selectedSensor.lastSeen).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
                                    {/* Component health */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.8 }}>REVISIÓN DE COMPONENTES</div>
                                            <button onClick={requestRevision} disabled={revisionPending}
                                                style={{ padding: '2px 8px', borderRadius: 5, border: '1px solid var(--border)', background: revisionPending ? 'rgba(96,165,250,0.1)' : 'transparent', color: revisionPending ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: 9, cursor: revisionPending ? 'default' : 'pointer', fontWeight: 500 }}>
                                                {revisionPending ? '⟳ Solicitando…' : revisionRequested ? '✓ Enviado' : '⬇ Solicitar revisión'}
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                            {([
                                                ['Aceleróm.', 'accel'], ['Sensor', 'sensor'],
                                                ['Bluetooth', 'bt'], ['GPS', 'gps'],
                                                ['Batería', 'bat'], ['Panel sol.', 'solar'],
                                            ] as [string, string][]).map(([label, key]) => {
                                                const st = revisionRequested ? sensorCompStatus(selectedSensor.id, key) : 'ok';
                                                const col = st === 'ok' ? 'var(--accent-green)' : st === 'warn' ? 'var(--accent-amber)' : 'var(--accent-red)';
                                                const icon = st === 'ok' ? '✓' : st === 'warn' ? '⚠' : '✕';
                                                return (
                                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, border: `1px solid ${col}40`, background: `${col}10`, whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: 9, color: col, fontWeight: 700 }}>{icon}</span>
                                                        <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {revisionRequested && (
                                            <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 4 }}>
                                                Última revisión: {new Date().toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Optional scatter */}
                            {showScatter && (
                                <div className="glass-card animate-fade-in" style={{ margin: '6px 10px 0', padding: '8px 12px 4px', flexShrink: 0 }}>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 4 }}>DISPERSÓN RSSI vs SNR — RED COMPLETA</div>
                                    <ScatterAll height={190} />
                                </div>
                            )}

                            {/* ── 2-column: Charts | Packets ── */}
                            <div style={{ flex: 1, display: 'flex', gap: 8, padding: '8px 10px 10px', overflow: 'hidden' }}>

                                {/* Left col: RSSI+SNR chart + Battery chart */}
                                <div style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                                    {/* Combined signal chart */}
                                    <div className="glass-card" style={{ flex: 1, padding: '8px 10px 4px', minHeight: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, color: 'var(--text-muted)' }}>SEÑAL — 24h</span>
                                            <span style={{ fontSize: 9, color: 'var(--accent-blue)' }}>— RSSI (dBm)</span>
                                            <span style={{ fontSize: 9, color: 'var(--accent-green)' }}>— SNR (dB)</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="87%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                                                <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} tickLine={false} interval="preserveStartEnd" />
                                                <YAxis yAxisId="rssi" tick={{ fontSize: 8, fill: 'var(--accent-blue)' }} tickLine={false} axisLine={false} width={38} />
                                                <YAxis yAxisId="snr" orientation="right" tick={{ fontSize: 8, fill: 'var(--accent-green)' }} tickLine={false} axisLine={false} width={34} />
                                                <Tooltip content={<LineTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: 9, color: 'var(--text-muted)' }} iconType="plainline" iconSize={12} />
                                                <Line yAxisId="rssi" type="monotone" dataKey="rssi" name="RSSI" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                                                <Line yAxisId="snr" type="monotone" dataKey="snr" name="SNR" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Battery chart */}
                                    <div className="glass-card" style={{ flex: 1, padding: '8px 10px 4px', minHeight: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.8, color: 'var(--text-muted)' }}>BATERÍA % — 24h</span>
                                            <span style={{ fontSize: 9, color: 'var(--accent-amber)' }}>— Nivel (%)</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="87%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                                                <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} tickLine={false} interval="preserveStartEnd" />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'var(--accent-amber)' }} tickLine={false} axisLine={false} width={34} unit="%" />
                                                <Tooltip content={<LineTooltip />} />
                                                <Line type="monotone" dataKey="battery" name="Batería" stroke="var(--accent-amber)" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right col: Packet table with per-gateway expansion */}
                                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                                    <div style={{ padding: '7px 10px', borderBottom: '1px solid var(--border)', fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.8, flexShrink: 0 }}>
                                        PAQUETES RECIBIDOS — 24H · <span style={{ color: 'var(--accent-green)', fontWeight: 400 }}>haz clic para ver gateways</span>
                                    </div>
                                    <div style={{ overflowY: 'auto', flex: 1 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                                                <tr>
                                                    {['#', 'Hora', 'Tipo', 'Best RSSI', 'Best SNR', 'GWs', 'Bytes', '🔋', 'Frame'].map(c => (
                                                        <th key={c} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{c}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {packets.map((p, i) => {
                                                    const isExpanded = expandedPkt === p.id;
                                                    return (
                                                        <>
                                                            {/* Main packet row */}
                                                            <tr key={p.id}
                                                                onClick={() => setExpandedPkt(isExpanded ? null : p.id)}
                                                                style={{ background: isExpanded ? 'rgba(0,232,122,0.04)' : i % 2 ? 'rgba(255,255,255,0.012)' : 'transparent', borderBottom: isExpanded ? 'none' : '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}>
                                                                <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: 10 }}>{i + 1}</td>
                                                                <td style={{ padding: '4px 8px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}>
                                                                    {new Date(p.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td style={{ padding: '4px 8px' }}>
                                                                    <span style={{ fontSize: 8, fontWeight: 700, color: pktTypeColor(p.type), padding: '1px 4px', borderRadius: 3, border: `1px solid ${pktTypeColor(p.type)}`, background: `${pktTypeColor(p.type)}15`, whiteSpace: 'nowrap' }}>{pktTypeLabel(p.type)}</span>
                                                                </td>
                                                                <td style={{ padding: '4px 8px', color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: 10 }}>{p.rssi}</td>
                                                                <td style={{ padding: '4px 8px', color: 'var(--accent-green)', fontFamily: 'monospace', fontSize: 10 }}>{p.snr}</td>
                                                                <td style={{ padding: '4px 8px' }}>
                                                                    <span style={{ fontSize: 9, fontWeight: 600, color: p.gateways.length > 1 ? 'var(--accent-amber)' : 'var(--text-muted)', background: p.gateways.length > 1 ? 'rgba(245,158,11,0.12)' : 'transparent', border: `1px solid ${p.gateways.length > 1 ? 'var(--accent-amber)' : 'var(--border)'}`, padding: '1px 5px', borderRadius: 8 }}>
                                                                        {isExpanded ? '▲' : '▼'} {p.gateways.length}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '4px 8px', color: 'var(--text-secondary)', fontSize: 10 }}>{p.payloadSize}</td>
                                                                <td style={{ padding: '4px 8px', color: p.battery < 30 ? 'var(--accent-red)' : 'var(--text-secondary)', fontSize: 10 }}>{p.battery}%</td>
                                                                <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10 }}>{p.frameCounter}</td>
                                                            </tr>
                                                            {/* Expanded: per-gateway rows */}
                                                            {isExpanded && p.gateways.map((gw, gi) => (
                                                                <tr key={`${p.id}-gw-${gi}`} style={{ background: 'rgba(0,232,122,0.025)', borderBottom: gi === p.gateways.length - 1 ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.04)' }}>
                                                                    <td colSpan={2} style={{ padding: '3px 8px 3px 22px' }}>
                                                                        {gi === 0 && <span style={{ fontSize: 8, color: 'var(--accent-green)', fontWeight: 700, letterSpacing: 0.6 }}>★ MEJOR</span>}
                                                                    </td>
                                                                    <td style={{ padding: '3px 8px', fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                                        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginRight: 4 }}>↳</span>
                                                                        <span style={{ fontWeight: 500 }}>{gw.gatewayName}</span>
                                                                        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4, fontFamily: 'monospace' }}>{gw.gatewayId}</span>
                                                                    </td>
                                                                    <td style={{ padding: '3px 8px', color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: 10 }}>{gw.rssi}</td>
                                                                    <td style={{ padding: '3px 8px', color: 'var(--accent-green)', fontFamily: 'monospace', fontSize: 10 }}>{gw.snr}</td>
                                                                    <td colSpan={4} />
                                                                </tr>
                                                            ))}
                                                        </>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* No sensor selected — show scatter by default */
                        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
                            <div className="glass-card" style={{ padding: '12px 14px 8px', height: '100%', minHeight: 340, boxSizing: 'border-box' }}>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 4 }}>
                                    DISPERSIÓN RSSI vs SNR — RED COMPLETA · Selecciona un sensor para ver gráficos + tabla
                                </div>
                                <ScatterAll height={490} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Map modal ── */}
            {showMap && selectedSensor && (
                <div
                    onClick={() => setShowMap(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', maxWidth: 720, borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                        {/* Modal header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>📍 {selectedSensor.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>
                                    {selectedSensor.lat.toFixed(6)}, {selectedSensor.lng.toFixed(6)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <a
                                    href={`https://www.openstreetmap.org/?mlat=${selectedSensor.lat}&mlon=${selectedSensor.lng}&zoom=16`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: 10, color: 'var(--accent-blue)', textDecoration: 'none' }}>
                                    Abrir en OSM ↗
                                </a>
                                <button onClick={() => setShowMap(false)}
                                    style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', lineHeight: 1 }}>
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Map iframe */}
                        <iframe
                            title="sensor-location"
                            width="100%"
                            height="420"
                            style={{ border: 'none', display: 'block' }}
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedSensor.lng - 0.005},${selectedSensor.lat - 0.003},${selectedSensor.lng + 0.005},${selectedSensor.lat + 0.003}&layer=mapnik&marker=${selectedSensor.lat},${selectedSensor.lng}`}
                        />

                        {/* Footer */}
                        <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                            EUI: {selectedSensor.eui} · devAddr: {selectedSensor.devAddr} · Haz clic fuera del mapa para cerrar
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
