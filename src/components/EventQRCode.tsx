import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, QrCode, Copy, MessageCircle, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from 'qrcode';

interface EventQRCodeProps {
  event: {
    id: number;
    name: string;
    date: string;
    category: string;
  };
}

// Função para gerar código randômico
const generateTrackingCode = (eventId: number, eventName: string) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const eventPrefix = eventName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  
  return `${eventPrefix}${eventId}${random}${timestamp.substring(0, 4).toUpperCase()}`;
};

// Função para formatar nome do evento para URL
const formatEventSlug = (eventName: string) => {
  return eventName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplos
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
};

const EventQRCode = ({ event }: EventQRCodeProps) => {
  const [trackingCode] = useState(() => generateTrackingCode(event.id, event.name));
  const [whatsappQR, setWhatsappQR] = useState<string>("");
  const [registrationQR, setRegistrationQR] = useState<string>("");
  const { toast } = useToast();

  // URLs
  const eventSlug = formatEventSlug(event.name);
  const whatsappMessage = encodeURIComponent(`#${trackingCode} - Quero me cadastrar para o Evento ${event.name}`);
  const whatsappURL = `https://wa.me/5561987654321?text=${whatsappMessage}`;
  const registrationURL = `https://cadastro.rafaelprudente.com/${eventSlug}?utm_source=qr&utm_medium=offline&utm_campaign=evento_${event.id}&utm_content=${trackingCode}`;

  useEffect(() => {
    // Gerar QR Codes
    const generateQRCodes = async () => {
      try {
        const whatsappQRData = await QRCode.toDataURL(whatsappURL, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        const registrationQRData = await QRCode.toDataURL(registrationURL, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        setWhatsappQR(whatsappQRData);
        setRegistrationQR(registrationQRData);
      } catch (error) {
        console.error('Erro ao gerar QR codes:', error);
      }
    };

    generateQRCodes();
  }, [whatsappURL, registrationURL]);

  const downloadQRCode = async (type: 'whatsapp' | 'registration') => {
    try {
      const url = type === 'whatsapp' ? whatsappURL : registrationURL;
      const filename = `qr-${type}-evento-${event.id}-${trackingCode}`;
      
      // Gerar QR code em alta definição
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Download
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = qrDataURL;
      link.click();

      toast({
        title: "QR Code baixado!",
        description: `QR Code de ${type === 'whatsapp' ? 'WhatsApp' : 'cadastro'} salvo em alta definição.`
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar o QR Code.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: `Link de ${type} copiado para a área de transferência.`
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* QR Code WhatsApp */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm">
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            QR Code WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <Badge variant="secondary" className="text-xs font-mono mb-2">
              {trackingCode}
            </Badge>
          </div>
          
          {whatsappQR && (
            <div className="bg-white p-3 rounded-lg border text-center">
              <img 
                src={whatsappQR} 
                alt="QR Code WhatsApp" 
                className="w-24 h-24 mx-auto"
              />
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadQRCode('whatsapp')}
            className="w-full text-xs"
          >
            <Download className="h-3 w-3 mr-2" />
            Baixar QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Link de Cadastro */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => copyToClipboard(registrationURL, 'cadastro')}
        className="w-full text-xs"
      >
        <Link2 className="h-3 w-3 mr-2" />
        Copiar Link
      </Button>
    </div>
  );
};

export default EventQRCode;