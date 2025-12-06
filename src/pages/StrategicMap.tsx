import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Users, UserCheck, Flame, MapPin } from "lucide-react";
import { useStrategicMapData, LeaderMapData, ContactMapData } from "@/hooks/maps/useStrategicMapData";
import "leaflet/dist/leaflet.css";

// Distrito Federal center coordinates
const DF_CENTER: [number, number] = [-15.7801, -47.9292];
const DF_ZOOM = 10;

// Generate unique color for each leader based on ID
function getLeaderColor(leaderId: string): string {
  const hash = leaderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

// Calculate radius based on registrations (min 50m, max 5km)
function calculateRadius(cadastros: number): number {
  if (cadastros === 0) return 50;
  return Math.min(Math.max(cadastros * 100, 100), 5000);
}

// Add random offset to prevent overlapping pins in same city
function addOffset(coord: number, index: number): number {
  const offset = ((index % 20) - 10) * 0.002; // Small random offset
  return coord + offset;
}

// Heatmap component - only renders when enabled
function HeatmapLayer({ contacts, enabled }: { contacts: ContactMapData[]; enabled: boolean }) {
  // Group contacts by location for heatmap effect - must be before any conditional returns
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

export default function StrategicMap() {
  const { leaders, contacts, cities, isLoading, error } = useStrategicMapData();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLeaders, setShowLeaders] = useState(true);
  const [showContacts, setShowContacts] = useState(true);

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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Map className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapa Estratégico</h1>
            <p className="text-muted-foreground text-sm">Visualização da atuação política no Distrito Federal</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <UserCheck className="h-4 w-4" />
            {leaders.length} Líderes
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <Users className="h-4 w-4" />
            {contacts.length} Contatos
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
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
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer
              center={DF_CENTER}
              zoom={DF_ZOOM}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Heatmap Layer */}
              <HeatmapLayer contacts={contacts} enabled={showHeatmap} />

              {/* Leader circles with radius */}
              {showLeaders &&
                leaders.map((leader, index) => {
                  const color = getLeaderColor(leader.id);
                  const radius = calculateRadius(leader.cadastros);
                  const lat = addOffset(leader.latitude, index);
                  const lng = addOffset(leader.longitude, index + 100);

                  return (
                    <Circle
                      key={`leader-circle-${leader.id}`}
                      center={[lat, lng]}
                      radius={radius}
                      pathOptions={{
                        color: color,
                        weight: 2,
                        opacity: 0.8,
                        fillColor: color,
                        fillOpacity: 0.15,
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{leader.nome_completo}</p>
                          <p className="text-muted-foreground">{leader.cidade_nome}</p>
                          <div className="mt-1 space-y-0.5">
                            <p>📊 {leader.cadastros} cadastros</p>
                            <p>⭐ {leader.pontuacao_total} pontos</p>
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

              {/* Leader center pins */}
              {showLeaders &&
                leaders.map((leader, index) => {
                  const color = getLeaderColor(leader.id);
                  const lat = addOffset(leader.latitude, index);
                  const lng = addOffset(leader.longitude, index + 100);

                  return (
                    <CircleMarker
                      key={`leader-pin-${leader.id}`}
                      center={[lat, lng]}
                      radius={8}
                      pathOptions={{
                        color: "#ffffff",
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 1,
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{leader.nome_completo}</p>
                          <p className="text-muted-foreground">{leader.cidade_nome}</p>
                          <div className="mt-1 space-y-0.5">
                            <p>📊 {leader.cadastros} cadastros</p>
                            <p>⭐ {leader.pontuacao_total} pontos</p>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

              {/* Contact pins */}
              {showContacts &&
                contacts.map((contact, index) => {
                  const lat = addOffset(contact.latitude, index * 3);
                  const lng = addOffset(contact.longitude, index * 3 + 50);

                  return (
                    <CircleMarker
                      key={`contact-${contact.id}`}
                      center={[lat, lng]}
                      radius={4}
                      pathOptions={{
                        color: "#10b981",
                        weight: 1,
                        fillColor: "#10b981",
                        fillOpacity: 0.7,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-500/20" />
              <span>Líder (raio = alcance por cadastros)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Contato cadastrado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 rounded bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 opacity-50" />
              <span>Mapa de calor (densidade)</span>
            </div>
            <div className="text-muted-foreground">
              <span>Raio mín: 50m | máx: 5km</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
