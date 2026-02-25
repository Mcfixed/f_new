import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import sensors from '../data/sensors';
import { generatePacketsForSensor } from '../data/mockData';
import type { Sensor } from '../data/sensors';

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

export default function SensorSearch() {
    const [query, setQuery] = useState('');
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

    const filtered = useMemo(() => {
        if (!query.trim()) return sensors.slice(0, 30);
        const q = query.toLowerCase();
        return sensors.filter(
            s =>
                s.id.toLowerCase().includes(q) ||
                s.name.toLowerCase().includes(q) ||
                s.eui.toLowerCase().includes(q) ||
                s.devAddr.toLowerCase().includes(q)
        );
    }, [query]);

    const packets = useMemo(
        () => (selectedSensor ? generatePacketsForSensor(selectedSensor.id) : []),
        [selectedSensor]
    );

    const chartData = packets.map(p => ({
        time: new Date(p.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        rssi: p.rssi,
        snr: p.snr,
        battery: p.battery,
    }));

    const statusColor = (s: Sensor) =>
        s.status === 'online'
            ? 'var(--accent-green)'
            : s.status === 'warning'
                ? 'var(--accent-amber)'
                : '#555';

    const typeColor = (t: string) =>
        t === 'freefall'
            ? 'var(--accent-red)'
            : t === 'motion'
                ? 'var(--accent-amber)'
                : 'var(--text-muted)';

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* Left: search + sensor list */}
            <div
                style={{
                    width: 300,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                }}
            >
                {/* Search box */}
                <div style={{ padding: 12, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, ID, EUI o devAddr…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px 9px 36px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                color: 'var(--text-primary)',
                                fontSize: 12,
                                outline: 'none',
                                transition: 'border-color 0.15s',
                                boxSizing: 'border-box',
                            }}
                            onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--accent-green)')}
                            onBlur={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--border)')}
                        />
                        <span
                            style={{
                                position: 'absolute',
                                left: 11,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                fontSize: 14,
                            }}
                        >
                            🔍
                        </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                        {filtered.length} sensor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        {!query && ' (mostrando primeros 30)'}
                    </div>
                </div>

                {/* Sensor list */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {filtered.map(sensor => (
                        <div
                            key={sensor.id}
                            onClick={() => setSelectedSensor(sensor.id === selectedSensor?.id ? null : sensor)}
                            className="glass-card-hover"
                            style={{
                                margin: '4px 8px',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                background: selectedSensor?.id === sensor.id ? 'rgba(0,232,122,0.06)' : 'var(--bg-card)',
                                borderLeft: selectedSensor?.id === sensor.id
                                    ? '2px solid var(--accent-green)'
                                    : '2px solid transparent',
                                borderRadius: 6,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{sensor.name}</span>
                                <div className={`status-dot ${sensor.status}`} />
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' }}>
                                {sensor.devAddr}
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: 'var(--accent-blue)' }}>{sensor.signalStrength} dBm</span>
                                <span style={{ fontSize: 10, color: 'var(--accent-green)' }}>{sensor.snr} dB</span>
                                <span style={{ fontSize: 10, color: sensor.batteryLevel < 30 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                                    🔋 {sensor.batteryLevel}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: sensor details */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedSensor ? (
                    <>
                        {/* Sensor header info */}
                        <div className="glass-card" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>{selectedSensor.name}</h2>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                                        EUI: {selectedSensor.eui}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: statusColor(selectedSensor),
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        border: `1px solid ${statusColor(selectedSensor)}`,
                                        background: `${statusColor(selectedSensor)}15`,
                                    }}
                                >
                                    {selectedSensor.status.toUpperCase()}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 12,
                                    marginTop: 16,
                                }}
                            >
                                {[
                                    { label: 'devAddr', value: selectedSensor.devAddr, mono: true },
                                    { label: 'Firmware', value: selectedSensor.firmware },
                                    { label: 'Batería', value: `${selectedSensor.batteryLevel}%` },
                                    {
                                        label: 'Último reporte',
                                        value: new Date(selectedSensor.lastSeen).toLocaleString('es-CL', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }),
                                    },
                                    { label: 'RSSI prom.', value: `${selectedSensor.signalStrength} dBm` },
                                    { label: 'SNR prom.', value: `${selectedSensor.snr} dB` },
                                    { label: 'Alertas totales', value: String(selectedSensor.alertCount) },
                                    {
                                        label: 'Coordenadas',
                                        value: `${selectedSensor.lat.toFixed(5)}, ${selectedSensor.lng.toFixed(5)}`,
                                    },
                                ].map(row => (
                                    <div key={row.label}>
                                        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 2 }}>
                                            {row.label.toUpperCase()}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--text-primary)',
                                                fontFamily: row.mono ? 'monospace' : undefined,
                                            }}
                                        >
                                            {row.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="glass-card" style={{ padding: '14px 16px 8px' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.8, marginBottom: 8 }}>
                                RSSI & SNR — ÚLTIMAS 24H
                            </div>
                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={chartData}>
                                    <CartesianGrid stroke="var(--border)" />
                                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="rssi" name="RSSI" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="snr" name="SNR" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Packets table */}
                        <div className="glass-card" style={{ overflow: 'hidden' }}>
                            <div
                                style={{
                                    padding: '10px 16px',
                                    borderBottom: '1px solid var(--border)',
                                    fontSize: 10,
                                    color: 'var(--text-muted)',
                                    letterSpacing: 0.8,
                                    fontWeight: 600,
                                }}
                            >
                                PAQUETES RECIBIDOS
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                    <thead>
                                        <tr>
                                            {['#', 'Timestamp', 'Tipo', 'RSSI', 'SNR', 'Payload', 'Batería', 'Frame'].map(col => (
                                                <th
                                                    key={col}
                                                    style={{
                                                        padding: '8px 12px',
                                                        textAlign: 'left',
                                                        fontSize: 9,
                                                        fontWeight: 600,
                                                        color: 'var(--text-muted)',
                                                        borderBottom: '1px solid var(--border)',
                                                        letterSpacing: 0.8,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packets.map((p, i) => (
                                            <tr
                                                key={p.id}
                                                style={{
                                                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                                                    borderBottom: '1px solid var(--border)',
                                                }}
                                            >
                                                <td style={{ padding: '7px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10 }}>
                                                    {i + 1}
                                                </td>
                                                <td style={{ padding: '7px 12px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}>
                                                    {new Date(p.timestamp).toLocaleString('es-CL', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td style={{ padding: '7px 12px' }}>
                                                    <span
                                                        style={{
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            color: typeColor(p.type),
                                                            padding: '2px 6px',
                                                            borderRadius: 4,
                                                            border: `1px solid ${typeColor(p.type)}`,
                                                            background: `${typeColor(p.type)}15`,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {p.type === 'heartbeat' ? 'HEARTBEAT' : p.type === 'motion' ? '↗ MOVIM.' : '↓ CAÍDA'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '7px 12px', color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: 10 }}>
                                                    {p.rssi} dBm
                                                </td>
                                                <td style={{ padding: '7px 12px', color: 'var(--accent-green)', fontFamily: 'monospace', fontSize: 10 }}>
                                                    {p.snr} dB
                                                </td>
                                                <td style={{ padding: '7px 12px', color: 'var(--text-secondary)', fontSize: 10 }}>
                                                    {p.payloadSize} B
                                                </td>
                                                <td style={{ padding: '7px 12px', color: p.battery < 30 ? 'var(--accent-red)' : 'var(--text-secondary)', fontSize: 10 }}>
                                                    {p.battery}%
                                                </td>
                                                <td style={{ padding: '7px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10 }}>
                                                    {p.frameCounter}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            gap: 12,
                        }}
                    >
                        <div style={{ fontSize: 40 }}>🔍</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>Selecciona un sensor</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Busca y selecciona un sensor para ver sus datos y paquetes recibidos.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
