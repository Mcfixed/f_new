export type GatewayStatus = 'active' | 'inactive' | 'degraded';

export interface Gateway {
    id: string;
    name: string;
    lat: number;
    lng: number;
    eui: string;
    ip: string;
    status: GatewayStatus;
    connectedSensors: number;
    uptime: string;
    lastSeen: string;
    model: string;
    firmware: string;
    rxPackets: number;
    txPackets: number;
}

const BASE_TIME = '2026-02-25T01:40:25-03:00';

function minsAgo(mins: number): string {
    const d = new Date(BASE_TIME);
    d.setMinutes(d.getMinutes() - mins);
    return d.toISOString();
}

const gateways: Gateway[] = [
    {
        id: 'GW-001',
        name: 'Gateway Norte',
        lat: -33.4050,
        lng: -70.6200,
        eui: 'AA:BB:CC:DD:EE:FF:00:01',
        ip: '192.168.10.1',
        status: 'active',
        connectedSensors: 28,
        uptime: '14d 6h 22m',
        lastSeen: minsAgo(0),
        model: 'RAK7268',
        firmware: 'v1.4.2',
        rxPackets: 18432,
        txPackets: 1204,
    },
    {
        id: 'GW-002',
        name: 'Gateway Sur',
        lat: -33.5100,
        lng: -70.6900,
        eui: 'AA:BB:CC:DD:EE:FF:00:02',
        ip: '192.168.10.2',
        status: 'active',
        connectedSensors: 31,
        uptime: '21d 3h 11m',
        lastSeen: minsAgo(1),
        model: 'RAK7268',
        firmware: 'v1.4.2',
        rxPackets: 22100,
        txPackets: 1455,
    },
    {
        id: 'GW-003',
        name: 'Gateway Centro',
        lat: -33.4500,
        lng: -70.6700,
        eui: 'AA:BB:CC:DD:EE:FF:00:03',
        ip: '192.168.10.3',
        status: 'active',
        connectedSensors: 25,
        uptime: '8d 14h 05m',
        lastSeen: minsAgo(2),
        model: 'Dragino DLOS8',
        firmware: 'v5.4.1',
        rxPackets: 14890,
        txPackets: 987,
    },
    {
        id: 'GW-004',
        name: 'Gateway Oriente',
        lat: -33.4300,
        lng: -70.5800,
        eui: 'AA:BB:CC:DD:EE:FF:00:04',
        ip: '192.168.10.4',
        status: 'degraded',
        connectedSensors: 19,
        uptime: '3d 1h 48m',
        lastSeen: minsAgo(8),
        model: 'RAK7289',
        firmware: 'v1.3.8',
        rxPackets: 9210,
        txPackets: 602,
    },
    {
        id: 'GW-005',
        name: 'Gateway Poniente',
        lat: -33.4600,
        lng: -70.7500,
        eui: 'AA:BB:CC:DD:EE:FF:00:05',
        ip: '192.168.10.5',
        status: 'active',
        connectedSensors: 22,
        uptime: '30d 0h 59m',
        lastSeen: minsAgo(0),
        model: 'Dragino DLOS8',
        firmware: 'v5.4.1',
        rxPackets: 31020,
        txPackets: 2100,
    },
    {
        id: 'GW-006',
        name: 'Gateway Aeropuerto',
        lat: -33.3900,
        lng: -70.7900,
        eui: 'AA:BB:CC:DD:EE:FF:00:06',
        ip: '192.168.10.6',
        status: 'active',
        connectedSensors: 26,
        uptime: '11d 22h 30m',
        lastSeen: minsAgo(3),
        model: 'RAK7268',
        firmware: 'v1.4.2',
        rxPackets: 17654,
        txPackets: 1123,
    },
    {
        id: 'GW-007',
        name: 'Gateway Industrial',
        lat: -33.4800,
        lng: -70.6300,
        eui: 'AA:BB:CC:DD:EE:FF:00:07',
        ip: '192.168.10.7',
        status: 'inactive',
        connectedSensors: 0,
        uptime: '—',
        lastSeen: minsAgo(180),
        model: 'TTN Indoor GW',
        firmware: 'v2.0.3',
        rxPackets: 5420,
        txPackets: 340,
    },
    {
        id: 'GW-008',
        name: 'Gateway Estadio',
        lat: -33.4650,
        lng: -70.6100,
        eui: 'AA:BB:CC:DD:EE:FF:00:08',
        ip: '192.168.10.8',
        status: 'active',
        connectedSensors: 24,
        uptime: '6d 8h 17m',
        lastSeen: minsAgo(1),
        model: 'RAK7289',
        firmware: 'v1.4.0',
        rxPackets: 13200,
        txPackets: 880,
    },
    {
        id: 'GW-009',
        name: 'Gateway Cordillera',
        lat: -33.4200,
        lng: -70.5500,
        eui: 'AA:BB:CC:DD:EE:FF:00:09',
        ip: '192.168.10.9',
        status: 'degraded',
        connectedSensors: 12,
        uptime: '1d 4h 03m',
        lastSeen: minsAgo(15),
        model: 'Dragino DLOS8',
        firmware: 'v5.3.9',
        rxPackets: 4300,
        txPackets: 280,
    },
    {
        id: 'GW-010',
        name: 'Gateway Costa',
        lat: -33.4900,
        lng: -70.7200,
        eui: 'AA:BB:CC:DD:EE:FF:00:10',
        ip: '192.168.10.10',
        status: 'active',
        connectedSensors: 18,
        uptime: '19d 11h 44m',
        lastSeen: minsAgo(2),
        model: 'TTN Indoor GW',
        firmware: 'v2.0.3',
        rxPackets: 24100,
        txPackets: 1620,
    },
];

export default gateways;
