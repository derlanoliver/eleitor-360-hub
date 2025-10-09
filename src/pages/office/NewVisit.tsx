import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CitySelect } from "@/components/office/CitySelect";
import { LeaderAutocomplete } from "@/components/office/LeaderAutocomplete";
import { PhoneInput } from "@/components/office/PhoneInput";
import { useCreateOfficeVisit } from "@/hooks/office/useOfficeVisits";
import { useOfficeSettings } from "@/hooks/office/useOfficeSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserPlus, QrCode } from "lucide-react";
import { ProtocolBadge } from "@/components/office/ProtocolBadge";
import { generateVisitFormUrl } from "@/lib/urlHelper";
import QRCode from "qrcode";
import { toast } from "sonner";

export default function NewVisit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [visitCreated, setVisitCreated] = useState<any>(null);
  
  const { data: settings } = useOfficeSettings();
  const createVisit = useCreateOfficeVisit();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }
    
    if (!nome || !whatsapp || !cidadeId || !leaderId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      const visit = await createVisit.mutateAsync({
        dto: { nome, whatsapp, cidade_id: cidadeId, leader_id: leaderId },
        userId: user.id,
        webhookUrl: settings?.webhook_url || "https://webhook.escaladigital.ai/webhook/gabinete/envio-formulario"
      });
      
      setVisitCreated(visit);
      
      const link = generateVisitFormUrl(visit.id, visit.leader_id, visit.contact_id);
      const qr = await QRCode.toDataURL(link);
      setQrCode(qr);
      
    } catch (error) {
      console.error("Erro ao criar visita:", error);
    }
  };
  
  const handleNewVisit = () => {
    setNome("");
    setWhatsapp("");
    setCidadeId("");
    setLeaderId("");
    setQrCode(null);
    setVisitCreated(null);
  };
  
  if (visitCreated) {
    const link = generateVisitFormUrl(visitCreated.id, visitCreated.leader_id, visitCreated.contact_id);
    
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">✓ Visita Registrada com Sucesso!</CardTitle>
            <CardDescription>
              A visita foi registrada e o link foi gerado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Protocolo</Label>
              <div className="mt-2">
                <ProtocolBadge protocolo={visitCreated.protocolo} />
              </div>
            </div>
            
            <div>
              <Label>Visitante</Label>
              <p className="text-sm mt-1">{visitCreated.contact?.nome}</p>
            </div>
            
            <div>
              <Label>Link do Formulário</Label>
              <div className="mt-2 p-3 bg-muted rounded-md break-all text-sm font-mono">
                {link}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast.success("Link copiado!");
                }}
              >
                Copiar Link
              </Button>
            </div>
            
            {qrCode && (
              <div>
                <Label className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Label>
                <div className="mt-2 flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button onClick={handleNewVisit} className="flex-1">
                <UserPlus className="mr-2 h-4 w-4" />
                Nova Visita
              </Button>
              <Button variant="outline" onClick={() => navigate("/office/queue")}>
                Ver Fila do Dia
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nova Visita ao Gabinete</CardTitle>
          <CardDescription>
            Cadastre rapidamente uma nova visita e gere o link do formulário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome completo"
                required
                disabled={createVisit.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <PhoneInput
                id="whatsapp"
                value={whatsapp}
                onValueChange={setWhatsapp}
                required
                disabled={createVisit.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade / RA *</Label>
              <CitySelect
                value={cidadeId}
                onValueChange={setCidadeId}
                disabled={createVisit.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="leader">Líder *</Label>
              <LeaderAutocomplete
                value={leaderId}
                onValueChange={setLeaderId}
                cityId={cidadeId}
                disabled={createVisit.isPending || !cidadeId}
              />
              {!cidadeId && (
                <p className="text-xs text-muted-foreground">
                  Selecione uma cidade primeiro para ver os líderes disponíveis
                </p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={createVisit.isPending}
            >
              {createVisit.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Visita
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
