import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import sensors from '../data/sensors';
import { alerts, alertCountsByGroup, type Alert } from '../data/mockData';
import gateways from '../data/gateways';
import {
    catenarySegments, substations, catenaryStats,
    type CatenarySegment, type Substation,
} from '../data/catenary';
import type { Sensor } from '../data/sensors';
import type { Gateway } from '../data/gateways';

// Critical alerts = freefall OR high severity
const criticalAlerts = alerts.filter(a => a.type === 'freefall' || a.severity === 'high');
const freefallAlerts = alerts.filter(a => a.type === 'freefall');

// ── Sensor markers ────────────────────────────────────────────────────────────
function SensorMarkersLayer({ onSelect }: { onSelect: (s: Sensor) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        sensors.forEach(sensor => {
            const el = document.createElement('div');
            el.className = `sensor-marker ${sensor.status}`;
            const icon = L.divIcon({ html: el, className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
            L.marker([sensor.lat, sensor.lng], { icon }).addTo(layer).on('click', () => onSelect(sensor));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

// ── Freefall sonar markers ────────────────────────────────────────────────────
function FreefallMarkersLayer({ onSelect }: { onSelect: (a: Alert) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        freefallAlerts.forEach(alert => {
            const wrapper = document.createElement('div');
            wrapper.className = 'sonar-wrapper';
            wrapper.innerHTML = `
        <div class="sonar-ring"></div>
        <div class="sonar-ring"></div>
        <div class="sonar-ring"></div>
        <div class="sonar-core">!</div>
      `;
            const icon = L.divIcon({ html: wrapper, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
            L.marker([alert.lat, alert.lng], { icon, zIndexOffset: 2000 })
                .addTo(layer)
                .on('click', () => onSelect(alert));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

// ── Motion critical markers ───────────────────────────────────────────────────
function MotionCriticalMarkersLayer({ onSelect }: { onSelect: (a: Alert) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        const motionHigh = alerts.filter(a => a.type === 'motion' && a.severity === 'high');
        motionHigh.forEach(alert => {
            const el = document.createElement('div');
            el.style.cssText = `
        width: 20px; height: 20px; border-radius: 50%;
        background: rgba(245,158,11,0.15); border: 2px solid #f59e0b;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; font-size: 10px; font-weight: 900; color: #f59e0b;
        box-shadow: 0 0 14px #f59e0b88;
        animation: pulse-glow 1.2s infinite;
      `;
            el.innerHTML = '↗';
            const icon = L.divIcon({ html: el, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
            L.marker([alert.lat, alert.lng], { icon, zIndexOffset: 1500 })
                .addTo(layer).on('click', () => onSelect(alert));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

// ── Gateway markers ───────────────────────────────────────────────────────────
function GatewayMarkersLayer({ onSelect }: { onSelect: (g: Gateway) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        gateways.forEach(gw => {
            const color = gw.status === 'active' ? '#00e87a' : gw.status === 'degraded' ? '#f59e0b' : '#555';
            const el = document.createElement('div');
            el.style.cssText = `
        width: 24px; height: 24px; border-radius: 4px;
        background: ${color}18; border: 2px solid ${color}90;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        box-shadow: ${gw.status === 'active' ? `0 0 10px ${color}55` : 'none'};
      `;
            el.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>`;
            const icon = L.divIcon({ html: el, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
            L.marker([gw.lat, gw.lng], { icon, zIndexOffset: 1000 }).addTo(layer).on('click', () => onSelect(gw));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

// ── Catenary lines layer ──────────────────────────────────────────────────────
function CatenaryLinesLayer({ onSelectSegment }: { onSelectSegment: (s: CatenarySegment) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);

        catenarySegments.forEach(seg => {
            if (seg.connected) {
                // Green healthy line
                const line = L.polyline(seg.coords, {
                    color: '#00e87a',
                    weight: seg.cable === 'A' ? 3 : 3,
                    opacity: 0.5,
                    dashArray: seg.cable === 'B' ? '8 4' : undefined,
                    interactive: true,
                }).addTo(layer);
                line.on('click', () => onSelectSegment(seg));
                line.on('mouseover', () => line.setStyle({ opacity: 0.9, weight: 5 }));
                line.on('mouseout', () => line.setStyle({ opacity: 0.5, weight: 3 }));
            } else {
                // Red pulsing disconnected line — we create an outer glow + inner line
                // Glow layer
                const glow = L.polyline(seg.coords, {
                    color: '#ef4444',
                    weight: 10,
                    opacity: 0.3,
                    interactive: false,
                    className: 'catenary-disconnected',
                }).addTo(layer);

                // Main line
                const line = L.polyline(seg.coords, {
                    color: '#ef4444',
                    weight: 4,
                    opacity: 0.9,
                    dashArray: seg.cable === 'B' ? '8 4' : undefined,
                    interactive: true,
                    className: 'catenary-disconnected',
                }).addTo(layer);
                line.on('click', () => onSelectSegment(seg));
                line.on('mouseover', () => {
                    line.setStyle({ weight: 6, opacity: 1 });
                    glow.setStyle({ weight: 14, opacity: 0.5 });
                });
                line.on('mouseout', () => {
                    line.setStyle({ weight: 4, opacity: 0.9 });
                    glow.setStyle({ weight: 10, opacity: 0.3 });
                });
            }
        });

        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

// ── Substation markers ────────────────────────────────────────────────────────
function SubstationMarkersLayer({ onSelect }: { onSelect: (s: Substation) => void }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.layerGroup().addTo(map);
        substations.forEach(sub => {
            const color = sub.status === 'online' ? '#00e87a' : '#ef4444';
            const el = document.createElement('div');
            el.className = 'substation-marker';
            el.style.cssText = `
                width: 20px; height: 20px;
                transform: rotate(45deg);
                background: ${color}22; border: 2px solid ${color};
                display: flex; align-items: center; justify-content: center;
                cursor: pointer;
                box-shadow: 0 0 10px ${color}55, 0 0 20px ${color}22;
                ${sub.status === 'offline' ? 'animation: catenary-pulse 1.2s ease-in-out infinite;' : ''}
            `;
            el.innerHTML = `<svg style="transform:rotate(-45deg)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
            const icon = L.divIcon({ html: el, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
            L.marker([sub.lat, sub.lng], { icon, zIndexOffset: 1500 })
                .addTo(layer).on('click', () => onSelect(sub));
        });
        return () => { layer.clearLayers(); map.removeLayer(layer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

// ── Sensor popup ──────────────────────────────────────────────────────────────
function SensorPopup({ sensor, onClose }: { sensor: Sensor; onClose: () => void }) {
    const c = sensor.status === 'online' ? 'var(--accent-green)' : sensor.status === 'warning' ? 'var(--accent-amber)' : '#555';
    return (
        <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: 80, right: 12, width: 248, padding: 14, zIndex: 1002 }}>
            <Row label={sensor.name} value={<button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>} bold />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 8 }}>{sensor.devAddr}</div>
            {[['Estado', sensor.status.toUpperCase(), c], ['RSSI', `${sensor.signalStrength} dBm`], ['SNR', `${sensor.snr} dB`], ['Batería', `${sensor.batteryLevel}%`], ['Alertas', String(sensor.alertCount)]].map(([l, v, c2]) => (
                <Row key={l as string} label={l as string} value={v as string} color={c2 as string} />
            ))}
        </div>
    );
}

// ── Gateway popup ─────────────────────────────────────────────────────────────
function GatewayPopup({ gw, onClose }: { gw: Gateway; onClose: () => void }) {
    const c = gw.status === 'active' ? 'var(--accent-green)' : gw.status === 'degraded' ? 'var(--accent-amber)' : '#555';
    return (
        <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: 80, right: 12, width: 258, padding: 14, zIndex: 1002 }}>
            <Row label={gw.name} value={<button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>} bold />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 8 }}>{gw.id} · {gw.model}</div>
            {[['Estado', gw.status.toUpperCase(), c], ['IP', gw.ip], ['Sensores', String(gw.connectedSensors)], ['Uptime', gw.uptime], ['RX', gw.rxPackets.toLocaleString()], ['TX', gw.txPackets.toLocaleString()]].map(([l, v, c2]) => (
                <Row key={l as string} label={l as string} value={v as string} color={c2 as string} />
            ))}
        </div>
    );
}

// ── Shared row component ──────────────────────────────────────────────────────
function Row({ label, value, color, bold }: { label: string; value: any; color?: string; bold?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ color: color ?? 'var(--text-primary)', fontWeight: bold ? 700 : 500 }}>{value}</span>
        </div>
    );
}

// ── Critical alert card (always visible) ─────────────────────────────────────
function CriticalAlertCard({ alert, index, onClick }: { alert: Alert; index: number; onClick: () => void }) {
    const isFreefall = alert.type === 'freefall';
    return (
        <div
            onClick={onClick}
            className="animate-critical"
            style={{
                animationDelay: `${index * 0.08}s`,
                opacity: 0,
                width: 228,
                flexShrink: 0,
                padding: '9px 12px',
                borderRadius: 7,
                border: `1px solid ${isFreefall ? '#ef444490' : '#f59e0b70'}`,
                background: isFreefall ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: `0 0 18px ${isFreefall ? '#ef444430' : '#f59e0b25'}, inset 0 0 8px ${isFreefall ? '#ef444410' : '#f59e0b0a'}`,
                transition: 'transform 0.15s, box-shadow 0.15s',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: 1.2,
                    color: isFreefall ? '#ef4444' : '#f59e0b',
                    animation: isFreefall ? 'text-flicker 2.5s infinite' : undefined,
                }}>
                    {isFreefall ? '⚠ CAÍDA LIBRE CRÍTICA' : '⚠ MOVIMIENTO CRÍTICO'}
                </span>
                {isFreefall && (
                    <span style={{ fontSize: 8, color: '#ef4444', border: '1px solid #ef444460', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>
                        FREEFALL
                    </span>
                )}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{alert.sensorName}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{alert.sensorId}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {new Date(alert.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}

// ── Alert list item (right panel) ─────────────────────────────────────────────
function AlertItem({ alert }: { alert: Alert }) {
    const isMotion = alert.type === 'motion';
    const color = isMotion ? 'var(--accent-amber)' : 'var(--accent-red)';
    return (
        <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', background: isMotion ? 'rgba(245,158,11,0.03)' : 'rgba(239,68,68,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color, padding: '2px 5px', borderRadius: 3, border: `1px solid ${color}`, background: `${color}12` }}>
                    {isMotion ? '↗ MOVIM.' : '↓ CAÍDA'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {new Date(alert.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginTop: 4 }}>{alert.sensorName}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {alert.sensorId} · <span style={{ color: alert.severity === 'high' ? 'var(--accent-red)' : alert.severity === 'medium' ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{alert.severity}</span>
            </div>
        </div>
    );
}

// ── Gateway status bar ────────────────────────────────────────────────────────
function GatewayStatusBar({ onGwClick }: { onGwClick: (gw: Gateway) => void }) {
    const active = gateways.filter(g => g.status === 'active').length;
    const degraded = gateways.filter(g => g.status === 'degraded').length;
    const inactive = gateways.filter(g => g.status === 'inactive').length;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0 12px', height: 42, flexShrink: 0, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 14, flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.8 }}>GATEWAYS</span>
            </div>
            <div style={{ display: 'flex', gap: 5, flex: 1 }}>
                {gateways.map(gw => {
                    const col = gw.status === 'active' ? 'var(--accent-green)' : gw.status === 'degraded' ? 'var(--accent-amber)' : '#444';
                    return (
                        <button key={gw.id} onClick={() => onGwClick(gw)} title={`${gw.name} — ${gw.status}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 5, border: `1px solid ${col}40`, background: `${col}10`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, boxShadow: gw.status !== 'inactive' ? `0 0 5px ${col}` : 'none' }} />
                            <span style={{ fontSize: 10, color: col, fontWeight: 500 }}>{gw.id}</span>
                        </button>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginLeft: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: 'var(--accent-green)' }}>{active} activos</span>
                {degraded > 0 && <span style={{ fontSize: 10, color: 'var(--accent-amber)' }}>{degraded} degradados</span>}
                {inactive > 0 && <span style={{ fontSize: 10, color: '#555' }}>{inactive} inactivos</span>}
            </div>
        </div>
    );
}

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
        <div className="glass-card" style={{ padding: '8px 12px', fontSize: 11 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
            {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
        </div>
    );
};

// ── Catenary segment popup ────────────────────────────────────────────────────
function CatenaryPopup({ seg, onClose }: { seg: CatenarySegment; onClose: () => void }) {
    const c = seg.connected ? 'var(--accent-green)' : '#ef4444';
    return (
        <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: 80, left: 12, width: 268, padding: 14, zIndex: 1002, border: `1px solid ${c}60`, boxShadow: seg.connected ? 'none' : '0 0 24px #ef444430' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: c, animation: seg.connected ? undefined : 'text-flicker 2.5s infinite' }}>
                    {seg.connected ? '✓ CATENARIA CONECTADA' : '⚡ CATENARIA DESCONECTADA'}
                </span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
            </div>
            <Row label="Segmento" value={seg.id} />
            <Row label="Cable" value={`Catenaria ${seg.cable}`} />
            <Row label="Estado" value={seg.connected ? 'CONECTADO' : 'DESCONECTADO'} color={c} />
            {seg.disconnectedSince && <Row label="Desde" value={new Date(seg.disconnectedSince).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} color="#ef4444" />}
            {seg.disconnectReason && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, padding: '6px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {seg.disconnectReason}
                </div>
            )}
        </div>
    );
}

// ── Substation popup ──────────────────────────────────────────────────────────
function SubstationPopup({ sub, onClose }: { sub: Substation; onClose: () => void }) {
    const c = sub.status === 'online' ? 'var(--accent-green)' : '#ef4444';
    // Count segments touching this substation
    const touchingSegs = catenarySegments.filter(s => s.fromSubstation === sub.id || s.toSubstation === sub.id);
    const disconnectedSegs = touchingSegs.filter(s => !s.connected);
    return (
        <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: 80, left: 12, width: 258, padding: 14, zIndex: 1002 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{sub.name}</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
            </div>
            <Row label="Estado" value={sub.status.toUpperCase()} color={c} />
            <Row label="Segmentos adyacentes" value={touchingSegs.length} />
            <Row label="Seg. desconectados" value={disconnectedSegs.length} color={disconnectedSegs.length > 0 ? '#ef4444' : 'var(--accent-green)'} />
        </div>
    );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
type MapSel =
    | { kind: 'sensor'; data: Sensor }
    | { kind: 'gateway'; data: Gateway }
    | { kind: 'catenary'; data: CatenarySegment }
    | { kind: 'substation'; data: Substation }
    | null;

export default function Dashboard() {
    const [mapSel, setMapSel] = useState<MapSel>(null);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
    const [activeCritical, setActiveCritical] = useState<Alert | null>(null);

    const visibleCritical = criticalAlerts.filter(a => !dismissedAlerts.has(a.id));
    const hasCritical = visibleCritical.length > 0;

    const motionCount = alerts.filter(a => a.type === 'motion').length;
    const freefallCount = alerts.filter(a => a.type === 'freefall').length;

    return (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

            {/* Screen-edge red vignette when critical alerts exist */}
            {hasCritical && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(239,68,68,0.18) 100%)',
                    animation: 'vignette-pulse 2.5s ease-in-out infinite',
                    borderRadius: 0,
                }} />
            )}

            {/* Gateway bar */}
            <GatewayStatusBar onGwClick={gw => setMapSel({ kind: 'gateway', data: gw })} />

            {/* Main row */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

                {/* Map */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer center={[-33.4489, -70.6693]} zoom={12} style={{ width: '100%', height: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                        <CatenaryLinesLayer onSelectSegment={seg => setMapSel({ kind: 'catenary', data: seg })} />
                        <SubstationMarkersLayer onSelect={sub => setMapSel({ kind: 'substation', data: sub })} />
                        <SensorMarkersLayer onSelect={s => setMapSel({ kind: 'sensor', data: s })} />
                        <FreefallMarkersLayer onSelect={a => setActiveCritical(a)} />
                        <MotionCriticalMarkersLayer onSelect={a => setActiveCritical(a)} />
                        <GatewayMarkersLayer onSelect={gw => setMapSel({ kind: 'gateway', data: gw })} />
                    </MapContainer>

                    {/* Sensor / Gateway popup (top-right corner of map) */}
                    {mapSel?.kind === 'sensor' && <SensorPopup sensor={mapSel.data} onClose={() => setMapSel(null)} />}
                    {mapSel?.kind === 'gateway' && <GatewayPopup gw={mapSel.data} onClose={() => setMapSel(null)} />}
                    {mapSel?.kind === 'catenary' && <CatenaryPopup seg={mapSel.data} onClose={() => setMapSel(null)} />}
                    {mapSel?.kind === 'substation' && <SubstationPopup sub={mapSel.data} onClose={() => setMapSel(null)} />}

                    {/* Clicked critical alert detail (top-left corner of map) */}
                    {activeCritical && (
                        <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: 12, left: 12, width: 260, padding: 14, zIndex: 1002, border: '1px solid #ef444460', boxShadow: '0 0 24px #ef444430' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#ef4444', animation: 'text-flicker 2.5s infinite' }}>
                                    {activeCritical.type === 'freefall' ? '⚠ CAÍDA LIBRE DETECTADA' : '⚠ MOVIMIENTO CRÍTICO'}
                                </span>
                                <button onClick={() => setActiveCritical(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>{activeCritical.sensorName}</div>
                            {[['ID', activeCritical.sensorId], ['Severidad', activeCritical.severity.toUpperCase()], ['Hora', new Date(activeCritical.timestamp).toLocaleTimeString('es-CL')]].map(([l, v]) => (
                                <Row key={l} label={l} value={v} color={l === 'Severidad' ? '#ef4444' : undefined} />
                            ))}
                        </div>
                    )}

                    {/* Always-visible critical alerts strip (bottom of map, above chart) */}
                    {hasCritical && (
                        <div style={{
                            position: 'absolute', bottom: 8, left: 12, right: 12, zIndex: 1001,
                            display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto',
                            paddingBottom: 2,
                        }}>
                            {visibleCritical.map((a, i) => (
                                <CriticalAlertCard
                                    key={a.id}
                                    alert={a}
                                    index={i}
                                    onClick={() => setActiveCritical(a)}
                                />
                            ))}
                            <button
                                onClick={() => setDismissedAlerts(new Set(criticalAlerts.map(a => a.id)))}
                                style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.6)', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', alignSelf: 'flex-end', backdropFilter: 'blur(8px)' }}
                            >
                                ✕ Dismiss all
                            </button>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="glass-card" style={{ position: 'absolute', top: 12, right: mapSel ? 270 : 12, zIndex: 999, padding: '8px 12px' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>LEYENDA</div>
                        {[
                            { label: 'Sensor online', color: 'var(--accent-green)', shape: 'dot' as const },
                            { label: 'Sensor warning', color: 'var(--accent-amber)', shape: 'dot' as const },
                            { label: 'Sensor offline', color: '#3a3a3a', shape: 'dot' as const },
                            { label: 'Gateway activo', color: 'var(--accent-green)', shape: 'square' as const },
                            { label: 'Gateway degradado', color: 'var(--accent-amber)', shape: 'square' as const },
                            { label: 'Gateway inactivo', color: '#444', shape: 'square' as const },
                            { label: 'Alerta caída libre', color: '#ef4444', shape: 'dot' as const },
                            { label: 'Movimiento crítico', color: '#f59e0b', shape: 'dot' as const },
                        ].map(({ label, color, shape }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <div style={{ width: 9, height: 9, borderRadius: shape === 'dot' ? '50%' : 2, background: color, boxShadow: !['#3a3a3a', '#444'].includes(color) ? `0 0 5px ${color}` : 'none', flexShrink: 0 }} />
                                <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</span>
                            </div>
                        ))}
                        {/* Catenary legend */}
                        <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
                            {[
                                { label: 'Catenaria OK', color: 'var(--accent-green)' },
                                { label: 'Catenaria desconectada', color: '#ef4444' },
                                { label: 'Subestación', color: 'var(--accent-green)' },
                            ].map(({ label, color }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    {label.includes('Subestación') ? (
                                        <div style={{ width: 9, height: 9, transform: 'rotate(45deg)', border: `2px solid ${color}`, flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: 14, height: 3, borderRadius: 1, background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0 }} />
                                    )}
                                    <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Alerts panel */}
                <div style={{ width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)' }}>

                    {/* ── Catenary alerts section ──────────────────────────── */}
                    {catenaryStats.disconnected > 0 && (
                        <div style={{
                            borderBottom: '1px solid var(--border)',
                            background: 'rgba(239,68,68,0.04)',
                            flexShrink: 0,
                        }}>
                            <div style={{
                                padding: '8px 12px',
                                display: 'flex', alignItems: 'center', gap: 6,
                                borderBottom: '1px solid rgba(239,68,68,0.15)',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#ef4444', animation: 'text-flicker 2.5s infinite' }}>
                                    CATENARIA
                                </span>
                                <span style={{
                                    marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                                    color: '#ef4444', padding: '2px 6px', borderRadius: 10,
                                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                }}>
                                    {catenaryStats.disconnected} DESCONECTADOS
                                </span>
                            </div>
                            <div style={{ padding: '6px 12px', display: 'flex', gap: 6 }}>
                                <div style={{ flex: 1, padding: '5px 8px', borderRadius: 6, background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.15)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-green)' }}>{catenaryStats.connected}</div>
                                    <div style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 1 }}>CONECTADOS</div>
                                </div>
                                <div style={{ flex: 1, padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', animation: 'text-flicker 2.5s infinite' }}>{catenaryStats.disconnected}</div>
                                    <div style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 1 }}>DESCONECT.</div>
                                </div>
                            </div>
                            {/* Disconnected segment list */}
                            <div style={{ padding: '0 8px 8px' }}>
                                {catenarySegments.filter(s => !s.connected).map(seg => (
                                    <div
                                        key={seg.id}
                                        onClick={() => setMapSel({ kind: 'catenary', data: seg })}
                                        style={{
                                            padding: '7px 10px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
                                            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>
                                                ⚡ Cable {seg.cable} — {seg.id}
                                            </span>
                                            {seg.disconnectedSince && (
                                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                                                    {new Date(seg.disconnectedSince).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        {seg.disconnectReason && (
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
                                                {seg.disconnectReason}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Sensor alerts section ──────────────────────────── */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Alertas entrantes</span>
                            <span style={{ fontSize: 10, color: 'var(--accent-green)', padding: '2px 6px', borderRadius: 10, background: 'rgba(0,232,122,0.1)' }}>{alerts.length}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ flex: 1, padding: '5px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-amber)' }}>{motionCount}</div>
                                <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>MOVIMIENTO</div>
                            </div>
                            <div style={{ flex: 1, padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-red)' }}>{freefallCount}</div>
                                <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>CAÍDA LIBRE</div>
                            </div>
                            <div style={{ flex: 1, padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.05)', border: `1px solid ${hasCritical ? '#ef444460' : 'var(--border)'}`, textAlign: 'center' }}>
                                <div style={{ fontSize: 17, fontWeight: 700, color: '#ef4444', animation: hasCritical ? 'text-flicker 2.5s infinite' : undefined }}>{criticalAlerts.length}</div>
                                <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>CRÍTICAS</div>
                            </div>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
                    </div>
                </div>
            </div>

            {/* Bottom bar chart */}
            <div style={{ height: 168, flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '8px 16px 4px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.8 }}>ALERTAS POR GRUPO DE SENSORES</div>
                <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={alertCountsByGroup} barSize={10} barGap={1}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="group" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                        <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={26} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} iconType="circle" iconSize={6} />
                        <Bar dataKey="motion" name="Movimiento" fill="var(--accent-amber)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="freefall" name="Caída libre" fill="var(--accent-red)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
