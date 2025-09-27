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
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  UserCheck,
  BarChart3,
  Filter,
  Search
} from "lucide-react";

// Mock data para eventos
const mockEventsData = [
  {
    id: 1,
    name: "Educação no DF: Propostas e Soluções",
    description: "Encontro para discutir melhorias na educação pública do Distrito Federal",
    date: "2024-02-15",
    time: "19:00",
    location: "Centro de Convenções Ulysses Guimarães",
    address: "SCTS, Trecho 3, Lote 4 - Asa Sul, Brasília - DF",
    capacity: 500,
    category: "educação",
    status: "active",
    registrations: 234,
    checkedIn: 198,
    region: "Brasília",
    createdAt: "2024-01-10"
  },
  {
    id: 2,
    name: "Saúde em Foco: UPAs e Hospitais Regionais",
    description: "Debate sobre melhorias nos serviços de saúde pública",
    date: "2024-02-20",
    time: "14:00",
    location: "Auditório do Hospital Regional de Taguatinga",
    address: "QNM 42, AE 01 - Taguatinga Norte, Taguatinga - DF",
    capacity: 200,
    category: "saúde",
    status: "active",
    registrations: 156,
    checkedIn: 0,
    region: "Taguatinga",
    createdAt: "2024-01-12"
  },
  {
    id: 3,
    name: "Mobilidade Urbana: Transporte Público Eficiente",
    description: "Soluções para melhorar o transporte público no DF",
    date: "2024-02-10",
    time: "18:30",
    location: "Terminal Rodoviário de Ceilândia",
    address: "Ceilândia Centro, Ceilândia - DF",
    capacity: 300,
    category: "mobilidade",
    status: "completed",
    registrations: 267,
    checkedIn: 223,
    region: "Ceilândia",
    createdAt: "2024-01-08"
  }
];

// Mock data para inscrições
const mockRegistrationsData = [
  {
    id: 1,
    eventId: 1,
    contactName: "Ana Carolina Silva",
    contactEmail: "ana.silva@email.com",
    contactPhone: "61987654321",
    registrationDate: "2024-01-15",
    qrCode: "EVT001-ACS-20240115",
    checkedIn: true,
    checkInTime: "2024-02-15T19:15:00",
    source: "Líder: Maria Santos"
  },
  {
    id: 2,
    eventId: 1,
    contactName: "Carlos Eduardo Mendes",
    contactEmail: "carlos.mendes@email.com",
    contactPhone: "61912345678",
    registrationDate: "2024-01-18",
    qrCode: "EVT001-CEM-20240118",
    checkedIn: true,
    checkInTime: "2024-02-15T19:05:00",
    source: "Campanha Facebook"
  },
  {
    id: 3,
    eventId: 2,
    contactName: "Maria Fernanda Costa",
    contactEmail: "maria.costa@email.com",
    contactPhone: "61998765432",
    registrationDate: "2024-01-20",
    qrCode: "EVT002-MFC-20240120",
    checkedIn: false,
    checkInTime: null,
    source: "Líder: João Oliveira"
  }
];

const eventCategories = [
  { value: "educação", label: "Educação", color: "bg-blue-100 text-blue-700" },
  { value: "saúde", label: "Saúde", color: "bg-red-100 text-red-700" },
  { value: "segurança", label: "Segurança", color: "bg-orange-100 text-orange-700" },
  { value: "mobilidade", label: "Mobilidade", color: "bg-green-100 text-green-700" },
  { value: "habitação", label: "Habitação", color: "bg-yellow-100 text-yellow-700" },
  { value: "cultura", label: "Cultura", color: "bg-purple-100 text-purple-700" },
  { value: "esporte", label: "Esporte", color: "bg-indigo-100 text-indigo-700" },
  { value: "meio_ambiente", label: "Meio Ambiente", color: "bg-emerald-100 text-emerald-700" }
];

const regions = ["Brasília", "Taguatinga", "Ceilândia", "Águas Claras", "Planaltina", "Gama", "Samambaia"];

const Events = () => {
  const [events, setEvents] = useState(mockEventsData);
  const [registrations] = useState(mockRegistrationsData);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    address: "",
    capacity: "",
    category: "",
    region: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos nome, data, horário e local.",
        variant: "destructive"
      });
      return;
    }

    const event = {
      id: events.length + 1,
      ...newEvent,
      capacity: parseInt(newEvent.capacity) || 100,
      status: "active" as const,
      registrations: 0,
      checkedIn: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setEvents([...events, event]);
    setNewEvent({ name: "", description: "", date: "", time: "", location: "", address: "", capacity: "", category: "", region: "" });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Evento criado!",
      description: "Evento criado com sucesso. As inscrições já estão abertas."
    });
  };

  const deleteEvent = (eventId: number) => {
    setEvents(events.filter(event => event.id !== eventId));
    toast({
      title: "Evento excluído",
      description: "O evento foi removido com sucesso."
    });
  };

  const toggleEventStatus = (eventId: number) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, status: event.status === "active" ? "completed" : "active" }
        : event
    ));
  };

  const generateQRCode = (registration: any) => {
    // Mock QR code generation
    const qrData = `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">${registration.qrCode}</text></svg>`)}`;
    
    const link = document.createElement('a');
    link.download = `qr-${registration.qrCode}.svg`;
    link.href = qrData;
    link.click();
    
    toast({
      title: "QR Code gerado!",
      description: "QR Code de check-in baixado com sucesso."
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
    return cat?.color || "bg-gray-100 text-gray-700";
  };

  const getEventRegistrations = (eventId: number) => {
    return registrations.filter(reg => reg.eventId === eventId);
  };

  const getAttendanceRate = (event: any) => {
    if (event.registrations === 0) return 0;
    return Math.round((event.checkedIn / event.registrations) * 100);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestão de Eventos
              </h1>
              <p className="text-gray-600">
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                </DialogHeader>
                <CreateEventForm 
                  newEvent={newEvent}
                  setNewEvent={setNewEvent}
                  onSubmit={handleCreateEvent}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Lista de Eventos */}
          <TabsContent value="events">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Filtros */}
              <div className="lg:col-span-1">
                <Card className="card-default">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Filter className="h-5 w-5 text-primary-600 mr-2" />
                      Filtros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Buscar evento</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                          <SelectItem value="completed">Realizados</SelectItem>
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
                          {eventCategories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista */}
              <div className="lg:col-span-3 space-y-4">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="card-default hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-12 gap-4">
                        {/* Info Principal */}
                        <div className="md:col-span-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">
                                {event.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {event.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={event.status === "active" ? "default" : "secondary"}>
                                  {event.status === "active" ? "Ativo" : "Realizado"}
                                </Badge>
                                <Badge className={getCategoryColor(event.category)}>
                                  {eventCategories.find(c => c.value === event.category)?.label || event.category}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(event.date).toLocaleDateString()} às {event.time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {event.location}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Capacidade: {event.capacity} pessoas
                            </div>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="md:col-span-4">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs text-gray-600">Inscrições</p>
                              <p className="font-bold text-blue-600">{event.registrations}</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <p className="text-xs text-gray-600">Presença</p>
                              <p className="font-bold text-green-600">{event.checkedIn}</p>
                            </div>
                          </div>
                          
                          <div className="text-center p-3 bg-primary-50 rounded-lg">
                            <p className="text-xs text-gray-600">Taxa de Presença</p>
                            <p className="font-bold text-primary-600">{getAttendanceRate(event)}%</p>
                          </div>

                          <div className="mt-3 text-xs text-gray-500">
                            <p>Região: {event.region}</p>
                            <p>Criado em {new Date(event.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="md:col-span-3">
                          <div className="flex flex-col space-y-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedEvent(event)}
                                  className="w-full"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Evento</DialogTitle>
                                </DialogHeader>
                                {selectedEvent && <EventDetails event={selectedEvent} registrations={getEventRegistrations(selectedEvent.id)} />}
                              </DialogContent>
                            </Dialog>

                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleEventStatus(event.id)}
                              >
                                {event.status === "active" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              </Button>
                            </div>

                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteEvent(event.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredEvents.length === 0 && (
                  <Card className="card-default">
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum evento encontrado
                      </h3>
                      <p className="text-gray-600">
                        Tente ajustar os filtros ou criar um novo evento.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Check-in */}
          <TabsContent value="checkin">
            <CheckInSection registrations={registrations} generateQRCode={generateQRCode} />
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="reports">
            <EventReports events={events} registrations={registrations} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Componente para criar evento
const CreateEventForm = ({ newEvent, setNewEvent, onSubmit }: any) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Evento *</Label>
        <Input
          id="name"
          value={newEvent.name}
          onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
          placeholder="Ex: Educação no DF: Propostas e Soluções"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={newEvent.description}
          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          placeholder="Descreva o objetivo e conteúdo do evento..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div>
        <Label htmlFor="location">Local *</Label>
        <Input
          id="location"
          value={newEvent.location}
          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          placeholder="Ex: Centro de Convenções Ulysses Guimarães"
        />
      </div>

      <div>
        <Label htmlFor="address">Endereço Completo</Label>
        <Input
          id="address"
          value={newEvent.address}
          onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
          placeholder="Endereço completo do evento..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
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
          <Label htmlFor="category">Categoria</Label>
          <Select value={newEvent.category} onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="region">Região</Label>
          <Select value={newEvent.region} onValueChange={(value) => setNewEvent({ ...newEvent, region: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {regions.map(region => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={() => setNewEvent({ name: "", description: "", date: "", time: "", location: "", address: "", capacity: "", category: "", region: "" })}>
          Limpar
        </Button>
        <Button onClick={onSubmit}>
          Criar Evento
        </Button>
      </div>
    </div>
  );
};

// Componente de detalhes do evento
const EventDetails = ({ event, registrations }: any) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Nome</Label>
              <p className="font-semibold">{event.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Descrição</Label>
              <p className="text-sm">{event.description}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Data e Horário</Label>
              <p>{new Date(event.date).toLocaleDateString()} às {event.time}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Local</Label>
              <p>{event.location}</p>
              {event.address && <p className="text-sm text-gray-600">{event.address}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Inscrições</p>
                <p className="text-2xl font-bold text-blue-600">{event.registrations}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Check-ins</p>
                <p className="text-2xl font-bold text-green-600">{event.checkedIn}</p>
              </div>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-gray-600">Taxa de Presença</p>
              <p className="text-xl font-bold text-primary-600">
                {event.registrations > 0 ? Math.round((event.checkedIn / event.registrations) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Inscrições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {registrations.length > 0 ? (
              registrations.map((registration: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{registration.contactName}</h4>
                    <p className="text-sm text-gray-600">{registration.contactEmail}</p>
                    <p className="text-xs text-gray-500">
                      Inscrito em {new Date(registration.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={registration.checkedIn ? "default" : "secondary"}>
                      {registration.checkedIn ? "Presente" : "Ausente"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 py-8">
                Nenhuma inscrição encontrada para este evento.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Seção de Check-in
const CheckInSection = ({ registrations, generateQRCode }: any) => {
  const [searchQR, setSearchQR] = useState("");

  const filteredRegistrations = registrations.filter((reg: any) =>
    reg.qrCode.toLowerCase().includes(searchQR.toLowerCase()) ||
    reg.contactName.toLowerCase().includes(searchQR.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Label>Buscar por QR Code ou Nome</Label>
          <Input
            placeholder="Digite o código QR ou nome do participante..."
            value={searchQR}
            onChange={(e) => setSearchQR(e.target.value)}
          />
        </div>
        <Button>
          <UserCheck className="h-4 w-4 mr-2" />
          Fazer Check-in
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participantes Inscritos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRegistrations.map((registration: any) => (
              <div key={registration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{registration.contactName}</h4>
                  <p className="text-sm text-gray-600">{registration.contactEmail}</p>
                  <p className="text-xs text-gray-500 font-mono">{registration.qrCode}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={registration.checkedIn ? "default" : "secondary"}>
                    {registration.checkedIn ? "Presente" : "Pendente"}
                  </Badge>
                  {registration.checkedIn && registration.checkInTime && (
                    <p className="text-xs text-gray-500">
                      Check-in: {new Date(registration.checkInTime).toLocaleString()}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQRCode(registration)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Relatórios
const EventReports = ({ events, registrations }: any) => {
  const getEventsByRegion = () => {
    const regionCounts = events.reduce((acc: any, event: any) => {
      acc[event.region] = (acc[event.region] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(regionCounts).map(([region, count]) => ({
      region,
      events: count,
      registrations: events
        .filter((e: any) => e.region === region)
        .reduce((sum: number, e: any) => sum + e.registrations, 0)
    }));
  };

  const getEventsByCategory = () => {
    const categoryCounts = events.reduce((acc: any, event: any) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      events: count,
      registrations: events
        .filter((e: any) => e.category === category)
        .reduce((sum: number, e: any) => sum + e.registrations, 0)
    }));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Eventos por Região
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getEventsByRegion().map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{item.region}</h4>
                  <p className="text-sm text-gray-600">{item.events} eventos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{item.registrations}</p>
                  <p className="text-xs text-gray-500">inscrições</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Eventos por Categoria
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getEventsByCategory().map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium capitalize">{item.category}</h4>
                  <p className="text-sm text-gray-600">{item.events} eventos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{item.registrations}</p>
                  <p className="text-xs text-gray-500">inscrições</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Events;