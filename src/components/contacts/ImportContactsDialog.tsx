import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload, Download, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseCSV, generateCSVTemplate, downloadCSV } from "@/utils/csvParser";
import { useImportContacts } from "@/hooks/contacts/useImportContacts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ContactImport {
  nome: string;
  telefone: string;
  cidade: string;
  email?: string;
  endereco?: string;
  data_nascimento?: string;
  instagram?: string;
  facebook?: string;
  source_type: 'lider' | 'campanha' | 'evento' | 'afiliado' | 'manual';
  source_name: string;
}

const REQUIRED_FIELDS = ['nome', 'telefone', 'cidade', 'source_type', 'source_name'];

export function ImportContactsDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ContactImport[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [importResult, setImportResult] = useState<any>(null);

  const importMutation = useImportContacts();

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate([
      { name: 'nome', example: 'Ana Silva' },
      { name: 'telefone', example: '61987654321' },
      { name: 'cidade', example: 'Brasília' },
      { name: 'email', example: 'ana@email.com' },
      { name: 'endereco', example: 'QNN 14 Bloco A' },
      { name: 'data_nascimento', example: '15/03/1985' },
      { name: 'instagram', example: '@anasilva' },
      { name: 'facebook', example: 'Ana Silva' },
      { name: 'source_type', example: 'lider' },
      { name: 'source_name', example: 'Rafael Prudente' },
    ]);

    downloadCSV('modelo_importacao_contatos.csv', template);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Por favor, selecione um arquivo CSV');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    // Parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseCSV<ContactImport>(content, REQUIRED_FIELDS);

      setParsedData(result.data);
      setParseErrors(result.errors);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    const result = await importMutation.mutateAsync(parsedData);
    setImportResult(result);

    if (result.success) {
      setTimeout(() => {
        setOpen(false);
        resetState();
      }, 3000);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setImportResult(null);
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Importar Contatos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar Contatos via CSV</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha CSV para importar contatos em massa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Modelo de Planilha
          </Button>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : 'Clique para selecionar arquivo CSV'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo: 5MB, 1000 contatos
              </p>
            </label>
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erros encontrados no CSV:</strong>
                <ul className="list-disc pl-4 mt-2">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>
                      Linha {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
                {parseErrors.length > 5 && (
                  <p className="mt-2">+ {parseErrors.length - 5} erros adicionais</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedData.length > 0 && parseErrors.length === 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                Preview: {parsedData.length} contatos
              </h4>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <div className="space-y-2">
                  {parsedData.slice(0, 10).map((contact, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      <Badge variant="outline">{i + 1}</Badge>
                      <span className="font-medium">{contact.nome}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{contact.telefone}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{contact.cidade}</span>
                      <span className="text-muted-foreground">•</span>
                      <Badge>{contact.source_type}</Badge>
                    </div>
                  ))}
                </div>
                {parsedData.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    + {parsedData.length - 10} contatos adicionais
                  </p>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.success ? "default" : "destructive"}>
              {importResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>Resultado da Importação:</strong>
                <ul className="list-disc pl-4 mt-2">
                  <li>Total processado: {importResult.total}</li>
                  <li>Inseridos: {importResult.inserted}</li>
                  <li>Atualizados: {importResult.updated}</li>
                  <li>Erros: {importResult.errors.length}</li>
                </ul>

                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <strong>Erros:</strong>
                    <ul className="list-disc pl-4 mt-1">
                      {importResult.errors.slice(0, 5).map((err: any, i: number) => (
                        <li key={i}>
                          Linha {err.line}: {err.error}
                        </li>
                      ))}
                    </ul>
                    {importResult.errors.length > 5 && (
                      <p className="mt-1">+ {importResult.errors.length - 5} erros adicionais</p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || parseErrors.length > 0 || importMutation.isPending}
          >
            {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar {parsedData.length} contatos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
