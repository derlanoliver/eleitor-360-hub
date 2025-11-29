import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisitMeetingActions } from "@/hooks/office/useVisitMeetingActions";
import { FileText, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MeetingMinutesDialogProps {
  visit: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingMinutesDialog({
  visit,
  open,
  onOpenChange,
}: MeetingMinutesDialogProps) {
  const [contentType, setContentType] = useState<"text" | "file">("text");
  const [contentText, setContentText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { saveMeetingMinutes } = useVisitMeetingActions();

  if (!visit) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Apenas arquivos PDF ou DOCX são permitidos");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSave = () => {
    if (contentType === "text" && !contentText.trim()) {
      toast.error("Digite o texto da ata");
      return;
    }
    if (contentType === "file" && !file) {
      toast.error("Selecione um arquivo");
      return;
    }

    saveMeetingMinutes.mutate(
      {
        visitId: visit.id,
        contentType,
        contentText: contentType === "text" ? contentText : undefined,
        file: contentType === "file" ? file : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setContentText("");
          setFile(null);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar Ata da Reunião</DialogTitle>
          <DialogDescription>
            Registre a documentação da reunião realizada
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={contentType}
          onValueChange={(value) => setContentType(value as "text" | "file")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Texto
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload className="mr-2 h-4 w-4" />
              Arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="content-text">Conteúdo da Ata</Label>
              <Textarea
                id="content-text"
                placeholder="Digite ou cole o texto da ata aqui..."
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="min-h-[300px] mt-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="file-upload">Arquivo da Ata</Label>
              <div className="mt-2">
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {file && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <strong>Arquivo selecionado:</strong> {file.name}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Formatos aceitos: PDF, DOCX
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={saveMeetingMinutes.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={saveMeetingMinutes.isPending}
          >
            {saveMeetingMinutes.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar e Finalizar Reunião"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
