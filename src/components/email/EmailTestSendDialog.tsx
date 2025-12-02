import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { useEmailTemplate, useSendEmail } from "@/hooks/useEmailTemplates";

interface EmailTestSendDialogProps {
  templateId: string;
  open: boolean;
  onClose: () => void;
}

export function EmailTestSendDialog({
  templateId,
  open,
  onClose,
}: EmailTestSendDialogProps) {
  const { data: template, isLoading } = useEmailTemplate(templateId);
  const sendEmail = useSendEmail();

  const [testEmail, setTestEmail] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = () => {
    sendEmail.mutate(
      {
        templateId,
        to: testEmail,
        variables,
      },
      {
        onSuccess: () => {
          setSent(true);
          setTimeout(() => {
            onClose();
            setSent(false);
          }, 2000);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium">Email enviado com sucesso!</p>
            <p className="text-sm text-muted-foreground">
              Verifique a caixa de entrada de {testEmail}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Email de Teste</DialogTitle>
          <DialogDescription>
            Template: {template?.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email de Destino</Label>
            <Input
              type="email"
              placeholder="teste@exemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          {(template?.variaveis as string[])?.length > 0 && (
            <div className="space-y-3">
              <Label>Variáveis do Template</Label>
              {(template?.variaveis as string[])?.map((variable) => (
                <div key={variable} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{`{{${variable}}}`}</Label>
                  <Input
                    placeholder={`Valor para ${variable}`}
                    value={variables[variable] || ""}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!testEmail || sendEmail.isPending}
          >
            {sendEmail.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar Teste
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
