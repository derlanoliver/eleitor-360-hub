import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProtocolBadge } from "./ProtocolBadge";
import { OfficeStatusBadge } from "./OfficeStatusBadge";
import { formatPhoneBR } from "@/services/office/officeService";
import { generateVisitFormUrl } from "@/lib/urlHelper";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

interface VisitDetailsDialogProps {
  visit: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisitDetailsDialog({ visit, open, onOpenChange }: VisitDetailsDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  useEffect(() => {
    if (open && visit) {
      const link = generateVisitFormUrl(visit.id);
      QRCode.toDataURL(link).then(setQrCode);
    }
  }, [open, visit]);
  
  if (!visit) return null;
  
  const link = generateVisitFormUrl(visit.id);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Visita</DialogTitle>
          <DialogDescription>
            Informações completas sobre a visita registrada
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Protocolo */}
          <div>
            <Label>Protocolo</Label>
            <div className="mt-2">
              <ProtocolBadge protocolo={visit.protocolo} />
            </div>
          </div>
          
          {/* Status */}
          <div>
            <Label>Status</Label>
            <div className="mt-2">
              <OfficeStatusBadge status={visit.status} />
            </div>
          </div>
          
          {/* Visitante */}
          <div>
            <Label>Visitante</Label>
            <p className="text-sm mt-1 font-medium">{visit.contact?.nome}</p>
          </div>
          
          {/* Telefone */}
          <div>
            <Label>WhatsApp</Label>
            <p className="text-sm mt-1 font-mono">
              {visit.contact?.telefone_norm && formatPhoneBR(visit.contact.telefone_norm)}
            </p>
          </div>
          
          {/* Cidade */}
          {visit.city && (
            <div>
              <Label>Cidade / RA</Label>
              <p className="text-sm mt-1">{visit.city.nome}</p>
            </div>
          )}
          
          {/* Líder */}
          {visit.leader && (
            <div>
              <Label>Líder Responsável</Label>
              <p className="text-sm mt-1">{visit.leader.nome_completo}</p>
            </div>
          )}
          
          {/* Criado por */}
          <div>
            <Label>Criado por</Label>
            <p className="text-sm mt-1">
              {visit.created_by 
                ? "Atendente do Gabinete" 
                : `Formulário de Afiliado${visit.leader ? ` (via ${visit.leader.nome_completo})` : ""}`
              }
            </p>
          </div>
          
          {/* Link do Formulário */}
          <div>
            <Label>Link do Formulário</Label>
            <div className="mt-2 p-3 bg-muted rounded-md break-all text-sm font-mono">
              {link}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleCopyLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Link
            </Button>
          </div>
          
          {/* QR Code */}
          {qrCode && (
            <div>
              <Label className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </Label>
              <div className="mt-2 flex justify-center p-4 bg-muted rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
