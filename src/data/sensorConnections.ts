import sensors from './sensors';
import gateways from './gateways';
import type { Sensor } from './sensors';
import type { Gateway } from './gateways';

export type SignalQuality = 'good' | 'fair' | 'poor' | 'critical';

export interface SensorConnection {
    sensorId: string;
    sensorName: string;
    gatewayId: string;
    gatewayName: string;
    sensorLat: number;
    sensorLng: number;
    gatewayLat: number;
    gatewayLng: number;
    rssi: number;
    snr: number;
    quality: SignalQuality;
    status: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifySignal(rssi: number): SignalQuality {
    if (rssi > -80) return 'good';
    if (rssi > -100) return 'fair';
    if (rssi > -115) return 'poor';
    return 'critical';
}

export function getSignalColor(quality: SignalQuality): string {
    switch (quality) {
        case 'good': return '#00e87a';
        case 'fair': return '#f5c542';
        case 'poor': return '#f59e0b';
        case 'critical': return '#ef4444';
    }
}

export function getSignalColorByRssi(rssi: number): string {
    return getSignalColor(classifySignal(rssi));
}

function findNearestGateway(sensor: Sensor): Gateway {
    let nearest = gateways[0];
    let minDist = Infinity;
    for (const gw of gateways) {
        if (gw.status === 'inactive') continue;
        const d = haversineDistance(sensor.lat, sensor.lng, gw.lat, gw.lng);
        if (d < minDist) {
            minDist = d;
            nearest = gw;
        }
    }
    return nearest;
}

export const sensorConnections: SensorConnection[] = sensors.map(sensor => {
    const gw = findNearestGateway(sensor);
    return {
        sensorId: sensor.id,
        sensorName: sensor.name,
        gatewayId: gw.id,
        gatewayName: gw.name,
        sensorLat: sensor.lat,
        sensorLng: sensor.lng,
        gatewayLat: gw.lat,
        gatewayLng: gw.lng,
        rssi: sensor.signalStrength,
        snr: sensor.snr,
        quality: classifySignal(sensor.signalStrength),
        status: sensor.status,
    };
});

// Pre-computed stats
export const connectionStats = {
    total: sensorConnections.length,
    good: sensorConnections.filter(c => c.quality === 'good').length,
    fair: sensorConnections.filter(c => c.quality === 'fair').length,
    poor: sensorConnections.filter(c => c.quality === 'poor').length,
    critical: sensorConnections.filter(c => c.quality === 'critical').length,
    avgRssi: Math.round(sensorConnections.reduce((s, c) => s + c.rssi, 0) / sensorConnections.length),
};
