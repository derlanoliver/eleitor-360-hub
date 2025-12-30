import { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map as MapIcon, Users, UserCheck, Flame, MapPin, Link2, Navigation, Crown, Star } from "lucide-react";
import { useStrategicMapData, LeaderMapData, ContactMapData } from "@/hooks/maps/useStrategicMapData";
import { MapController } from "@/components/maps/MapController";
import { MapAnalysisPanel } from "@/components/maps/MapAnalysisPanel";
import "leaflet/dist/leaflet.css";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { TutorialButton } from "@/components/TutorialButton";
import type { Step } from "react-joyride";

const mapTutorialSteps: Step[] = [
  {
    target: '[data-tutorial="map-header"]',
    title: "Mapa Estratégico",
    content: "Visualize a distribuição geográfica de líderes e contatos no Distrito Federal.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="map-stats"]',
    title: "Estatísticas",
    content: "Veja o total de coordenadores, líderes, contatos e conexões mapeadas.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="map-controls"]',
    title: "Controles do Mapa",
    content: "Ative/desative camadas como heatmap, líderes e contatos. Escolha o estilo do mapa e filtre por região.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="map-container"]',
    title: "Mapa Interativo",
    content: "Navegue pelo mapa, clique nos marcadores para ver detalhes e use o zoom para explorar regiões.",
    placement: "top",
  },
];

// Distrito Federal center coordinates
const DF_CENTER: [number, number] = [-15.7801, -47.9292];
const DF_ZOOM = 10;
const CITY_ZOOM = 13;

// Map tile styles
const MAP_STYLES = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    className: "",
  },
  clean: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    className: "",
  },
  grayscale: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    className: "grayscale",
  },
};

type MapStyleKey = keyof typeof MAP_STYLES;

// Generate unique color for each leader based on ID
function getLeaderColor(leaderId: string): string {
  const hash = leaderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

// Golden angle spiral algorithm for spreading pins within a region
function calculateSpreadPosition(
  baseLat: number,
  baseLng: number,
  index: number,
  type: 'coordinator' | 'leader' | 'contact'
): { lat: number; lng: number } {
  // Different base radius per type (coordinators center, leaders around, contacts outer)
  const baseRadius = type === 'coordinator' ? 0.004 : type === 'leader' ? 0.008 : 0.012;
  
  // Golden angle for uniform distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  
  // Radius increases with sqrt for uniform density
  const radius = baseRadius * Math.sqrt(index + 1) * 0.4;
  
  return {
    lat: baseLat + radius * Math.cos(angle),
    lng: baseLng + radius * Math.sin(angle),
  };
}

// Group items by city and calculate spread positions
function getPositionsByCity<T extends { id: string; latitude: number; longitude: number }>(
  items: T[],
  type: 'coordinator' | 'leader' | 'contact'
): Map<string, { lat: number; lng: number }> {
  const positions = new Map<string, { lat: number; lng: number }>();
  
  // Group by approximate city location
  const byCityKey = new Map<string, T[]>();
  items.forEach((item) => {
    if (item.latitude == null || item.longitude == null) return;
    const key = `${item.latitude.toFixed(2)},${item.longitude.toFixed(2)}`;
    if (!byCityKey.has(key)) {
      byCityKey.set(key, []);
    }
    byCityKey.get(key)!.push(item);
  });
  
  // Calculate spread positions for each group
  byCityKey.forEach((group) => {
    group.forEach((item, indexInGroup) => {
      const pos = calculateSpreadPosition(
        item.latitude,
        item.longitude,
        indexInGroup,
        type
      );
      positions.set(item.id, pos);
    });
  });
  
  return positions;
}

// Create custom star icon for leaders
function createStarIcon(color: string) {
  return L.divIcon({
    className: 'custom-star-icon',
    html: `<svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="white" stroke-width="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Create custom crown icon for coordinators
function createCrownIcon(color: string) {
  return L.divIcon({
    className: 'custom-crown-icon',
    html: `<svg viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="white" stroke-width="1.5">
      <path d="M2 17l2-6 4 3 4-8 4 8 4-3 2 6H2z"/>
      <rect x="3" y="18" width="18" height="3" rx="1"/>
    </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Heatmap component
function HeatmapLayer({ contacts, enabled }: { contacts: ContactMapData[]; enabled: boolean }) {
  const heatData = useMemo(() => {
    if (!enabled || contacts.length === 0) return [];
    
    const grouped = contacts.reduce((acc: Record<string, { lat: number; lng: number; count: number }>, c) => {
      if (c.latitude == null || c.longitude == null) return acc;
      const key = `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;
      if (!acc[key]) {
        acc[key] = { lat: c.latitude, lng: c.longitude, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [contacts, enabled]);

  if (!enabled || heatData.length === 0) return null;

  return (
    <>
      {heatData.map((point, i) => (
        <Circle
          key={`heat-${i}`}
          center={[point.lat, point.lng]}
          radius={Math.min(point.count * 200, 3000)}
          pathOptions={{
            color: "transparent",
            fillColor: point.count > 50 ? "#ef4444" : point.count > 20 ? "#f97316" : "#eab308",
            fillOpacity: Math.min(0.1 + point.count * 0.005, 0.4),
          }}
        />
      ))}
    </>
  );
}

// Hierarchy connections layer - draws lines from coordinators to their subordinate leaders
function HierarchyConnectionsLayer({
  leaders,
  leaderPositions,
  enabled,
}: {
  leaders: LeaderMapData[];
  leaderPositions: Map<string, { lat: number; lng: number }>;
  enabled: boolean;
}) {
  const connections = useMemo(() => {
    if (!enabled) return [];

    const lines: Array<{
      from: [number, number];
      to: [number, number];
      color: string;
      coordinatorName: string;
      leaderName: string;
    }> = [];

    leaders.forEach((leader) => {
      // If has parent_leader_id, draw connection to coordinator
      if (leader.parent_leader_id) {
        const coordinatorPos = leaderPositions.get(leader.parent_leader_id);
        const leaderPos = leaderPositions.get(leader.id);
        
        if (coordinatorPos && leaderPos) {
          const coordinator = leaders.find(l => l.id === leader.parent_leader_id);
          lines.push({
            from: [coordinatorPos.lat, coordinatorPos.lng],
            to: [leaderPos.lat, leaderPos.lng],
            color: getLeaderColor(leader.parent_leader_id),
            coordinatorName: coordinator?.nome_completo || "",
            leaderName: leader.nome_completo,
          });
        }
      }
    });

    return lines;
  }, [leaders, leaderPositions, enabled]);

  if (!enabled || connections.length === 0) return null;

  return (
    <>
      {connections.map((conn, i) => (
        <Polyline
          key={`hierarchy-${i}`}
          positions={[conn.from, conn.to]}
          pathOptions={{
            color: conn.color,
            weight: 2.5,
            opacity: 0.8,
            dashArray: "10, 6",
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">👑 {conn.coordinatorName}</p>
              <p className="text-muted-foreground">→ ⭐ {conn.leaderName}</p>
            </div>
          </Popup>
        </Polyline>
      ))}
    </>
  );
}

// Leader-to-Contact connections layer
function ConnectionsLayer({
  leaders,
  contacts,
  leaderPositions,
  contactPositions,
  enabled,
}: {
  leaders: LeaderMapData[];
  contacts: ContactMapData[];
  leaderPositions: Map<string, { lat: number; lng: number }>;
  contactPositions: Map<string, { lat: number; lng: number }>;
  enabled: boolean;
}) {
  const connections = useMemo(() => {
    if (!enabled) return [];

    const lines: Array<{
      from: [number, number];
      to: [number, number];
      color: string;
      leaderName: string;
      contactName: string;
    }> = [];

    contacts.forEach((contact) => {
      if (contact.source_type === "lider" && contact.source_id) {
        const leaderPos = leaderPositions.get(contact.source_id);
        const contactPos = contactPositions.get(contact.id);
        
        if (leaderPos && contactPos) {
          lines.push({
            from: [leaderPos.lat, leaderPos.lng],
            to: [contactPos.lat, contactPos.lng],
            color: getLeaderColor(contact.source_id),
            leaderName: leaders.find((l) => l.id === contact.source_id)?.nome_completo || "",
            contactName: contact.nome,
          });
        }
      }
    });

    return lines;
  }, [leaders, contacts, leaderPositions, contactPositions, enabled]);

  if (!enabled || connections.length === 0) return null;

  return (
    <>
      {connections.map((conn, i) => (
        <Polyline
          key={`connection-${i}`}
          positions={[conn.from, conn.to]}
          pathOptions={{
            color: conn.color,
            weight: 1.5,
            opacity: 0.5,
            dashArray: "4, 4",
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{conn.leaderName}</p>
              <p className="text-muted-foreground">→ {conn.contactName}</p>
            </div>
          </Popup>
        </Polyline>
      ))}
    </>
  );
}

export default function StrategicMap() {
  const { leaders, contacts, cities, stats, isLoading, error } = useStrategicMapData();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showLeaders, setShowLeaders] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("clean");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedLeader, setSelectedLeader] = useState<string>("all");

  const { restartTutorial } = useTutorial("strategic-map", mapTutorialSteps);

  // Separate coordinators and regular leaders for dropdown
  const leaderOptions = useMemo(() => {
    const coordinators = leaders.filter(l => l.is_coordinator).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    const regularLeaders = leaders.filter(l => !l.is_coordinator).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    return { coordinators, regularLeaders };
  }, [leaders]);

  // Filter visible leaders based on selection
  const visibleLeaders = useMemo(() => {
    if (selectedLeader === "all") return leaders;
    
    const selected = leaders.find(l => l.id === selectedLeader);
    if (!selected) return leaders;
    
    // If coordinator: show them + all subordinates
    if (selected.is_coordinator) {
      return leaders.filter(l => 
        l.id === selectedLeader || l.parent_leader_id === selectedLeader
      );
    }
    
    // If regular leader: show only them
    return [selected];
  }, [leaders, selectedLeader]);

  // Calculate spread positions for all pins
  const leaderPositions = useMemo(() => {
    // Separate coordinators and leaders for different spread patterns
    const coordinators = visibleLeaders.filter(l => l.is_coordinator);
    const regularLeaders = visibleLeaders.filter(l => !l.is_coordinator);
    
    const positions = new Map<string, { lat: number; lng: number }>();
    
    // Calculate positions for coordinators
    const coordPositions = getPositionsByCity(coordinators, 'coordinator');
    coordPositions.forEach((pos, id) => positions.set(id, pos));
    
    // Calculate positions for regular leaders
    const leaderPos = getPositionsByCity(regularLeaders, 'leader');
    leaderPos.forEach((pos, id) => positions.set(id, pos));
    
    return positions;
  }, [visibleLeaders]);

  const contactPositions = useMemo(() => {
    return getPositionsByCity(contacts, 'contact');
  }, [contacts]);

  // Count connections for stats
  const contactConnectionsCount = useMemo(() => {
    return contacts.filter((c) => c.source_type === "lider" && c.source_id).length;
  }, [contacts]);
  
  const hierarchyConnectionsCount = useMemo(() => {
    return leaders.filter(l => l.parent_leader_id).length;
  }, [leaders]);

  // Get map center based on selected region
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedRegion === "all") return DF_CENTER;
    const city = cities.find(c => c.id === selectedRegion);
    if (city && city.latitude && city.longitude) {
      return [city.latitude, city.longitude];
    }
    return DF_CENTER;
  }, [selectedRegion, cities]);

  const mapZoom = selectedRegion === "all" ? DF_ZOOM : CITY_ZOOM;

  // Sort cities for dropdown
  const sortedCities = useMemo(() => {
    return [...cities]
      .filter(c => c.latitude && c.longitude)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cities]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar dados do mapa: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStyle = MAP_STYLES[mapStyle];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <TutorialOverlay page="strategic-map" />
      {/* Header */}
      <div data-tutorial="map-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MapIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapa Estratégico</h1>
            <p className="text-muted-foreground text-sm">Visualização da atuação política no Distrito Federal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div data-tutorial="map-stats" className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Crown className="h-4 w-4" />
              {stats?.coordinatorsCount ?? 0} Coordenadores
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Star className="h-4 w-4" />
              {stats?.leadersCount ?? 0} Líderes
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Users className="h-4 w-4" />
              {stats?.contactsCount ?? 0} Contatos
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Link2 className="h-4 w-4" />
              {contactConnectionsCount + hierarchyConnectionsCount} Conexões
            </Badge>
          </div>
          <TutorialButton onClick={restartTutorial} />
        </div>
      </div>

      {/* Controls */}
      <Card data-tutorial="map-controls">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Map Style Selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Estilo:</Label>
              <Select value={mapStyle} onValueChange={(v) => setMapStyle(v as MapStyleKey)}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="standard">Padrão</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="grayscale">Escala de Cinza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region Selector */}
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Região" />
                </SelectTrigger>
                <SelectContent className="z-[9999] max-h-[300px]">
                  <SelectItem value="all">Todas as Regiões</SelectItem>
                  {sortedCities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leader/Coordinator Filter */}
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger className="w-[220px] h-8">
                  <SelectValue placeholder="Filtrar por Líder" />
                </SelectTrigger>
                <SelectContent className="z-[9999] max-h-[400px]">
                  <SelectItem value="all">Todos os Líderes</SelectItem>
                  
                  {leaderOptions.coordinators.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold border-t mt-1">
                        👑 Coordenadores ({leaderOptions.coordinators.length})
                      </div>
                      {leaderOptions.coordinators.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          👑 {c.nome_completo}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {leaderOptions.regularLeaders.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold border-t mt-1">
                        ⭐ Líderes ({leaderOptions.regularLeaders.length})
                      </div>
                      {leaderOptions.regularLeaders.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          ⭐ {l.nome_completo}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <Switch
                id="show-leaders"
                checked={showLeaders}
                onCheckedChange={setShowLeaders}
              />
              <Label htmlFor="show-leaders" className="flex items-center gap-1.5 cursor-pointer">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Líderes
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="show-contacts"
                checked={showContacts}
                onCheckedChange={setShowContacts}
              />
              <Label htmlFor="show-contacts" className="flex items-center gap-1.5 cursor-pointer">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                Contatos
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="show-connections"
                checked={showConnections}
                onCheckedChange={setShowConnections}
              />
              <Label htmlFor="show-connections" className="flex items-center gap-1.5 cursor-pointer">
                <Link2 className="h-4 w-4 text-purple-500" />
                Conexões
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="show-heatmap"
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
              />
              <Label htmlFor="show-heatmap" className="flex items-center gap-1.5 cursor-pointer">
                <Flame className="h-4 w-4 text-orange-500" />
                Mapa de Calor
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card data-tutorial="map-container" className="overflow-hidden">
        <CardContent className="p-0">
          <div className={`h-[600px] w-full ${currentStyle.className}`}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <MapController center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution={currentStyle.attribution}
                url={currentStyle.url}
              />

              {/* Heatmap Layer */}
              <HeatmapLayer contacts={contacts} enabled={showHeatmap} />

              {/* Hierarchy Connections - Coordinator to Leader */}
              <HierarchyConnectionsLayer
                leaders={visibleLeaders}
                leaderPositions={leaderPositions}
                enabled={showConnections}
              />

              {/* Leader-to-Contact Connections */}
              <ConnectionsLayer
                leaders={visibleLeaders}
                contacts={contacts}
                leaderPositions={leaderPositions}
                contactPositions={contactPositions}
                enabled={showConnections}
              />

              {/* Leader/Coordinator pins with custom icons */}
              {showLeaders &&
                visibleLeaders.map((leader) => {
                  const pos = leaderPositions.get(leader.id);
                  if (!pos) return null;
                  
                  const color = getLeaderColor(leader.id);
                  const icon = leader.is_coordinator ? createCrownIcon(color) : createStarIcon(color);

                  return (
                    <Marker
                      key={`leader-pin-${leader.id}`}
                      position={[pos.lat, pos.lng]}
                      icon={icon}
                    >
                      <Popup>
                        <div className="text-sm min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{leader.is_coordinator ? '👑' : '⭐'}</span>
                            <div>
                              <p className="font-semibold">{leader.nome_completo}</p>
                              <p className="text-xs text-muted-foreground">
                                {leader.is_coordinator ? 'Coordenador' : 'Líder'}
                              </p>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2">📍 {leader.cidade_nome}</p>
                          <div className="space-y-1 text-xs border-t pt-2">
                            <p>📊 {leader.cadastros} cadastros</p>
                            <p>🏆 {leader.pontuacao_total} pontos</p>
                            {leader.email && <p>📧 {leader.email}</p>}
                            {leader.telefone && <p>📞 {leader.telefone}</p>}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Contact pins */}
              {showContacts &&
                contacts.map((contact) => {
                  const pos = contactPositions.get(contact.id);
                  if (!pos) return null;
                  
                  // Highlighted color if has leader connection
                  const hasConnection = contact.source_type === "lider" && contact.source_id;
                  const pinColor = hasConnection
                    ? getLeaderColor(contact.source_id!)
                    : "#10b981";

                  return (
                    <CircleMarker
                      key={`contact-${contact.id}`}
                      center={[pos.lat, pos.lng]}
                      radius={hasConnection ? 5 : 4}
                      pathOptions={{
                        color: hasConnection ? "#ffffff" : pinColor,
                        weight: hasConnection ? 1.5 : 1,
                        fillColor: pinColor,
                        fillOpacity: 0.8,
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{contact.nome}</p>
                          <p className="text-muted-foreground">{contact.cidade_nome}</p>
                          {contact.source_type && (
                            <p className="text-xs mt-1">Origem: {contact.source_type}</p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Legenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <span>Coordenador</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span>Líder</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Contato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ borderTop: "3px dashed hsl(270, 70%, 50%)" }} />
              <span>Hierarquia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ borderTop: "2px dashed hsl(150, 70%, 50%)" }} />
              <span>Indicação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 rounded bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 opacity-50" />
              <span>Mapa de calor</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Panel */}
      <MapAnalysisPanel
        cities={cities}
        totalLeaders={leaders.length}
        totalContacts={contacts.length}
        totalConnections={contactConnectionsCount + hierarchyConnectionsCount}
      />
    </div>
  );
}
