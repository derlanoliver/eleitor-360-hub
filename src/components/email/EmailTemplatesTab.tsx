import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDemoMask } from "@/contexts/DemoModeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Send, CheckCircle2 } from "lucide-react";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { EmailTemplateEditorDialog } from "./EmailTemplateEditorDialog";
import { EmailTestSendDialog } from "./EmailTestSendDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface EmailTemplatesTabProps {
  searchTerm: string;
}

export function EmailTemplatesTab({ searchTerm }: EmailTemplatesTabProps) {
  const { isDemoMode, m } = useDemoMask();
  const { data: templates, isLoading } = useEmailTemplates();
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
      {/* Templates by Category */}
      <TooltipProvider>
        {groupedTemplates && Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={categoryColors[category] || "bg-gray-100 text-gray-700"}>
                {categoryLabels[category] || category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({categoryTemplates?.length})
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categoryTemplates?.map((template) => (
                <Card key={template.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">{isDemoMode ? m.platformName(template.nome) : template.nome}</span>
                          {template.is_active ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{isDemoMode ? m.observation(template.assunto) : template.assunto}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {(template.variaveis as string[])?.slice(0, 2).map((v) => (
                            <code key={v} className="text-[10px] bg-muted px-1 rounded">
                              {`{{${v}}}`}
                            </code>
                          ))}
                          {(template.variaveis as string[])?.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{(template.variaveis as string[]).length - 2}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingTemplate(template.id)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setTestingTemplate(template.id)}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Testar</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </TooltipProvider>

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
