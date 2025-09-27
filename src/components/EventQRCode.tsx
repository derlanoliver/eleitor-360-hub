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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm">
          <QrCode className="h-4 w-4 mr-2 text-primary-600" />
          QR Codes do Evento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Código de Rastreamento */}
        <div className="text-center">
          <Badge variant="secondary" className="text-xs font-mono">
            {trackingCode}
          </Badge>
          <p className="text-xs text-gray-500 mt-1">Código de rastreamento</p>
        </div>

        {/* QR Code WhatsApp */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-xs font-medium">WhatsApp</span>
            </div>
          </div>
          
          {whatsappQR && (
            <div className="bg-white p-2 rounded-lg border text-center">
              <img 
                src={whatsappQR} 
                alt="QR Code WhatsApp" 
                className="w-20 h-20 mx-auto"
              />
            </div>
          )}
          
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadQRCode('whatsapp')}
              className="flex-1 text-xs h-7"
            >
              <Download className="h-3 w-3 mr-1" />
              Baixar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(whatsappURL, 'WhatsApp')}
              className="h-7 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* QR Code Cadastro */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link2 className="h-3 w-3 mr-1 text-blue-600" />
              <span className="text-xs font-medium">Cadastro</span>
            </div>
          </div>
          
          {registrationQR && (
            <div className="bg-white p-2 rounded-lg border text-center">
              <img 
                src={registrationQR} 
                alt="QR Code Cadastro" 
                className="w-20 h-20 mx-auto"
              />
            </div>
          )}
          
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadQRCode('registration')}
              className="flex-1 text-xs h-7"
            >
              <Download className="h-3 w-3 mr-1" />
              Baixar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(registrationURL, 'cadastro')}
              className="h-7 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Links para referência */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <div>
            <span className="font-medium">WhatsApp:</span>
            <p className="break-all">{whatsappURL.substring(0, 50)}...</p>
          </div>
          <div>
            <span className="font-medium">Cadastro:</span>
            <p className="break-all">{registrationURL.substring(0, 50)}...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventQRCode;