import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { useZapiQRCode } from "@/hooks/useZapiQRCode";
import { useEffect } from "react";

interface ZapiQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  token: string;
  clientToken?: string;
  onConnected?: () => void;
}

export function ZapiQRCodeDialog({
  open,
  onOpenChange,
  instanceId,
  token,
  clientToken,
  onConnected,
}: ZapiQRCodeDialogProps) {
  const {
    isLoading,
    qrcode,
    connected,
    error,
    countdown,
    attempts,
    maxAttempts,
    retry,
    reset,
  } = useZapiQRCode({
    instanceId,
    token,
    clientToken,
    isOpen: open,
    onConnected: () => {
      onConnected?.();
      setTimeout(() => onOpenChange(false), 1500);
    },
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const hasExhaustedAttempts = attempts >= maxAttempts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Reconectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu WhatsApp para reconectar
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {/* Loading State */}
          {isLoading && !qrcode && (
            <div className="flex flex-col items-center justify-center h-64 w-64">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Obtendo QR Code...</p>
            </div>
          )}

          {/* Connected State */}
          {connected && (
            <div className="flex flex-col items-center justify-center h-64 w-64">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="mt-4 text-lg font-medium text-green-600">WhatsApp Conectado!</p>
              <p className="text-sm text-muted-foreground">A janela fechará em instantes...</p>
            </div>
          )}

          {/* Error State - Exhausted Attempts */}
          {!connected && hasExhaustedAttempts && (
            <div className="flex flex-col items-center justify-center h-64 w-64">
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="mt-4 text-lg font-medium text-destructive">QR Code Expirado</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                O tempo limite foi atingido. Clique em "Tentar Novamente" para gerar um novo QR Code.
              </p>
              <Button onClick={retry} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Error State - General Error */}
          {!connected && !hasExhaustedAttempts && error && !qrcode && (
            <div className="flex flex-col items-center justify-center h-64 w-64">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="mt-4 text-sm font-medium text-destructive text-center">{error}</p>
              <Button onClick={retry} variant="outline" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* QR Code Display */}
          {!connected && !hasExhaustedAttempts && qrcode && (
            <>
              <div className="relative">
              <img
                  src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 border rounded-lg"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Countdown */}
              <p className="mt-3 text-sm text-muted-foreground">
                Atualizando em <span className="font-semibold">{countdown}</span> segundos...
              </p>

              {/* Instructions */}
              <div className="mt-4 bg-muted/50 rounded-lg p-4 w-full">
                <h4 className="font-medium text-sm mb-2">Como escanear:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em <strong className="text-foreground">Menu</strong> → <strong className="text-foreground">Aparelhos conectados</strong></li>
                  <li>Toque em <strong className="text-foreground">Conectar um aparelho</strong></li>
                  <li>Escaneie este QR Code</li>
                </ol>
              </div>

              {/* Attempt Counter */}
              <p className="mt-3 text-xs text-muted-foreground">
                Tentativa {attempts} de {maxAttempts}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
