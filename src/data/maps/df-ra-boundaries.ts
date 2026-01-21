// Approximate polygon boundaries for DF Administrative Regions
// These are simplified hexagonal polygons centered on each RA coordinate
// For precise boundaries, replace with official GeoJSON from GDF/SEDUH

export interface RABoundary {
  codigo_ra: string;
  nome: string;
  coordinates: [number, number][];
}

// Generate hexagon vertices around a center point
function generateHexagon(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 2.5
): [number, number][] {
  const vertices: [number, number][] = [];
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos(centerLat * (Math.PI / 180));
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // Start from top
    const latOffset = (radiusKm * Math.sin(angle)) / kmPerDegreeLat;
    const lngOffset = (radiusKm * Math.cos(angle)) / kmPerDegreeLng;
    vertices.push([centerLat + latOffset, centerLng + lngOffset]);
  }
  
  // Close the polygon
  vertices.push(vertices[0]);
  
  return vertices;
}

// RA data with coordinates
const raData = [
  { codigo_ra: "RA-01", nome: "Brasília", lat: -15.7942, lng: -47.8825, radius: 4 },
  { codigo_ra: "RA-02", nome: "Gama", lat: -15.8363, lng: -47.9064, radius: 3 },
  { codigo_ra: "RA-03", nome: "Taguatinga", lat: -15.8363, lng: -48.0514, radius: 3.5 },
  { codigo_ra: "RA-04", nome: "Brazlândia", lat: -15.8797, lng: -47.7962, radius: 4 },
  { codigo_ra: "RA-05", nome: "Sobradinho", lat: -15.8797, lng: -47.9544, radius: 3 },
  { codigo_ra: "RA-06", nome: "Planaltina", lat: -15.6185, lng: -47.6574, radius: 5 },
  { codigo_ra: "RA-07", nome: "Paranoá", lat: -15.7825, lng: -47.8992, radius: 3 },
  { codigo_ra: "RA-08", nome: "Núcleo Bandeirante", lat: -15.8311, lng: -47.9927, radius: 1.5 },
  { codigo_ra: "RA-09", nome: "Ceilândia", lat: -15.8533, lng: -48.0617, radius: 4 },
  { codigo_ra: "RA-10", nome: "Guará", lat: -15.7744, lng: -47.8919, radius: 2 },
  { codigo_ra: "RA-11", nome: "Cruzeiro", lat: -15.8483, lng: -47.8003, radius: 1.5 },
  { codigo_ra: "RA-12", nome: "Samambaia", lat: -15.8667, lng: -48.0333, radius: 3.5 },
  { codigo_ra: "RA-13", nome: "Santa Maria", lat: -15.8178, lng: -47.8878, radius: 3 },
  { codigo_ra: "RA-14", nome: "São Sebastião", lat: -15.83, lng: -47.955, radius: 3 },
  { codigo_ra: "RA-15", nome: "Recanto das Emas", lat: -15.8889, lng: -48.0803, radius: 2.5 },
  { codigo_ra: "RA-16", nome: "Lago Sul", lat: -15.78, lng: -47.82, radius: 3.5 },
  { codigo_ra: "RA-17", nome: "Riacho Fundo", lat: -15.8628, lng: -48.01, radius: 2 },
  { codigo_ra: "RA-18", nome: "Lago Norte", lat: -15.74, lng: -47.84, radius: 3 },
  { codigo_ra: "RA-19", nome: "Candangolândia", lat: -15.735, lng: -47.935, radius: 1 },
  { codigo_ra: "RA-20", nome: "Águas Claras", lat: -15.87, lng: -48.105, radius: 2.5 },
  { codigo_ra: "RA-21", nome: "Riacho Fundo II", lat: -15.865, lng: -48.025, radius: 2 },
  { codigo_ra: "RA-22", nome: "Sudoeste/Octogonal", lat: -15.755, lng: -47.895, radius: 1.5 },
  { codigo_ra: "RA-23", nome: "Varjão", lat: -15.73, lng: -47.885, radius: 0.8 },
  { codigo_ra: "RA-24", nome: "Park Way", lat: -15.71, lng: -47.81, radius: 4 },
  { codigo_ra: "RA-25", nome: "SCIA", lat: -15.66, lng: -47.8, radius: 1.5 },
  { codigo_ra: "RA-26", nome: "Sobradinho II", lat: -15.885, lng: -47.98, radius: 2.5 },
  { codigo_ra: "RA-27", nome: "Jardim Botânico", lat: -15.7, lng: -47.75, radius: 4 },
  { codigo_ra: "RA-28", nome: "Itapoã", lat: -15.825, lng: -47.97, radius: 2 },
  { codigo_ra: "RA-29", nome: "SIA", lat: -15.76, lng: -47.87, radius: 1.5 },
  { codigo_ra: "RA-30", nome: "Vicente Pires", lat: -15.84, lng: -48.12, radius: 2.5 },
  { codigo_ra: "RA-31", nome: "Fercal", lat: -15.63, lng: -47.68, radius: 3 },
  { codigo_ra: "RA-32", nome: "Sol Nascente/Pôr do Sol", lat: -15.855, lng: -48.095, radius: 3 },
  { codigo_ra: "RA-33", nome: "Arniqueira", lat: -15.68, lng: -47.86, radius: 2 },
  { codigo_ra: "RA-34", nome: "Arapoanga", lat: -15.6027, lng: -47.6324, radius: 2 },
];

// Generate boundaries for all RAs
export const dfRABoundaries: RABoundary[] = raData.map((ra) => ({
  codigo_ra: ra.codigo_ra,
  nome: ra.nome,
  coordinates: generateHexagon(ra.lat, ra.lng, ra.radius),
}));

// Get boundary by RA code
export function getBoundaryByCode(codigoRA: string): RABoundary | undefined {
  return dfRABoundaries.find((b) => b.codigo_ra === codigoRA);
}

// Get boundary by city ID (requires lookup)
export function getBoundaryByName(nome: string): RABoundary | undefined {
  return dfRABoundaries.find((b) => b.nome === nome);
}
