import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ExternalLink
} from "lucide-react";

// Mock data para contatos
const mockContactsData = [
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
  const [contacts] = useState(mockContactsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [consentFilter, setConsentFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<any>(null);

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
    
    return matchesSearch && matchesRegion && matchesConsent;
  });

  const regions = [...new Set(contacts.map(contact => contact.region))];
  const totalWithWhatsApp = contacts.filter(c => c.consentWhatsApp).length;
  const totalWithEmail = contacts.filter(c => c.consentEmail).length;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Base de Contatos
              </h1>
              <p className="text-gray-600">
                {filteredContacts.length} contatos encontrados • 
                {totalWithWhatsApp} WhatsApp • {totalWithEmail} E-mail
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Importar Contatos
              </Button>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            </div>
          </div>
        </div>

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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Buscar contato
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome, e-mail ou profissão..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Região Administrativa
                  </label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
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

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Consentimento
                  </label>
                  <Select value={consentFilter} onValueChange={setConsentFilter}>
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
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.id} className="card-default hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-12 gap-4 items-center">
                      {/* Info Principal */}
                      <div className="md:col-span-4">
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

              {filteredContacts.length === 0 && (
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de detalhes do contato
const ContactDetails = ({ contact }: { contact: any }) => {
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
          <div className="space-y-3">
            {contact.events.length > 0 ? (
              contact.events.map((event: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.name}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={event.attended ? "default" : "secondary"}>
                    {event.attended ? "Compareceu" : "Não compareceu"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">
                Nenhuma participação em eventos registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;