import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock,
  Users,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Download,
  UserCheck,
  BarChart3,
  Filter,
  Search,
  Link as LinkIcon,
  Copy,
  Upload,
  UserPlus
} from "lucide-react";
import { useEvents } from "@/hooks/events/useEvents";
import { useCreateEvent } from "@/hooks/events/useCreateEvent";
import { useUpdateEvent } from "@/hooks/events/useUpdateEvent";
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";
import { useEventRegistrations, useUpdateCheckIn } from "@/hooks/events/useEventRegistrations";
import { useOfficeCities } from "@/hooks/office/useOfficeCities";
import { generateEventUrl } from "@/lib/eventUrlHelper";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EventQRCode from "@/components/EventQRCode";
import { EventAffiliateDialog } from "@/components/events/EventAffiliateDialog";

const eventCategories = [
  { value: "educacao", label: "Educação", color: "bg-blue-500" },
  { value: "saude", label: "Saúde", color: "bg-green-500" },
  { value: "seguranca", label: "Segurança", color: "bg-red-500" },
  { value: "infraestrutura", label: "Infraestrutura", color: "bg-yellow-500" },
  { value: "cultura", label: "Cultura", color: "bg-purple-500" },
  { value: "esporte", label: "Esporte", color: "bg-orange-500" },
  { value: "meio_ambiente", label: "Meio Ambiente", color: "bg-teal-500" },
  { value: "desenvolvimento", label: "Desenvolvimento", color: "bg-indigo-500" }
];

const Events = () => {
  const { data: events = [], isLoading } = useEvents();
  const { data: cities = [] } = useOfficeCities();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [qrCodeEvent, setQrCodeEvent] = useState<any>(null);
  const [affiliateDialogEvent, setAffiliateDialogEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    slug: "",
    description: "",
    date: "",
    time: "",
    location: "",
    address: "",
    capacity: "100",
    category: "",
    region: "",
    coverImage: null as File | null
  });

  const { toast } = useToast();

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.slug || !newEvent.date || !newEvent.time || !newEvent.location || !newEvent.category || !newEvent.region) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createEvent.mutateAsync({
        name: newEvent.name,
        slug: newEvent.slug,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        address: newEvent.address,
        capacity: parseInt(newEvent.capacity),
        category: newEvent.category,
        region: newEvent.region,
        coverImage: newEvent.coverImage || undefined
      });
      
      setNewEvent({ 
        name: "", 
        slug: "", 
        description: "", 
        date: "", 
        time: "", 
        location: "", 
        address: "", 
        capacity: "100", 
        category: "", 
        region: "",
        coverImage: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    try {
      await updateEvent.mutateAsync({
        id: editingEvent.id,
        name: editingEvent.name,
        slug: editingEvent.slug,
        description: editingEvent.description,
        date: editingEvent.date,
        time: editingEvent.time,
        location: editingEvent.location,
        address: editingEvent.address,
        capacity: parseInt(editingEvent.capacity),
        category: editingEvent.category,
        region: editingEvent.region,
        status: editingEvent.status,
        coverImage: editingEvent.coverImage || undefined
      });
      
      setEditingEvent(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      await deleteEvent.mutateAsync(eventId);
    }
  };

  const copyEventLink = (slug: string) => {
    const url = generateEventUrl(slug);
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Link do evento copiado para a área de transferência."
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const cat = eventCategories.find(c => c.value === category);
    return cat?.color || "bg-gray-500";
  };

  const getCategoryLabel = (category: string) => {
    const cat = eventCategories.find(c => c.value === category);
    return cat?.label || category;
  };

  const getAttendanceRate = (event: any) => {
    if (event.registrations_count === 0) return 0;
    return Math.round((event.checkedin_count / event.registrations_count) * 100);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Gestão de Eventos
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {filteredEvents.length} eventos encontrados
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Nome do Evento *</Label>
                      <Input
                        id="name"
                        value={newEvent.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name.toLowerCase()
                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "");
                          setNewEvent({ ...newEvent, name, slug });
                        }}
                        placeholder="Nome do evento"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="slug">Slug (URL) *</Label>
                      <Input
                        id="slug"
                        value={newEvent.slug}
                        onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
                        placeholder="evento-exemplo"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        URL: {generateEventUrl(newEvent.slug || "slug")}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Descrição do evento"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="time">Horário *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="location">Local *</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="Nome do local"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="address">Endereço Completo</Label>
                      <Input
                        id="address"
                        value={newEvent.address}
                        onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
                        placeholder="Endereço completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="capacity">Capacidade</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newEvent.capacity}
                        onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <Select value={newEvent.category} onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="region">Região *</Label>
                      <Select value={newEvent.region} onValueChange={(value) => setNewEvent({ ...newEvent, region: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a cidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.nome}>
                              {city.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="coverImage">Imagem de Capa</Label>
                      <Input
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewEvent({ ...newEvent, coverImage: e.target.files?.[0] || null })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Recomendado: 1920x1080px (16:9)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateEvent} disabled={createEvent.isPending}>
                      {createEvent.isPending ? "Criando..." : "Criar Evento"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="events" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Lista de Eventos */}
          <TabsContent value="events">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Filtros */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Filter className="h-5 w-5 mr-2" />
                      Filtros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Buscar evento</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Nome ou local..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="completed">Concluídos</SelectItem>
                          <SelectItem value="cancelled">Cancelados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Categoria</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {eventCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Grid de Eventos */}
              <div className="lg:col-span-3">
                <div className="grid gap-4">
                  {filteredEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Imagem */}
                          <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {event.cover_image_url ? (
                              <img
                                src={event.cover_image_url}
                                alt={event.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full ${getCategoryColor(event.category)} flex items-center justify-center`}>
                                <Calendar className="h-12 w-12 text-white opacity-50" />
                              </div>
                            )}
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold mb-1 truncate">{event.name}</h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge className={`${getCategoryColor(event.category)} text-white`}>
                                    {getCategoryLabel(event.category)}
                                  </Badge>
                                  <Badge variant={event.status === "active" ? "default" : "secondary"}>
                                    {event.status === "active" ? "Ativo" : event.status === "completed" ? "Concluído" : "Cancelado"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setQrCodeEvent(event)}
                                  title="QR Code"
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyEventLink(event.slug)}
                                  title="Copiar link"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingEvent({
                                      ...event,
                                      coverImage: null
                                    });
                                    setIsEditDialogOpen(true);
                                  }}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteEvent(event.id)}
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {event.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.region}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.registrations_count}/{event.capacity}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div>
                                <span className="font-medium">Inscritos:</span> {event.registrations_count}
                              </div>
                              <div>
                                <span className="font-medium">Check-in:</span> {event.checkedin_count}
                              </div>
                              <div>
                                <span className="font-medium">Taxa presença:</span> {getAttendanceRate(event)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEventId(event.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes e Inscrições
                          </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAffiliateDialogEvent(event)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Link do Líder
                  </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredEvents.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum evento encontrado</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin">
            <CheckInSection events={events} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <EventReports events={events} />
          </TabsContent>
        </Tabs>

        {/* Event Details Dialog */}
        {selectedEventId && (
          <EventDetailsDialog
            eventId={selectedEventId}
            onClose={() => setSelectedEventId(null)}
          />
        )}

        {/* Edit Event Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Evento</DialogTitle>
            </DialogHeader>
            {editingEvent && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome do Evento *</Label>
                    <Input
                      value={editingEvent.name}
                      onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Slug (URL) *</Label>
                    <Input
                      value={editingEvent.slug}
                      onChange={(e) => setEditingEvent({ ...editingEvent, slug: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={editingEvent.description || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Horário *</Label>
                    <Input
                      type="time"
                      value={editingEvent.time}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Local *</Label>
                    <Input
                      value={editingEvent.location}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                      placeholder="Nome do local"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Endereço Completo</Label>
                    <Input
                      value={editingEvent.address || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, address: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>

                  <div>
                    <Label>Capacidade</Label>
                    <Input
                      type="number"
                      value={editingEvent.capacity}
                      onChange={(e) => setEditingEvent({ ...editingEvent, capacity: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Categoria *</Label>
                    <Select 
                      value={editingEvent.category} 
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Região *</Label>
                    <Select 
                      value={editingEvent.region} 
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, region: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.nome}>
                            {city.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Imagem de Capa</Label>
                    
                    {editingEvent.cover_image_url && (
                      <div className="mb-2 relative rounded-lg overflow-hidden">
                        <img 
                          src={editingEvent.cover_image_url} 
                          alt="Cover atual" 
                          className="w-full h-40 object-cover"
                        />
                        <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur">
                          Imagem atual
                        </Badge>
                      </div>
                    )}
                    
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditingEvent({ 
                        ...editingEvent, 
                        coverImage: e.target.files?.[0] || null 
                      })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione uma nova imagem para substituir a atual (Recomendado: 1920x1080px)
                    </p>
                  </div>

                  <div className="col-span-2">
                    <Label>Status</Label>
                    <Select 
                      value={editingEvent.status} 
                      onValueChange={(value) => setEditingEvent({ ...editingEvent, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateEvent} disabled={updateEvent.isPending}>
                    {updateEvent.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={!!qrCodeEvent} onOpenChange={() => setQrCodeEvent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code - {qrCodeEvent?.name}</DialogTitle>
            </DialogHeader>
            {qrCodeEvent && (
              <EventQRCode event={qrCodeEvent} />
            )}
          </DialogContent>
        </Dialog>

        {/* Affiliate Link Dialog */}
        {affiliateDialogEvent && (
          <EventAffiliateDialog
            event={affiliateDialogEvent}
            open={!!affiliateDialogEvent}
            onOpenChange={(open) => !open && setAffiliateDialogEvent(null)}
          />
        )}
      </div>
    </div>
  );
};

// Event Details Dialog Component
function EventDetailsDialog({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { data: registrations = [], isLoading } = useEventRegistrations(eventId);
  const updateCheckIn = useUpdateCheckIn();
  const { data: events = [] } = useEvents();
  const event = events.find(e => e.id === eventId);

  if (!event) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Inscritos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{event.registrations_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{event.checkedin_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vagas Restantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{event.capacity - event.registrations_count}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inscrições</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Carregando...</p>
              ) : registrations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma inscrição ainda</p>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{reg.nome}</p>
                        <p className="text-sm text-muted-foreground">{reg.email}</p>
                        <p className="text-xs text-muted-foreground">{reg.whatsapp}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reg.checked_in ? (
                          <Badge variant="default" className="bg-green-500">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Check-in feito
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCheckIn.mutate({ id: reg.id, checked_in: true })}
                          >
                            Fazer Check-in
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Check-in Section Component
function CheckInSection({ events }: { events: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const { data: registrations = [] } = useEventRegistrations(selectedEventId);
  
  const filteredRegistrations = registrations.filter((reg: any) =>
    reg.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buscar Inscrição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione o Evento</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um evento" />
              </SelectTrigger>
              <SelectContent>
                {events.filter(e => e.status === "active").map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEventId && (
            <div>
              <Label>Buscar Participante</Label>
              <Input
                placeholder="Nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEventId && (
        <div className="grid gap-4">
          {filteredRegistrations.map((reg: any) => (
            <Card key={reg.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{reg.nome}</p>
                    <p className="text-sm text-muted-foreground">{reg.email}</p>
                  </div>
                  <Badge variant={reg.checked_in ? "default" : "secondary"} className={reg.checked_in ? "bg-green-500" : ""}>
                    {reg.checked_in ? "Check-in feito" : "Aguardando"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Reports Component
function EventReports({ events }: { events: any[] }) {
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === "active").length;
  const totalRegistrations = events.reduce((sum, e) => sum + e.registrations_count, 0);
  const totalCheckIns = events.reduce((sum, e) => sum + e.checkedin_count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEvents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Eventos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeEvents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Inscrições</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRegistrations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCheckIns}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {eventCategories.map((cat) => {
              const count = events.filter(e => e.category === cat.value).length;
              if (count === 0) return null;
              return (
                <div key={cat.value} className="flex items-center justify-between p-2 border border-border rounded">
                  <span>{cat.label}</span>
                  <Badge className={`${cat.color} text-white`}>{count}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Events;
