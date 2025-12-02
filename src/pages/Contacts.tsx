import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegions } from "@/hooks/useRegions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImportContactsExcelDialog } from "@/components/contacts/ImportContactsExcelDialog";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { ImportEmailsDialog } from "@/components/contacts/ImportEmailsDialog";
import { useIdentifyGenders } from "@/hooks/contacts/useIdentifyGenders";
import { useContactEventParticipation } from "@/hooks/contacts/useContactEventParticipation";
import { formatPhoneToBR } from "@/utils/phoneNormalizer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  Filter, 
  Eye,
  Calendar,
  MessageSquare,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Edit,
  Sparkles,
  Loader2,
  FileSpreadsheet,
  Megaphone
} from "lucide-react";

// Cores e labels para badges de origem (cores suaves conforme preferência do usuário)
const sourceConfig: Record<string, { label: string; className: string; icon: typeof Calendar }> = {
  evento: { 
    label: "Evento", 
    className: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Calendar
  },
  lider: { 
    label: "Link de Líder", 
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: UserCheck
  },
  manual: { 
    label: "Importação", 
    className: "bg-gray-50 text-gray-600 border-gray-200",
    icon: FileSpreadsheet
  },
  captacao: { 
    label: "Captação", 
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Megaphone
  }
};

// Mock data antigo removido - agora usa dados reais
const mockContactsData_OLD = [
  {
    id: 1,
    name: "Ana Carolina Silva",
    phone: "61987654321",
    email: "ana.silva@email.com",
    region: "Águas Claras",
    profession: "Professora",
    registrationDate: "2024-01-15",
    source: "Líder: Maria Santos",
    consentWhatsApp: true,
    consentEmail: true,
    consentEvents: true,
    lastActivity: "2024-01-14",
    conversations: [
      { 
        date: "2024-01-14", 
        source: "WhatsApp", 
        categories: ["educação", "elogio"], 
        summary: "Parabenizou por projeto de educação integral" 
      },
      { 
        date: "2024-01-10", 
        source: "Evento", 
        categories: ["educação"], 
        summary: "Participou do evento sobre Educação no DF" 
      }
    ],
    events: [
      { name: "Educação no DF", date: "2024-01-10", attended: true }
    ]
  },
  {
    id: 2,
    name: "Carlos Eduardo Mendes",
    phone: "61912345678",
    email: "carlos.mendes@email.com",
    region: "Taguatinga",
    profession: "Empresário",
    registrationDate: "2024-01-12",
    source: "Campanha UTM: facebook_jan24",
    consentWhatsApp: true,
    consentEmail: false,
    consentEvents: true,
    lastActivity: "2024-01-13",
    conversations: [
      { 
        date: "2024-01-13", 
        source: "IA WhatsApp", 
        categories: ["empreendedorismo", "sugestão"], 
        summary: "Sugestão sobre incentivos para pequenas empresas" 
      }
    ],
    events: []
  },
  {
    id: 3,
    name: "Maria Fernanda Costa",
    phone: "61998765432",
    email: "maria.costa@email.com",
    region: "Brasília",
    profession: "Enfermeira",
    registrationDate: "2024-01-08",
    source: "Líder: João Oliveira",
    consentWhatsApp: true,
    consentEmail: true,
    consentEvents: true,
    lastActivity: "2024-01-12",
    conversations: [
      { 
        date: "2024-01-12", 
        source: "WhatsApp", 
        categories: ["saúde", "reclamação"], 
        summary: "Relato sobre falta de medicamentos na UPA" 
      },
      { 
        date: "2024-01-09", 
        source: "Líder", 
        categories: ["saúde"], 
        summary: "Discussão sobre melhorias na saúde pública" 
      }
    ],
    events: [
      { name: "Saúde em Foco", date: "2024-01-05", attended: false }
    ]
  },
  {
    id: 4,
    name: "Roberto Silva Santos",
    phone: "61987123456",
    email: "roberto.santos@email.com",
    region: "Ceilândia",
    profession: "Motorista",
    registrationDate: "2024-01-05",
    source: "Evento: Mobilidade Urbana",
    consentWhatsApp: true,
    consentEmail: true,
    consentEvents: false,
    lastActivity: "2024-01-11",
    conversations: [
      { 
        date: "2024-01-11", 
        source: "IA WhatsApp", 
        categories: ["mobilidade", "reclamação", "urgente"], 
        summary: "Problemas graves no transporte público" 
      }
    ],
    events: [
      { name: "Mobilidade Urbana", date: "2024-01-05", attended: true }
    ]
  }
];

// Mock categories
const categories = [
  "saúde", "educação", "segurança", "mobilidade", "emprego", "habitação",
  "assistência_social", "cultura", "esporte", "infraestrutura", "meio_ambiente",
  "tributação", "direitos_humanos", "empreendedorismo", "turismo", "outros"
];

const categoryColors: { [key: string]: string } = {
  "saúde": "bg-red-100 text-red-700",
  "educação": "bg-blue-100 text-blue-700",
  "segurança": "bg-orange-100 text-orange-700",
  "mobilidade": "bg-green-100 text-green-700",
  "emprego": "bg-purple-100 text-purple-700",
  "habitação": "bg-yellow-100 text-yellow-700",
  "empreendedorismo": "bg-indigo-100 text-indigo-700",
  "elogio": "bg-emerald-100 text-emerald-700",
  "reclamação": "bg-red-100 text-red-700",
  "sugestão": "bg-cyan-100 text-cyan-700",
  "urgente": "bg-red-200 text-red-800"
};

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [consentFilter, setConsentFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  // Estados para filtro de origem
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  
  const identifyGenders = useIdentifyGenders();

  // Buscar líderes ativos para o filtro
  const { data: leadersForFilter = [] } = useQuery({
    queryKey: ['leaders-for-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lideres')
        .select('id, nome_completo')
        .eq('is_active', true)
        .order('nome_completo');
      return data || [];
    }
  });

  // Buscar eventos para o filtro
  const { data: eventsForFilter = [] } = useQuery({
    queryKey: ['events-for-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name')
        .order('date', { ascending: false });
      return data || [];
    }
  });

  // Buscar funis de captação para o filtro
  const { data: funnelsForFilter = [] } = useQuery({
    queryKey: ['funnels-for-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_funnels')
        .select('id, nome')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Buscar contact_ids que participaram de eventos (para filtro de eventos)
  const { data: eventParticipantIds = [] } = useQuery({
    queryKey: ['event-participant-contact-ids', sourceFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('contact_id')
        .not('contact_id', 'is', null);
      
      if (error) throw error;
      return [...new Set((data || []).map(r => r.contact_id))];
    },
    enabled: sourceFilter === "evento"
  });

  // Buscar contact_ids de um evento específico
  const { data: specificEventContactIds = [] } = useQuery({
    queryKey: ['specific-event-contact-ids', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select('contact_id')
        .eq('event_id', selectedEventId)
        .not('contact_id', 'is', null);
      
      if (error) throw error;
      return [...new Set((data || []).map(r => r.contact_id))];
    },
    enabled: sourceFilter === "evento" && !!selectedEventId
  });

  // Buscar contatos reais do banco (em batches para contornar limite de 1000 do Supabase)
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      // Primeiro, obter total de registros
      const { count } = await supabase
        .from('office_contacts')
        .select('*', { count: 'exact', head: true });
      
      const totalRecords = count || 0;
      const batchSize = 1000;
      const batches = Math.ceil(totalRecords / batchSize);
      
      // Buscar em batches paralelos
      const batchPromises = [];
      for (let i = 0; i < batches; i++) {
        batchPromises.push(
          supabase
            .from('office_contacts')
            .select(`
              *,
              cidade:office_cities(id, nome, codigo_ra)
            `)
            .order('created_at', { ascending: false })
            .range(i * batchSize, (i + 1) * batchSize - 1)
        );
      }
      
      const results = await Promise.all(batchPromises);
      const data = results.flatMap(r => r.data || []);
      
      // Verificar se houve erro em algum batch
      const errorBatch = results.find(r => r.error);
      if (errorBatch?.error) throw errorBatch.error;

      // Buscar TODOS os líderes, campanhas e eventos de uma vez (muito mais eficiente)
      const liderIds = data?.filter(c => c.source_type === 'lider' && c.source_id).map(c => c.source_id) || [];
      const campanhaIds = data?.filter(c => c.source_type === 'campanha' && c.source_id).map(c => c.source_id) || [];
      const eventoIds = data?.filter(c => c.source_type === 'evento' && c.source_id).map(c => c.source_id) || [];
      const captacaoIds = data?.filter(c => c.source_type === 'captacao' && c.source_id).map(c => c.source_id) || [];

      const [lideresData, campanhasData, eventosData, captacaoCampanhasData] = await Promise.all([
        liderIds.length > 0 
          ? supabase.from('lideres').select('id, nome_completo').in('id', liderIds)
          : Promise.resolve({ data: [] }),
        campanhaIds.length > 0
          ? supabase.from('campaigns').select('id, nome, utm_campaign').in('id', campanhaIds)
          : Promise.resolve({ data: [] }),
        eventoIds.length > 0
          ? supabase.from('events').select('id, name').in('id', eventoIds)
          : Promise.resolve({ data: [] }),
        captacaoIds.length > 0
          ? supabase.from('lead_funnels').select('id, nome').in('id', captacaoIds)
          : Promise.resolve({ data: [] })
      ]);

      const lideresMap = new Map((lideresData.data || []).map((l: any) => [l.id, l]));
      const campanhasMap = new Map((campanhasData.data || []).map((c: any) => [c.id, c]));
      const eventosMap = new Map((eventosData.data || []).map((e: any) => [e.id, e]));
      const captacaoMap = new Map((captacaoCampanhasData.data || []).map((c: any) => [c.id, c]));
      
      // Transformar dados para formato compatível com a UI
      return (data || []).map((contact: any) => {
        let sourceInfo = 'Manual';
        let sourceName: string | null = null;
        const sourceType = contact.source_type || 'manual';
        
        if (contact.source_type === 'lider' && contact.source_id) {
          const lider = lideresMap.get(contact.source_id);
          sourceInfo = lider ? `Líder: ${lider.nome_completo}` : 'Líder: Desconhecido';
          sourceName = lider?.nome_completo || null;
        } else if (contact.source_type === 'campanha' && contact.source_id) {
          const campanha = campanhasMap.get(contact.source_id);
          sourceInfo = campanha ? `Campanha: ${campanha.nome}` : 'Campanha: Desconhecida';
          sourceName = campanha?.nome || null;
        } else if (contact.source_type === 'evento' && contact.source_id) {
          const evento = eventosMap.get(contact.source_id);
          sourceInfo = evento ? `Evento: ${evento.name}` : 'Evento: Desconhecido';
          sourceName = evento?.name || null;
        } else if (contact.source_type === 'captacao' && contact.source_id) {
          const campanha = captacaoMap.get(contact.source_id);
          sourceInfo = campanha ? `Captação: ${campanha.nome}` : 'Captação: Desconhecida';
          sourceName = campanha?.nome || null;
        }
        
        return {
          id: contact.id,
          name: contact.nome,
          phone: formatPhoneToBR(contact.telefone_norm),
          email: contact.email || '',
          region: contact.cidade?.nome || 'N/A',
          profession: '',
          registrationDate: new Date(contact.created_at).toISOString().split('T')[0],
          source: sourceInfo,
          sourceName,
          sourceType,
          consentWhatsApp: true,
          consentEmail: !!contact.email,
          consentEvents: true,
          lastActivity: new Date(contact.updated_at).toISOString().split('T')[0],
          conversations: [],
          events: [],
          // Keep raw data for editing
          cidade_id: contact.cidade_id,
          telefone_norm: contact.telefone_norm,
          source_type: contact.source_type,
          source_id: contact.source_id,
          genero: contact.genero
        };
      });
    }
  });

  // Buscar contagem total real (não limitada a 1000)
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['contacts-total-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('office_contacts')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Buscar contagem de contatos com telefone (WhatsApp)
  const { data: totalWithWhatsAppCount = 0 } = useQuery({
    queryKey: ['contacts-whatsapp-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('office_contacts')
        .select('*', { count: 'exact', head: true })
        .not('telefone_norm', 'is', null);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Buscar contagem de contatos com email
  const { data: totalWithEmailCount = 0 } = useQuery({
    queryKey: ['contacts-email-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('office_contacts')
        .select('*', { count: 'exact', head: true })
        .not('email', 'is', null);
      
      if (error) throw error;
      return count || 0;
    }
  });

  const handleWhatsAppClick = (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${normalizedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  // Filtros
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.profession.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === "all" || contact.region === selectedRegion;
    const matchesConsent = consentFilter === "all" || 
                          (consentFilter === "whatsapp" && contact.consentWhatsApp) ||
                          (consentFilter === "email" && contact.consentEmail) ||
                          (consentFilter === "events" && contact.consentEvents);
    
    // Filtro por Origem
    let matchesSource = true;
    if (sourceFilter !== "all") {
      const contactSourceType = contact.source_type || 'manual';
      
      if (sourceFilter === "manual") {
        // Manual inclui source_type = 'manual' ou null
        matchesSource = contactSourceType === 'manual' || contact.source_type === null;
      } else if (sourceFilter === "evento") {
        // Evento inclui:
        // 1. Contatos com source_type='evento'
        // 2. Contatos que participaram de eventos (via event_registrations)
        if (selectedEventId) {
          // Filtro por evento específico: apenas contatos inscritos nesse evento
          matchesSource = specificEventContactIds.includes(contact.id);
        } else {
          // Filtro geral de eventos: todos que participaram de qualquer evento
          matchesSource = contactSourceType === 'evento' || eventParticipantIds.includes(contact.id);
        }
      } else {
        matchesSource = contactSourceType === sourceFilter;
      }
      
      // Filtro adicional por líder específico
      if (sourceFilter === "lider" && selectedLeaderId) {
        matchesSource = contact.source_id === selectedLeaderId;
      }
      
      // Filtro adicional por campanha específica (captação)
      if (sourceFilter === "captacao" && selectedCampaignId) {
        matchesSource = contact.source_id === selectedCampaignId;
      }
    }
    
    return matchesSearch && matchesRegion && matchesConsent && matchesSource;
  });

  // Paginação
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Buscar todas as regiões administrativas
  const { data: allRegions = [] } = useRegions();
  
  // Reset para página 1 quando filtros mudarem
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Usar todas as regiões administrativas disponíveis no filtro
  const regions = allRegions.map(r => r.nome).sort();
  const totalWithWhatsApp = contacts.filter(c => c.consentWhatsApp).length;
  const totalWithEmail = contacts.filter(c => c.consentEmail).length;

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Base de Contatos
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {searchTerm === "" && selectedRegion === "all" && consentFilter === "all" && sourceFilter === "all"
                  ? totalCount 
                  : filteredContacts.length} contatos •
                {totalWithWhatsAppCount} WhatsApp • {totalWithEmailCount} E-mail
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
              <Button 
                variant="outline" 
                onClick={() => identifyGenders.mutate()}
                disabled={identifyGenders.isPending}
                className="flex-shrink-0"
              >
                {identifyGenders.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Identificando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Identificar Gêneros
                  </>
                )}
              </Button>
              <ImportContactsExcelDialog />
              <ImportEmailsDialog />
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Filtros */}
          <div className="lg:col-span-1">
            <Card className="card-default">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Filter className="h-5 w-5 text-primary-600 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Buscar contato
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome, e-mail ou profissão..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleFilterChange();
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Região Administrativa
                  </label>
                  <Select value={selectedRegion} onValueChange={(value) => {
                    setSelectedRegion(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as regiões" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as regiões</SelectItem>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Origem */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Origem
                  </label>
                  <Select value={sourceFilter} onValueChange={(value) => {
                    setSourceFilter(value);
                    setSelectedLeaderId(null);
                    setSelectedEventId(null);
                    setSelectedCampaignId(null);
                    handleFilterChange();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as origens" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as origens</SelectItem>
                      <SelectItem value="evento">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          Evento
                        </span>
                      </SelectItem>
                      <SelectItem value="lider">
                        <span className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                          Link de Líder
                        </span>
                      </SelectItem>
                      <SelectItem value="manual">
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-gray-600" />
                          Importação
                        </span>
                      </SelectItem>
                      <SelectItem value="captacao">
                        <span className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-amber-600" />
                          Captação
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Líder (condicional) */}
                {sourceFilter === "lider" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Líder
                    </label>
                    <Select 
                      value={selectedLeaderId || "all"} 
                      onValueChange={(value) => {
                        setSelectedLeaderId(value === "all" ? null : value);
                        handleFilterChange();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os líderes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os líderes</SelectItem>
                        {leadersForFilter.map(leader => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtro de Evento (condicional) */}
                {sourceFilter === "evento" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Evento
                    </label>
                    <Select 
                      value={selectedEventId || "all"} 
                      onValueChange={(value) => {
                        setSelectedEventId(value === "all" ? null : value);
                        handleFilterChange();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os eventos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os eventos</SelectItem>
                        {eventsForFilter.map(event => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtro de Funil de Captação (condicional - para Captação) */}
                {sourceFilter === "captacao" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Funil de Captação
                    </label>
                    <Select 
                      value={selectedCampaignId || "all"} 
                      onValueChange={(value) => {
                        setSelectedCampaignId(value === "all" ? null : value);
                        handleFilterChange();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os funis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os funis</SelectItem>
                        {funnelsForFilter.map(funnel => (
                          <SelectItem key={funnel.id} value={funnel.id}>
                            {funnel.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Consentimento
                  </label>
                  <Select value={consentFilter} onValueChange={(value) => {
                    setConsentFilter(value);
                    handleFilterChange();
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="events">Eventos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Contatos */}
          <div className="lg:col-span-3">
            {/* Info da Paginação */}
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a{" "}
                <span className="font-medium text-foreground">{Math.min(endIndex, filteredContacts.length)}</span> de{" "}
                <span className="font-medium text-foreground">
                  {searchTerm === "" && selectedRegion === "all" && consentFilter === "all" && sourceFilter === "all"
                    ? totalCount
                    : filteredContacts.length}
                </span> contatos
              </div>
              <div className="text-xs">
                Página {currentPage} de {totalPages || 1}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {paginatedContacts.map((contact) => (
                <Card key={contact.id} className="card-default hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                      {/* Info Principal */}
                      <div className="md:col-span-4 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                            {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {contact.name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {contact.profession}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {contact.region}
                            </p>
                            {/* Badges de Origem e Atribuição */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(() => {
                                const config = sourceConfig[contact.sourceType] || sourceConfig.manual;
                                const IconComponent = config.icon;
                                return (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs border ${config.className} py-0 px-1.5`}
                                  >
                                    <IconComponent className="h-3 w-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                );
                              })()}
                              {contact.sourceName && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs py-0 px-1.5 bg-background"
                                >
                                  {contact.sourceName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contato & Consentimentos */}
                      <div className="md:col-span-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{contact.phone}</span>
                            {contact.consentWhatsApp && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 truncate">{contact.email}</span>
                            {contact.consentEmail && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {contact.consentWhatsApp && (
                              <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                            )}
                            {contact.consentEmail && (
                              <Badge variant="outline" className="text-xs">E-mail</Badge>
                            )}
                            {contact.consentEvents && (
                              <Badge variant="outline" className="text-xs">Eventos</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Categorias & Ações */}
                      <div className="md:col-span-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {contact.conversations
                              .flatMap(conv => conv.categories)
                              .slice(0, 3)
                              .map((category, idx) => (
                                <Badge 
                                  key={idx} 
                                  className={`text-xs ${categoryColors[category] || 'bg-gray-100 text-gray-700'}`}
                                >
                                  {category}
                                </Badge>
                              ))
                            }
                            {contact.conversations.flatMap(conv => conv.categories).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.conversations.flatMap(conv => conv.categories).length - 3}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(contact.lastActivity).toLocaleDateString()}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setEditingContact({
                                  id: contact.id,
                                  nome: contact.name,
                                  telefone_norm: contact.telefone_norm,
                                  cidade_id: contact.cidade_id,
                                  source_type: contact.source_type,
                                  source_id: contact.source_id,
                                  genero: contact.genero
                                })}
                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {contact.consentWhatsApp && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWhatsAppClick(contact.phone)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              {contact.consentEmail && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEmailClick(contact.email)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedContact(contact)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes do Contato</DialogTitle>
                                  </DialogHeader>
                                  {selectedContact && <ContactDetails contact={selectedContact} />}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {paginatedContacts.length === 0 && (
                <Card className="card-default">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum contato encontrado
                    </h3>
                    <p className="text-gray-600">
                      Tente ajustar os filtros ou adicionar novos contatos.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Componente de Paginação */}
            {totalPages > 1 && (
              <Card className="card-default mt-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="gap-2"
                    >
                      <span className="hidden sm:inline">Anterior</span>
                      <span className="sm:hidden">←</span>
                    </Button>

                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* Primeira página */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={currentPage === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-9 h-9 p-0"
                          >
                            1
                          </Button>
                          {currentPage > 4 && (
                            <span className="px-1 text-muted-foreground">...</span>
                          )}
                        </>
                      )}

                      {/* Páginas ao redor da atual */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === currentPage ||
                                 page === currentPage - 1 ||
                                 page === currentPage + 1 ||
                                 (currentPage <= 2 && page <= 3) ||
                                 (currentPage >= totalPages - 1 && page >= totalPages - 2);
                        })
                        .map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-9 h-9 p-0"
                          >
                            {page}
                          </Button>
                        ))}

                      {/* Última página */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <span className="px-1 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-9 h-9 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="gap-2"
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <span className="sm:hidden">→</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Edição */}
      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
        />
      )}
    </div>
  );
};

// Componente de detalhes do contato
const ContactDetails = ({ contact }: { contact: any }) => {
  // Buscar participação em eventos real
  const { data: eventParticipation = [], isLoading: isLoadingEvents } = useContactEventParticipation(contact.id);
  
  const handleWhatsAppClick = (phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${normalizedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Nome</label>
              <p className="font-semibold">{contact.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Profissão</label>
              <p>{contact.profession}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Região</label>
              <p>{contact.region}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Origem</label>
              <p className="text-sm">{contact.source}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Data de Cadastro</label>
              <p className="text-sm">{new Date(contact.registrationDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contato & Consentimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                {contact.consentWhatsApp ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWhatsAppClick(contact.phone)}
                  disabled={!contact.consentWhatsApp}
                  className="text-green-600 hover:bg-green-50"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{contact.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                {contact.consentEmail ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                  disabled={!contact.consentEmail}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Eventos</span>
              </div>
              {contact.consentEvents ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Conversas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 text-primary-600 mr-2" />
            Histórico de Conversas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contact.conversations.map((conversation: any, idx: number) => (
              <div key={idx} className="border-l-4 border-primary-200 pl-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {conversation.source}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {new Date(conversation.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {conversation.categories.map((category: string, catIdx: number) => (
                      <Badge 
                        key={catIdx}
                        className={`text-xs ${categoryColors[category] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{conversation.summary}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Participação em Eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 text-primary-600 mr-2" />
            Participação em Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {eventParticipation.length > 0 ? (
                eventParticipation.map((participation) => (
                  <div key={participation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{participation.event_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(participation.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        {participation.event_time && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <p className="text-sm text-muted-foreground">
                              {participation.event_time.substring(0, 5)}
                            </p>
                          </>
                        )}
                      </div>
                      {participation.checked_in && participation.checked_in_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Check-in: {format(new Date(participation.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <Badge variant={participation.checked_in ? "default" : "secondary"}>
                      {participation.checked_in ? "Compareceu" : "Inscrito"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma participação em eventos registrada
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;