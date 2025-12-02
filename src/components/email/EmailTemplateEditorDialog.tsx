import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Eye, Code } from "lucide-react";
import { useEmailTemplate, useUpdateEmailTemplate } from "@/hooks/useEmailTemplates";
import { Textarea } from "@/components/ui/textarea";

interface EmailTemplateEditorDialogProps {
  templateId: string;
  open: boolean;
  onClose: () => void;
}

export function EmailTemplateEditorDialog({
  templateId,
  open,
  onClose,
}: EmailTemplateEditorDialogProps) {
  const { data: template, isLoading } = useEmailTemplate(templateId);
  const updateTemplate = useUpdateEmailTemplate();

  const [nome, setNome] = useState("");
  const [assunto, setAssunto] = useState("");
  const [conteudoHtml, setConteudoHtml] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [previewTab, setPreviewTab] = useState<"code" | "preview">("code");

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setAssunto(template.assunto);
      setConteudoHtml(template.conteudo_html);
      setIsActive(template.is_active);
    }
  }, [template]);

  const handleSave = () => {
    updateTemplate.mutate(
      {
        id: templateId,
        updates: {
          nome,
          assunto,
          conteudo_html: conteudoHtml,
          is_active: isActive,
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const insertVariable = (variable: string) => {
    setConteudoHtml((prev) => prev + `{{${variable}}}`);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Template: {template?.nome}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Assunto do Email</Label>
              <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Template ativo</Label>
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <Label>Variáveis Disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {(template?.variaveis as string[])?.map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => insertVariable(v)}
                >
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Clique para inserir no código HTML
            </p>
          </div>

          {/* HTML Editor with Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Conteúdo HTML</Label>
              <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as "code" | "preview")}>
                <TabsList className="h-8">
                  <TabsTrigger value="code" className="text-xs gap-1">
                    <Code className="h-3 w-3" />
                    Código
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs gap-1">
                    <Eye className="h-3 w-3" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {previewTab === "code" ? (
              <Textarea
                value={conteudoHtml}
                onChange={(e) => setConteudoHtml(e.target.value)}
                className="font-mono text-sm min-h-[400px]"
                placeholder="<!DOCTYPE html>..."
              />
            ) : (
              <div className="border rounded-lg p-4 min-h-[400px] bg-white">
                <iframe
                  srcDoc={conteudoHtml}
                  className="w-full h-[400px] border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateTemplate.isPending}>
            {updateTemplate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
