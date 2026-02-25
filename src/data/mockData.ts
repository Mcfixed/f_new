import sensors from './sensors';

export type AlertType = 'motion' | 'freefall';
export type LogLevel = 'info' | 'warning' | 'error';

export interface Alert {
    id: string;
    sensorId: string;
    sensorName: string;
    type: AlertType;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    lat: number;
    lng: number;
}

export interface GatewayReception {
    gatewayId: string;
    gatewayName: string;
    rssi: number;
    snr: number;
}

export interface Packet {
    id: string;
    sensorId: string;
    timestamp: string;
    rssi: number;      // best gateway
    snr: number;       // best gateway
    payloadSize: number;
    battery: number;
    type: AlertType | 'heartbeat';
    frameCounter: number;
    gateways: GatewayReception[];
}

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    message: string;
    source: string;
}

function rng(seed: number): number {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

function offsetDate(baseIso: string, minutes: number): string {
    const d = new Date(baseIso);
    d.setMinutes(d.getMinutes() - minutes);
    return d.toISOString();
}

const BASE_TIME = '2026-02-25T01:21:29.000Z';

// ── Alerts ─────────────────────────────────────────────────────────────────
const ALERT_COUNT = 60;
export const alerts: Alert[] = Array.from({ length: ALERT_COUNT }, (_, i) => {
    const sensorIdx = Math.floor(rng(i * 7.1) * 250);
    const sensor = sensors[sensorIdx];
    const type: AlertType = rng(i * 3.3) > 0.35 ? 'motion' : 'freefall';
    const severityRoll = rng(i * 5.7);
    const severity: Alert['severity'] = severityRoll > 0.7 ? 'high' : severityRoll > 0.35 ? 'medium' : 'low';
    return {
        id: `ALRT-${String(i + 1).padStart(4, '0')}`,
        sensorId: sensor.id,
        sensorName: sensor.name,
        type,
        timestamp: offsetDate(BASE_TIME, Math.round(rng(i * 9.1) * 240)),
        severity,
        lat: sensor.lat,
        lng: sensor.lng,
    };
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const GW_POOL = [
    { id: 'GW-001', name: 'GW Norte' },
    { id: 'GW-002', name: 'GW Sur' },
    { id: 'GW-003', name: 'GW Este' },
    { id: 'GW-004', name: 'GW Oeste' },
    { id: 'GW-005', name: 'GW Centro' },
    { id: 'GW-006', name: 'GW Bodega' },
    { id: 'GW-007', name: 'GW Patio' },
    { id: 'GW-008', name: 'GW Techo' },
    { id: 'GW-009', name: 'GW Subestación' },
    { id: 'GW-010', name: 'GW Portería' },
];

// ── Packets per sensor (last 24h) ──────────────────────────────────────────
export function generatePacketsForSensor(sensorId: string): Packet[] {
    const sensor = sensors.find(s => s.id === sensorId);
    if (!sensor) return [];
    const baseRssi = sensor.signalStrength;
    const baseSnr = sensor.snr;
    return Array.from({ length: 24 }, (_, i) => {
        const jitter = (rng((sensor.alertCount + 1) * i * 2.9) - 0.5) * 8;
        const snrJitter = (rng((sensor.alertCount + 1) * i * 1.7) - 0.5) * 4;
        const typeRoll = rng(i * 4.4 + sensor.alertCount);
        const pktType: Packet['type'] =
            typeRoll > 0.85 ? 'motion' : typeRoll > 0.7 ? 'freefall' : 'heartbeat';

        // How many gateways received this packet (1–3)
        const gwCount = 1 + Math.floor(rng(i * 3.6 + sensor.alertCount * 1.1) * 3);
        // Pick distinct gateway indices deterministically
        const gwIndices = new Set<number>();
        let attempt = 0;
        while (gwIndices.size < gwCount) {
            gwIndices.add(Math.floor(rng(i * 7.1 + attempt++ * 2.3) * GW_POOL.length));
        }
        const gatewayReceptions: GatewayReception[] = [...gwIndices].map((gwIdx, gi) => {
            const gwRssiJitter = (rng(i * 5.3 + gi * 3.7) - 0.5) * 16;
            const gwSnrJitter = (rng(i * 2.7 + gi * 4.1) - 0.5) * 5;
            return {
                gatewayId: GW_POOL[gwIdx].id,
                gatewayName: GW_POOL[gwIdx].name,
                rssi: Math.round(Math.max(-135, Math.min(-50, baseRssi + jitter + gwRssiJitter))),
                snr: parseFloat(Math.max(-15, Math.min(15, baseSnr + snrJitter + gwSnrJitter)).toFixed(1)),
            };
        }).sort((a, b) => b.rssi - a.rssi); // best RSSI first

        const bestGw = gatewayReceptions[0];
        return {
            id: `PKT-${sensorId}-${String(i + 1).padStart(3, '0')}`,
            sensorId,
            timestamp: offsetDate(BASE_TIME, (23 - i) * 60),
            rssi: bestGw.rssi,
            snr: bestGw.snr,
            payloadSize: Math.round(12 + rng(i * 6.1) * 20),
            battery: Math.max(5, sensor.batteryLevel - Math.round(rng(i * 8.3) * 5)),
            type: pktType,
            frameCounter: i + 1,
            gateways: gatewayReceptions,
        };
    });
}

// ── Pre-generate signal data for all sensors (for scatter/overview charts) ─
export interface SensorSignalSummary {
    sensorId: string;
    sensorName: string;
    avgRssi: number;
    avgSnr: number;
    minRssi: number;
    maxRssi: number;
    status: string;
}

export const sensorSignalSummaries: SensorSignalSummary[] = sensors.map(s => ({
    sensorId: s.id,
    sensorName: s.name,
    avgRssi: s.signalStrength,
    avgSnr: s.snr,
    minRssi: s.signalStrength - Math.round(rng(s.alertCount * 3.1) * 10),
    maxRssi: s.signalStrength + Math.round(rng(s.alertCount * 2.7) * 8),
    status: s.status,
}));

// ── Alert counts by sensor group (for bar chart) ───────────────────────────
export interface AlertGroupCount {
    group: string;
    motion: number;
    freefall: number;
}

export const alertCountsByGroup: AlertGroupCount[] = Array.from({ length: 25 }, (_, gi) => {
    const groupSensors = sensors.slice(gi * 10, gi * 10 + 10);
    let motion = 0;
    let freefall = 0;
    groupSensors.forEach(s => {
        const half = Math.round(s.alertCount * (0.4 + rng(s.alertCount) * 0.4));
        motion += half;
        freefall += s.alertCount - half;
    });
    return {
        group: `S${gi * 10 + 1}-${gi * 10 + 10}`,
        motion,
        freefall,
    };
});

// ── System Logs ────────────────────────────────────────────────────────────
const LOG_MESSAGES: { level: LogLevel; messages: string[]; source: string }[] = [
    {
        level: 'info',
        source: 'NetworkServer',
        messages: [
            'LoRaWAN join accepted for device {eui}',
            'Downlink scheduled for {sensor}',
            'ADR adjustment applied to {sensor}: SF changed to SF9',
            'Gateway heartbeat received from GW-001',
            'Channel plan updated: 8 channels active',
            'New device onboarded: {sensor}',
            'Packet received from {sensor} — RSSI: {rssi} dBm',
            'Frame counter reset for {sensor}',
        ],
    },
    {
        level: 'warning',
        source: 'AlertEngine',
        messages: [
            'Low battery detected on {sensor}: {bat}%',
            '{sensor} has not reported in 60 minutes',
            'High packet loss rate on {sensor}: 22%',
            'SNR below threshold on {sensor}: {snr} dB',
            'Duplicate uplink detected from {sensor}',
        ],
    },
    {
        level: 'error',
        source: 'AlertEngine',
        messages: [
            'Freefall event confirmed on {sensor}',
            'Motion alert unacknowledged on {sensor} for 15 min',
            '{sensor} went offline unexpectedly',
            'MIC check failed for packet from {sensor}',
            'Join request rejected — wrong AppKey for {sensor}',
        ],
    },
    {
        level: 'info',
        source: 'System',
        messages: [
            'Scheduler job completed: cleanup ran on 250 sensors',
            'Configuration snapshot saved',
            'API rate limit reset',
            'Database backup completed successfully',
            'Firmware update available: v2.3.1 for 14 sensors',
        ],
    },
];

function buildLogMessage(template: string, sensor: typeof sensors[0]): string {
    return template
        .replace('{sensor}', sensor.name)
        .replace('{eui}', sensor.eui)
        .replace('{rssi}', String(sensor.signalStrength))
        .replace('{snr}', String(sensor.snr))
        .replace('{bat}', String(sensor.batteryLevel));
}

export const systemLogs: LogEntry[] = Array.from({ length: 120 }, (_, i) => {
    const groupIdx = Math.floor(rng(i * 4.7) * LOG_MESSAGES.length);
    const group = LOG_MESSAGES[groupIdx];
    const msgIdx = Math.floor(rng(i * 6.3) * group.messages.length);
    const sensorIdx = Math.floor(rng(i * 2.9) * 250);
    const sensor = sensors[sensorIdx];
    return {
        id: `LOG-${String(i + 1).padStart(4, '0')}`,
        timestamp: offsetDate(BASE_TIME, Math.round(rng(i * 11.3) * 720)),
        level: group.level,
        message: buildLogMessage(group.messages[msgIdx], sensor),
        source: group.source,
    };
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// ── Live log simulation ────────────────────────────────────────────────────
let liveLogCounter = 121;
export function generateLiveLog(): LogEntry {
    const i = liveLogCounter++;
    const groupIdx = Math.floor(rng(i * 4.7) * LOG_MESSAGES.length);
    const group = LOG_MESSAGES[groupIdx];
    const msgIdx = Math.floor(rng(i * 6.3) * group.messages.length);
    const sensorIdx = Math.floor(rng(i * 2.9) * 250);
    const sensor = sensors[sensorIdx];
    return {
        id: `LOG-${String(i).padStart(4, '0')}`,
        timestamp: new Date().toISOString(),
        level: group.level,
        message: buildLogMessage(group.messages[msgIdx], sensor),
        source: group.source,
    };
}
