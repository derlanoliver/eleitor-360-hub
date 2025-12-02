import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Send, Eye, CheckCircle2 } from "lucide-react";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { EmailTemplateEditorDialog } from "./EmailTemplateEditorDialog";
import { EmailTestSendDialog } from "./EmailTestSendDialog";

const categoryLabels: Record<string, string> = {
  sistema: "Sistema",
  visita: "Visita ao Gabinete",
  evento: "Eventos",
  captacao: "Captação",
  lider: "Link de Líder",
  lideranca: "Liderança",
};

const categoryColors: Record<string, string> = {
  sistema: "bg-gray-100 text-gray-700",
  visita: "bg-amber-100 text-amber-700",
  evento: "bg-green-100 text-green-700",
  captacao: "bg-purple-100 text-purple-700",
  lider: "bg-cyan-100 text-cyan-700",
  lideranca: "bg-blue-100 text-blue-700",
};

export function EmailTemplatesTab() {
  const { data: templates, isLoading } = useEmailTemplates();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);

  const filteredTemplates = templates?.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group templates by category
  const groupedTemplates = filteredTemplates?.reduce((acc, template) => {
    const cat = template.categoria;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Templates by Category */}
      {groupedTemplates && Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Badge className={categoryColors[category] || "bg-gray-100 text-gray-700"}>
              {categoryLabels[category] || category}
            </Badge>
            <span className="text-sm font-normal text-gray-500">
              ({categoryTemplates?.length} templates)
            </span>
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {categoryTemplates?.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{template.nome}</CardTitle>
                      <CardDescription className="truncate">
                        {template.assunto}
                      </CardDescription>
                    </div>
                    <Badge variant={template.is_active ? "default" : "secondary"} className="ml-2 shrink-0">
                      {template.is_active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </>
                      ) : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>Variáveis:</span>
                    <div className="flex flex-wrap gap-1">
                      {(template.variaveis as string[])?.slice(0, 3).map((v) => (
                        <code key={v} className="text-xs bg-muted px-1 py-0.5 rounded">
                          {`{{${v}}}`}
                        </code>
                      ))}
                      {(template.variaveis as string[])?.length > 3 && (
                        <span className="text-xs">+{(template.variaveis as string[]).length - 3}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestingTemplate(template.id)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Testar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Edit Dialog */}
      {editingTemplate && (
        <EmailTemplateEditorDialog
          templateId={editingTemplate}
          open={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {/* Test Send Dialog */}
      {testingTemplate && (
        <EmailTestSendDialog
          templateId={testingTemplate}
          open={!!testingTemplate}
          onClose={() => setTestingTemplate(null)}
        />
      )}
    </div>
  );
}
