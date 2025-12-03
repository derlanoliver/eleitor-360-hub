import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  WhatsAppTemplate,
  useUpdateWhatsAppTemplate,
} from "@/hooks/useWhatsAppTemplates";

interface WhatsAppTemplateEditorDialogProps {
  template: WhatsAppTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppTemplateEditorDialog({
  template,
  open,
  onOpenChange,
}: WhatsAppTemplateEditorDialogProps) {
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [isActive, setIsActive] = useState(true);

  const updateTemplate = useUpdateWhatsAppTemplate();

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setMensagem(template.mensagem);
      setIsActive(template.is_active);
    }
  }, [template]);

  const handleSave = () => {
    if (!template) return;

    // Extract variables from message
    const variableMatches = mensagem.match(/{{(\w+)}}/g) || [];
    const variaveis = variableMatches.map((v) => v.replace(/{{|}}/g, ""));

    updateTemplate.mutate(
      {
        id: template.id,
        data: {
          nome,
          mensagem,
          variaveis,
          is_active: isActive,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Template</DialogTitle>
          <DialogDescription>
            Modifique o conteúdo da mensagem. Use {`{{variavel}}`} para variáveis dinâmicas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Identificador (slug)</Label>
            <Input id="slug" value={template.slug} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Template</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Link do Formulário de Visita"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={template.categoria}
              disabled
              className="bg-muted capitalize"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem..."
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use *texto* para negrito no WhatsApp
            </p>
          </div>

          <div className="space-y-2">
            <Label>Variáveis Detectadas</Label>
            <div className="flex flex-wrap gap-2">
              {(mensagem.match(/{{(\w+)}}/g) || []).map((v, i) => (
                <Badge key={i} variant="secondary">
                  {v}
                </Badge>
              ))}
              {!(mensagem.match(/{{(\w+)}}/g) || []).length && (
                <span className="text-sm text-muted-foreground">
                  Nenhuma variável encontrada
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Template Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Templates inativos não podem ser usados para envio
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <Label className="text-sm font-medium">Pré-visualização</Label>
            <div className="mt-2 p-3 bg-background rounded-lg whitespace-pre-wrap text-sm">
              {mensagem || "Digite uma mensagem para ver a pré-visualização"}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateTemplate.isPending}>
            {updateTemplate.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
