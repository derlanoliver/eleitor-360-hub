import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeaderAutocomplete } from "@/components/office/LeaderAutocomplete";
import { Copy, Download, QrCode as QrCodeIcon } from "lucide-react";
import { generateEventAffiliateUrl } from "@/lib/urlHelper";
import { useToast } from "@/hooks/use-toast";
import QRCodeComponent from "qrcode";

interface EventAffiliateDialogProps {
  event: {
    id: string;
    slug: string;
    name: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventAffiliateDialog({ event, open, onOpenChange }: EventAffiliateDialogProps) {
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const { toast } = useToast();

  const handleGenerateLink = async () => {
    if (!selectedLeaderId) {
      toast({
        title: "Selecione um líder",
        description: "Escolha o líder que receberá o link de afiliado.",
        variant: "destructive"
      });
      return;
    }

    // Buscar o affiliate_token do líder
    const { data: leader } = await import("@/integrations/supabase/client").then(m => 
      m.supabase
        .from("lideres")
        .select("affiliate_token")
        .eq("id", selectedLeaderId)
        .single()
    );

    if (!leader?.affiliate_token) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link. Líder sem token de afiliado.",
        variant: "destructive"
      });
      return;
    }

    const url = generateEventAffiliateUrl(event.slug, leader.affiliate_token);
    setAffiliateUrl(url);

    // Gerar QR Code
    try {
      const qrData = await QRCodeComponent.toDataURL(url, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrData);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
    }

    toast({
      title: "Link gerado!",
      description: "Link de afiliado criado com sucesso."
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateUrl);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência."
    });
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.download = `qr-evento-${event.slug}.png`;
    link.href = qrCodeUrl;
    link.click();
    
    toast({
      title: "QR Code baixado!",
      description: "O QR Code foi salvo no seu dispositivo."
    });
  };

  const handleClose = () => {
    setSelectedLeaderId("");
    setSelectedCityId("");
    setAffiliateUrl("");
    setQrCodeUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar Link de Afiliado</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione o líder que receberá o link personalizado para o evento <strong>{event.name}</strong>. 
              As inscrições feitas através deste link serão atribuídas ao líder selecionado.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Líder</Label>
              <LeaderAutocomplete
                value={selectedLeaderId}
                onValueChange={setSelectedLeaderId}
                cityId={selectedCityId}
                placeholder="Busque por nome do líder..."
              />
            </div>

            <Button onClick={handleGenerateLink} className="w-full">
              Gerar Link de Afiliado
            </Button>
          </div>

          {affiliateUrl && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <Label>Link Gerado</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={affiliateUrl} readOnly className="flex-1" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-4 p-4 bg-muted rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 border-4 border-background rounded-lg" />
                  <Button variant="outline" onClick={handleDownloadQR} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar QR Code
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    O líder pode compartilhar este QR Code para facilitar o acesso ao link de inscrição
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
