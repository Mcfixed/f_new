import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ZAxis,
} from 'recharts';
import { sensorSignalSummaries, generatePacketsForSensor } from '../data/mockData';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
            }}
        >
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.name} style={{ color: p.color }}>
                    {p.name}: {p.value}
                </div>
            ))}
        </div>
    );
};

const ScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;
    const d = payload[0].payload;
    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
            }}
        >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.sensorName}</div>
            <div style={{ color: 'var(--accent-blue)' }}>RSSI: {d.avgRssi} dBm</div>
            <div style={{ color: 'var(--accent-green)' }}>SNR: {d.avgSnr} dB</div>
        </div>
    );
};

type SortKey = 'avgSnr' | 'avgRssi' | 'sensorId';

export default function SignalView() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('avgSnr');
    const [sortAsc, setSortAsc] = useState(false);

    const sortedSensors = useMemo(() => {
        return [...sensorSignalSummaries].sort((a, b) => {
            const av = a[sortKey] as any;
            const bv = b[sortKey] as any;
            return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
    }, [sortKey, sortAsc]);

    const packets = useMemo(
        () => (selectedId ? generatePacketsForSensor(selectedId) : []),
        [selectedId]
    );

    const chartData = packets.map(p => ({
        time: new Date(p.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        rssi: p.rssi,
        snr: p.snr,
    }));

    const selected = selectedId
        ? sensorSignalSummaries.find(s => s.sensorId === selectedId)
        : null;

    // Stats
    const onlineSensors = sensorSignalSummaries.filter(s => s.status === 'online');
    const avgRssi = Math.round(
        onlineSensors.reduce((acc, s) => acc + s.avgRssi, 0) / (onlineSensors.length || 1)
    );
    const avgSnr = (
        onlineSensors.reduce((acc, s) => acc + s.avgSnr, 0) / (onlineSensors.length || 1)
    ).toFixed(1);
    const worstSnr = [...sensorSignalSummaries].sort((a, b) => a.avgSnr - b.avgSnr)[0];
    const worstRssi = [...sensorSignalSummaries].sort((a, b) => a.avgRssi - b.avgRssi)[0];

    const qualityColor = (rssi: number) =>
        rssi > -80 ? 'var(--accent-green)' : rssi > -100 ? 'var(--accent-amber)' : 'var(--accent-red)';
    const snrColor = (snr: number) =>
        snr > 5 ? 'var(--accent-green)' : snr > 0 ? 'var(--accent-amber)' : 'var(--accent-red)';

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(p => !p);
        else { setSortKey(key); setSortAsc(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Stat cards */}
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    flexShrink: 0,
                }}
            >
                {[
                    { label: 'RSSI Promedio', value: `${avgRssi} dBm`, color: qualityColor(avgRssi) },
                    { label: 'SNR Promedio', value: `${avgSnr} dB`, color: snrColor(parseFloat(avgSnr)) },
                    { label: 'Peor SNR', value: `${worstSnr?.sensorName ?? '–'} (${worstSnr?.avgSnr} dB)`, color: 'var(--accent-red)' },
                    { label: 'Peor RSSI', value: `${worstRssi?.sensorName ?? '–'} (${worstRssi?.avgRssi} dBm)`, color: 'var(--accent-red)' },
                ].map(({ label, value, color }) => (
                    <div
                        key={label}
                        className="glass-card"
                        style={{ flex: 1, padding: '12px 16px' }}
                    >
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 6 }}>
                            {label.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Main content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sensor list */}
                <div
                    style={{
                        width: 240,
                        borderRight: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-surface)',
                        flexShrink: 0,
                    }}
                >
                    {/* Sort controls */}
                    <div
                        style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            gap: 4,
                            flexShrink: 0,
                        }}
                    >
                        {([['avgSnr', 'SNR'], ['avgRssi', 'RSSI']] as [SortKey, string][]).map(([k, label]) => (
                            <button
                                key={k}
                                onClick={() => toggleSort(k)}
                                style={{
                                    flex: 1,
                                    padding: '4px 0',
                                    borderRadius: 4,
                                    border: `1px solid ${sortKey === k ? 'var(--accent-green)' : 'var(--border)'}`,
                                    background: sortKey === k ? 'rgba(0,232,122,0.08)' : 'transparent',
                                    color: sortKey === k ? 'var(--accent-green)' : 'var(--text-muted)',
                                    fontSize: 10,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {sortedSensors.map(s => (
                            <div
                                key={s.sensorId}
                                onClick={() => setSelectedId(s.sensorId === selectedId ? null : s.sensorId)}
                                style={{
                                    padding: '8px 10px',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    background:
                                        s.sensorId === selectedId
                                            ? 'rgba(0,232,122,0.05)'
                                            : 'transparent',
                                    borderLeft: s.sensorId === selectedId
                                        ? '2px solid var(--accent-green)'
                                        : '2px solid transparent',
                                    transition: 'background 0.1s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 500 }}>{s.sensorName}</span>
                                    <div className={`status-dot ${s.status}`} />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                    <span style={{ fontSize: 10, color: qualityColor(s.avgRssi) }}>
                                        {s.avgRssi} dBm
                                    </span>
                                    <span style={{ fontSize: 10, color: snrColor(s.avgSnr) }}>
                                        {s.avgSnr} dB
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel */}
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        padding: 16,
                    }}
                >
                    {selected ? (
                        <>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {selected.sensorName}
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                                    — últimas 24 horas
                                </span>
                            </div>

                            {/* RSSI chart */}
                            <div className="glass-card" style={{ padding: '14px 16px 8px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 8 }}>
                                    RSSI (dBm)
                                </div>
                                <ResponsiveContainer width="100%" height={130}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid stroke="var(--border)" />
                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={40} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="rssi" name="RSSI" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* SNR chart */}
                            <div className="glass-card" style={{ padding: '14px 16px 8px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 8 }}>
                                    SNR (dB)
                                </div>
                                <ResponsiveContainer width="100%" height={130}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid stroke="var(--border)" />
                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={40} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="snr" name="SNR" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                                Selecciona un sensor para ver sus gráficos. Mostrando distribución de toda la red:
                            </div>
                            <div className="glass-card" style={{ padding: '14px 16px 8px', flex: 1 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 8 }}>
                                    DISPERSIÓN RSSI vs SNR — TODOS LOS SENSORES
                                </div>
                                <ResponsiveContainer width="100%" height={420}>
                                    <ScatterChart>
                                        <CartesianGrid stroke="var(--border)" />
                                        <XAxis
                                            dataKey="avgRssi"
                                            name="RSSI"
                                            unit=" dBm"
                                            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                            label={{ value: 'RSSI (dBm)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 10 }}
                                        />
                                        <YAxis
                                            dataKey="avgSnr"
                                            name="SNR"
                                            unit=" dB"
                                            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={40}
                                        />
                                        <ZAxis range={[30, 30]} />
                                        <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} />
                                        <Scatter
                                            name="Online"
                                            data={sensorSignalSummaries.filter(s => s.status === 'online')}
                                            fill="var(--accent-green)"
                                            fillOpacity={0.7}
                                        />
                                        <Scatter
                                            name="Warning"
                                            data={sensorSignalSummaries.filter(s => s.status === 'warning')}
                                            fill="var(--accent-amber)"
                                            fillOpacity={0.7}
                                        />
                                        <Scatter
                                            name="Offline"
                                            data={sensorSignalSummaries.filter(s => s.status === 'offline')}
                                            fill="#555"
                                            fillOpacity={0.5}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
