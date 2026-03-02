/**
 * Catenary / overhead line data for the train system.
 *
 * Layout: ~10 km rail line running roughly north-south through the existing
 * sensor map area, with TWO parallel overhead cables (Catenaria A & B).
 * Four substations divide each cable into segments that can be independently
 * connected or disconnected.
 */

export interface Substation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: 'online' | 'offline';
}

export type CableId = 'A' | 'B';

export interface CatenarySegment {
    id: string;
    cable: CableId;
    /** Substation at the start of this segment (null = line origin) */
    fromSubstation: string | null;
    /** Substation at the end of this segment (null = line terminus) */
    toSubstation: string | null;
    /** Ordered coordinates that draw the polyline for THIS segment */
    coords: [number, number][];
    /** Whether this segment is currently energised / connected */
    connected: boolean;
    /** If disconnected, optional info */
    disconnectedSince?: string;
    disconnectReason?: string;
}

// ── Rail path (≈ 10 km north→south through Santiago) ──────────────────────
// We define the FULL rail path first, then split it into segments at
// the substation positions.

const RAIL_PATH: [number, number][] = [
    [-33.390, -70.660],  // km 0   — north terminus
    [-33.400, -70.658],
    [-33.410, -70.657],
    [-33.418, -70.660],  // slight bend
    [-33.425, -70.663],  // ← Substation Norte (near here)
    [-33.432, -70.665],
    [-33.438, -70.666],
    [-33.445, -70.668],
    [-33.450, -70.669],  // ← Substation Centro
    [-33.457, -70.670],
    [-33.463, -70.672],
    [-33.468, -70.675],
    [-33.475, -70.678],  // ← Substation Sur
    [-33.481, -70.680],
    [-33.486, -70.682],
    [-33.490, -70.685],  // ← Substation Terminal
    [-33.495, -70.688],
    [-33.500, -70.690],  // km 10  — south terminus
];

// Offset the second cable slightly to the east so both are visible
const CABLE_OFFSET = 0.0012; // lng offset

function offsetPath(path: [number, number][], lngOffset: number): [number, number][] {
    return path.map(([lat, lng]) => [lat, lng + lngOffset]);
}

const PATH_A = RAIL_PATH;
const PATH_B = offsetPath(RAIL_PATH, CABLE_OFFSET);

// ── Substations ────────────────────────────────────────────────────────────
export const substations: Substation[] = [
    { id: 'SUB-01', name: 'Subestación Norte', lat: -33.425, lng: -70.663, status: 'online' },
    { id: 'SUB-02', name: 'Subestación Centro', lat: -33.450, lng: -70.669, status: 'online' },
    { id: 'SUB-03', name: 'Subestación Sur', lat: -33.475, lng: -70.678, status: 'online' },
    { id: 'SUB-04', name: 'Subestación Terminal', lat: -33.490, lng: -70.685, status: 'offline' },
];

// Index of each substation in the RAIL_PATH array
const SUB_INDICES = [4, 8, 12, 15];

// ── Build segments ─────────────────────────────────────────────────────────
function buildSegments(
    cableId: CableId,
    fullPath: [number, number][],
): CatenarySegment[] {
    const cuts = [0, ...SUB_INDICES, fullPath.length - 1];
    const segments: CatenarySegment[] = [];

    for (let i = 0; i < cuts.length - 1; i++) {
        const start = cuts[i];
        const end = cuts[i + 1];
        const segCoords = fullPath.slice(start, end + 1);
        const fromSub = i === 0 ? null : substations[i - 1].id;
        const toSub = i === cuts.length - 2 ? null : substations[i].id;

        segments.push({
            id: `CAT-${cableId}-${String(i + 1).padStart(2, '0')}`,
            cable: cableId,
            fromSubstation: fromSub,
            toSubstation: toSub,
            coords: segCoords,
            connected: true,
        });
    }
    return segments;
}

const segmentsA = buildSegments('A', PATH_A);
const segmentsB = buildSegments('B', PATH_B);

// ── Simulate disconnections ────────────────────────────────────────────────
// Segment between Subestación Sur and Subestación Terminal is disconnected
// on Cable A (simulating a catenary fall)
const disconnectedSegA = segmentsA.find(s => s.id === 'CAT-A-04');
if (disconnectedSegA) {
    disconnectedSegA.connected = false;
    disconnectedSegA.disconnectedSince = '2026-03-02T02:15:00-03:00';
    disconnectedSegA.disconnectReason = 'Desconexión de catenaria detectada — posible caída de cable';
}

// Also disconnect same segment on Cable B (both cables down in that zone)
const disconnectedSegB = segmentsB.find(s => s.id === 'CAT-B-04');
if (disconnectedSegB) {
    disconnectedSegB.connected = false;
    disconnectedSegB.disconnectedSince = '2026-03-02T02:15:00-03:00';
    disconnectedSegB.disconnectReason = 'Desconexión de catenaria detectada — posible caída de cable';
}

// Also disconnect first segment of Cable B (origin → Norte)
const disconnectedSegB1 = segmentsB.find(s => s.id === 'CAT-B-01');
if (disconnectedSegB1) {
    disconnectedSegB1.connected = false;
    disconnectedSegB1.disconnectedSince = '2026-03-02T01:48:00-03:00';
    disconnectedSegB1.disconnectReason = 'Corte de alimentación en tramo norte';
}

export const catenarySegments: CatenarySegment[] = [...segmentsA, ...segmentsB];

// ── Stats ──────────────────────────────────────────────────────────────────
export const catenaryStats = {
    totalSegments: catenarySegments.length,
    connected: catenarySegments.filter(s => s.connected).length,
    disconnected: catenarySegments.filter(s => !s.connected).length,
    cableA: {
        total: segmentsA.length,
        disconnected: segmentsA.filter(s => !s.connected).length,
    },
    cableB: {
        total: segmentsB.length,
        disconnected: segmentsB.filter(s => !s.connected).length,
    },
};
