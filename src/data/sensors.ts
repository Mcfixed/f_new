export type SensorStatus = 'online' | 'offline' | 'warning';
export type SensorMode = 'production' | 'maintenance' | 'transport';

export interface Sensor {
    id: string;
    name: string;
    lat: number;
    lng: number;
    eui: string;
    appKey: string;
    devAddr: string;
    status: SensorStatus;
    mode: SensorMode;
    lastSeen: string;
    batteryLevel: number;
    firmware: string;
    signalStrength: number; // avg RSSI
    snr: number;
    alertCount: number;
}

function hexStr(len: number, seed: number): string {
    let result = '';
    let s = seed;
    for (let i = 0; i < len; i++) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        result += ('0' + ((s >>> 28) & 0xf).toString(16)).slice(-1);
    }
    return result.toUpperCase();
}

function eui64(seed: number): string {
    const h = hexStr(16, seed);
    return `${h.slice(0, 2)}:${h.slice(2, 4)}:${h.slice(4, 6)}:${h.slice(6, 8)}:${h.slice(8, 10)}:${h.slice(10, 12)}:${h.slice(12, 14)}:${h.slice(14, 16)}`;
}

function appKey(seed: number): string {
    const h = hexStr(32, seed + 9999);
    return h.match(/.{8}/g)!.join('-');
}

function devAddr(seed: number): string {
    return hexStr(8, seed + 42);
}

function randomBetween(min: number, max: number, seed: number): number {
    const x = Math.sin(seed) * 10000;
    return min + ((x - Math.floor(x)) * (max - min));
}

function minutesAgo(mins: number): string {
    const d = new Date('2026-02-25T01:21:29-03:00');
    d.setMinutes(d.getMinutes() - mins);
    return d.toISOString();
}

const BASE_LAT = -33.4489;
const BASE_LNG = -70.6693;

// Path goes somewhat east then north-east, 250m intervals ≈ 0.00225° lat each step
const sensors: Sensor[] = Array.from({ length: 250 }, (_, i) => {
    const idx = i + 1;
    const angle = (i * 7.3) % 360;
    const latOffset = Math.cos((angle * Math.PI) / 180) * 0.00225 * i;
    const lngOffset = Math.sin((angle * Math.PI) / 180) * 0.00225 * i * 0.6;

    const statusRoll = randomBetween(0, 1, idx * 3.7);
    const status: SensorStatus =
        statusRoll > 0.9 ? 'offline' : statusRoll > 0.75 ? 'warning' : 'online';

    const battery = Math.round(randomBetween(12, 100, idx * 5.1));
    const rssi = Math.round(randomBetween(-130, -65, idx * 2.3));
    const snr = parseFloat(randomBetween(-10, 12, idx * 1.9).toFixed(1));
    const alertCnt = Math.round(randomBetween(0, 18, idx * 4.1));
    const modeRoll = randomBetween(0, 1, idx * 6.7);
    const mode: SensorMode = modeRoll > 0.95 ? 'transport' : modeRoll > 0.85 ? 'maintenance' : 'production';

    return {
        id: `SENS-${String(idx).padStart(3, '0')}`,
        name: `Sensor ${String(idx).padStart(3, '0')}`,
        lat: BASE_LAT + latOffset,
        lng: BASE_LNG + lngOffset,
        eui: eui64(idx),
        appKey: appKey(idx),
        devAddr: devAddr(idx),
        status,
        mode,
        lastSeen: minutesAgo(Math.round(randomBetween(0, 120, idx * 8.3))),
        batteryLevel: battery,
        firmware: `v${1 + (idx % 3)}.${idx % 10}.${(idx * 3) % 10}`,
        signalStrength: rssi,
        snr,
        alertCount: alertCnt,
    };
});

export default sensors;
