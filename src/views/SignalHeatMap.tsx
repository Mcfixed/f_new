import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import sensors from '../data/sensors';
import gateways from '../data/gateways';
import {
    sensorConnections,
    connectionStats,
    getSignalColor,
    getSignalColorByRssi,
    type SensorConnection,
    type SignalQuality,
} from '../data/sensorConnections';
import type { Sensor } from '../data/sensors';
import type { Gateway } from '../data/gateways';

/* ── Connection lines layer ─────────────────────────────────────────────── */
function ConnectionLinesLayer({
    connections,
    onSelectSensor,
}: {
    connections: SensorConnection[];
    onSelectSensor: (c: SensorConnection) => void;
}) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        connections.forEach(c => {
            const color = getSignalColor(c.quality);
            const opacity = c.quality === 'good' ? 0.35 : c.quality === 'fair' ? 0.5 : c.quality === 'poor' ? 0.65 : 0.85;
            const weight = c.quality === 'critical' ? 2 : c.quality === 'poor' ? 1.5 : 1;

            const line = L.polyline(
                [[c.sensorLat, c.sensorLng], [c.gatewayLat, c.gatewayLng]],
                { color, weight, opacity, interactive: true },
            ).addTo(layer);
            line.on('click', () => onSelectSensor(c));
            line.on('mouseover', () => line.setStyle({ weight: weight + 2, opacity: 1 }));
            line.on('mouseout', () => line.setStyle({ weight, opacity }));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
    }, [map, connections, onSelectSensor]);
    return null;
}

/* ── Small sensor dots ──────────────────────────────────────────────────── */
function SensorDotsLayer({ onSelect }: { onSelect: (s: Sensor) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        sensors.forEach(sensor => {
            const color = getSignalColorByRssi(sensor.signalStrength);
            const el = document.createElement('div');
            el.style.cssText = `
                width: 6px; height: 6px; border-radius: 50%;
                background: ${color}; box-shadow: 0 0 4px ${color}88;
                cursor: pointer;
            `;
            const icon = L.divIcon({ html: el, className: '', iconSize: [6, 6], iconAnchor: [3, 3] });
            L.marker([sensor.lat, sensor.lng], { icon }).addTo(layer).on('click', () => onSelect(sensor));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

/* ── Gateway markers ────────────────────────────────────────────────────── */
function GatewayMarkersLayer({ onSelect }: { onSelect: (g: Gateway) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        gateways.forEach(gw => {
            const color = gw.status === 'active' ? '#00e87a' : gw.status === 'degraded' ? '#f59e0b' : '#555';
            const el = document.createElement('div');
            el.style.cssText = `
                width: 26px; height: 26px; border-radius: 5px;
                background: ${color}18; border: 2px solid ${color}aa;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer;
                box-shadow: ${gw.status === 'active' ? `0 0 12px ${color}55` : 'none'};
            `;
            el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>`;
            const icon = L.divIcon({ html: el, className: '', iconSize: [26, 26], iconAnchor: [13, 13] });
            L.marker([gw.lat, gw.lng], { icon, zIndexOffset: 1000 }).addTo(layer).on('click', () => onSelect(gw));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

/* ── Row helper ─────────────────────────────────────────────────────────── */
function Row({ label, value, color }: { label: string; value: any; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ color: color ?? 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
        </div>
    );
}

/* ── Filter badge ───────────────────────────────────────────────────────── */
function FilterBadge({
    label, count, color, active, onClick,
}: {
    label: string; count: number; color: string; active: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                border: `1px solid ${active ? color : 'var(--border)'}`,
                background: active ? `${color}18` : 'transparent',
                color: active ? color : 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
            }}
        >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            {label}
            <span style={{ opacity: 0.7 }}>({count})</span>
        </button>
    );
}

/* ── Main component ─────────────────────────────────────────────────────── */
type Selection =
    | { kind: 'sensor'; data: Sensor; connection: SensorConnection }
    | { kind: 'gateway'; data: Gateway }
    | null;

export default function SignalHeatMap() {
    const [selection, setSelection] = useState<Selection>(null);
    const [activeQualities, setActiveQualities] = useState<Set<SignalQuality>>(
        new Set(['good', 'fair', 'poor', 'critical']),
    );
    const [activeGateway, setActiveGateway] = useState<string | null>(null);

    const toggleQuality = (q: SignalQuality) => {
        setActiveQualities(prev => {
            const next = new Set(prev);
            if (next.has(q)) next.delete(q); else next.add(q);
            return next;
        });
    };

    const filteredConnections = useMemo(() => {
        return sensorConnections.filter(c => {
            if (!activeQualities.has(c.quality)) return false;
            if (activeGateway && c.gatewayId !== activeGateway) return false;
            return true;
        });
    }, [activeQualities, activeGateway]);

    const handleSensorClick = (sensor: Sensor) => {
        const conn = sensorConnections.find(c => c.sensorId === sensor.id);
        if (conn) setSelection({ kind: 'sensor', data: sensor, connection: conn });
    };

    const handleConnectionClick = (conn: SensorConnection) => {
        const sensor = sensors.find(s => s.id === conn.sensorId);
        if (sensor) setSelection({ kind: 'sensor', data: sensor, connection: conn });
    };

    const handleGatewayClick = (gw: Gateway) => {
        setSelection({ kind: 'gateway', data: gw });
    };

    const gwConnCounts = useMemo(() => {
        const map: Record<string, { total: number; poor: number }> = {};
        sensorConnections.forEach(c => {
            if (!map[c.gatewayId]) map[c.gatewayId] = { total: 0, poor: 0 };
            map[c.gatewayId].total++;
            if (c.quality === 'poor' || c.quality === 'critical') map[c.gatewayId].poor++;
        });
        return map;
    }, []);

    return (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

            {/* ── Top stat bar ──────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 14px', height: 44, flexShrink: 0,
                background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
                overflowX: 'auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-primary)' }}>
                        MAPA DE SEÑAL
                    </span>
                </div>

                <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

                {/* Stats */}
                {[
                    { label: 'Sensores', value: connectionStats.total, color: 'var(--text-primary)' },
                    { label: 'RSSI Prom.', value: `${connectionStats.avgRssi} dBm`, color: getSignalColorByRssi(connectionStats.avgRssi) },
                    { label: 'Buena', value: connectionStats.good, color: '#00e87a' },
                    { label: 'Regular', value: connectionStats.fair, color: '#f5c542' },
                    { label: 'Pobre', value: connectionStats.poor, color: '#f59e0b' },
                    { label: 'Crítica', value: connectionStats.critical, color: '#ef4444' },
                ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{s.label.toUpperCase()}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                ))}

                <div style={{ flex: 1 }} />

                {/* Gateway filter chips */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                        onClick={() => setActiveGateway(null)}
                        style={{
                            padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600,
                            border: `1px solid ${!activeGateway ? 'var(--accent-green)' : 'var(--border)'}`,
                            background: !activeGateway ? 'rgba(0,232,122,0.08)' : 'transparent',
                            color: !activeGateway ? 'var(--accent-green)' : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                    >
                        Todos
                    </button>
                    {gateways.filter(g => g.status !== 'inactive').map(gw => {
                        const isActive = activeGateway === gw.id;
                        const col = gw.status === 'active' ? 'var(--accent-green)' : 'var(--accent-amber)';
                        return (
                            <button
                                key={gw.id}
                                onClick={() => setActiveGateway(isActive ? null : gw.id)}
                                title={gw.name}
                                style={{
                                    padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600,
                                    border: `1px solid ${isActive ? col : 'var(--border)'}`,
                                    background: isActive ? `${col === 'var(--accent-green)' ? 'rgba(0,232,122,0.08)' : 'rgba(245,158,11,0.08)'}` : 'transparent',
                                    color: isActive ? col : 'var(--text-muted)',
                                    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                                }}
                            >
                                {gw.id}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Map area ──────────────────────────────────────────────────── */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={[-33.4489, -70.6693]} zoom={12} style={{ width: '100%', height: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    <ConnectionLinesLayer connections={filteredConnections} onSelectSensor={handleConnectionClick} />
                    <SensorDotsLayer onSelect={handleSensorClick} />
                    <GatewayMarkersLayer onSelect={handleGatewayClick} />
                </MapContainer>

                {/* ── Signal quality filter (top-left) ───────────────────────── */}
                <div className="glass-card" style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 999,
                    padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 2 }}>
                        FILTRAR POR SEÑAL
                    </div>
                    {([
                        { q: 'good' as SignalQuality, label: 'Buena (> -80)', color: '#00e87a', count: connectionStats.good },
                        { q: 'fair' as SignalQuality, label: 'Regular (-80 a -100)', color: '#f5c542', count: connectionStats.fair },
                        { q: 'poor' as SignalQuality, label: 'Pobre (-100 a -115)', color: '#f59e0b', count: connectionStats.poor },
                        { q: 'critical' as SignalQuality, label: 'Crítica (< -115)', color: '#ef4444', count: connectionStats.critical },
                    ]).map(({ q, label, color, count }) => (
                        <FilterBadge
                            key={q}
                            label={label}
                            count={count}
                            color={color}
                            active={activeQualities.has(q)}
                            onClick={() => toggleQuality(q)}
                        />
                    ))}
                </div>

                {/* ── Legend (bottom-left) ────────────────────────────────────── */}
                <div className="glass-card" style={{
                    position: 'absolute', bottom: 12, left: 12, zIndex: 999,
                    padding: '10px 14px',
                }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8 }}>
                        CALIDAD DE SEÑAL (RSSI)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        {/* Gradient bar */}
                        <div style={{
                            width: 160, height: 10, borderRadius: 5,
                            background: 'linear-gradient(to right, #ef4444, #f59e0b, #f5c542, #00e87a)',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, width: 160 }}>
                        <span style={{ fontSize: 8, color: '#ef4444' }}>-130</span>
                        <span style={{ fontSize: 8, color: '#f59e0b' }}>-115</span>
                        <span style={{ fontSize: 8, color: '#f5c542' }}>-100</span>
                        <span style={{ fontSize: 8, color: '#00e87a' }}>-80</span>
                        <span style={{ fontSize: 8, color: '#00e87a' }}>-65</span>
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center', width: 160 }}>
                        dBm — mayor es mejor
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[
                            { label: 'Sensor', shape: 'circle' as const, color: 'var(--text-muted)' },
                            { label: 'Gateway', shape: 'square' as const, color: 'var(--accent-green)' },
                            { label: 'Conexión sensor→gateway', shape: 'line' as const, color: 'var(--text-muted)' },
                        ].map(({ label, shape, color }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {shape === 'circle' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />}
                                {shape === 'square' && <div style={{ width: 8, height: 8, borderRadius: 2, border: `2px solid ${color}`, flexShrink: 0 }} />}
                                {shape === 'line' && <div style={{ width: 14, height: 2, background: color, borderRadius: 1, flexShrink: 0 }} />}
                                <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Showing count badge (bottom-right) ─────────────────────── */}
                <div className="glass-card" style={{
                    position: 'absolute', bottom: 12, right: 12, zIndex: 999,
                    padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Mostrando</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>
                        {filteredConnections.length}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>de {sensorConnections.length} conexiones</span>
                </div>

                {/* ── Selection popup (top-right) ────────────────────────────── */}
                {selection?.kind === 'sensor' && (
                    <div className="glass-card animate-fade-in" style={{
                        position: 'absolute', top: 12, right: 12, width: 260, padding: 14, zIndex: 1002,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{selection.data.name}</span>
                            <button onClick={() => setSelection(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 8 }}>
                            {selection.data.devAddr}
                        </div>
                        <Row label="RSSI" value={`${selection.data.signalStrength} dBm`} color={getSignalColorByRssi(selection.data.signalStrength)} />
                        <Row label="SNR" value={`${selection.data.snr} dB`} />
                        <Row label="Calidad" value={selection.connection.quality.toUpperCase()} color={getSignalColor(selection.connection.quality)} />
                        <Row label="Gateway" value={selection.connection.gatewayName} />
                        <Row label="Batería" value={`${selection.data.batteryLevel}%`} />
                        <Row label="Estado" value={selection.data.status.toUpperCase()} color={
                            selection.data.status === 'online' ? 'var(--accent-green)' : selection.data.status === 'warning' ? 'var(--accent-amber)' : '#555'
                        } />
                    </div>
                )}

                {selection?.kind === 'gateway' && (
                    <div className="glass-card animate-fade-in" style={{
                        position: 'absolute', top: 12, right: 12, width: 260, padding: 14, zIndex: 1002,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{selection.data.name}</span>
                            <button onClick={() => setSelection(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 8 }}>
                            {selection.data.id} · {selection.data.model}
                        </div>
                        <Row label="Estado" value={selection.data.status.toUpperCase()} color={
                            selection.data.status === 'active' ? 'var(--accent-green)' : selection.data.status === 'degraded' ? 'var(--accent-amber)' : '#555'
                        } />
                        <Row label="Sensores conectados" value={gwConnCounts[selection.data.id]?.total ?? 0} />
                        <Row label="Señal pobre/crítica" value={gwConnCounts[selection.data.id]?.poor ?? 0} color={
                            (gwConnCounts[selection.data.id]?.poor ?? 0) > 0 ? 'var(--accent-red)' : 'var(--accent-green)'
                        } />
                        <Row label="IP" value={selection.data.ip} />
                        <Row label="Uptime" value={selection.data.uptime} />
                    </div>
                )}
            </div>
        </div>
    );
}
