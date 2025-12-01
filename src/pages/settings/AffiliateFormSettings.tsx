import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Loader2, Image, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function AffiliateFormSettings() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Buscar configurações
  const { data: settings, isLoading } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("id, affiliate_form_cover_url")
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Mutation para atualizar capa
  const updateCover = useMutation({
    mutationFn: async (coverUrl: string | null) => {
      if (!settings?.id) throw new Error("Settings not found");
      
      const { error } = await supabase
        .from("app_settings")
        .update({ affiliate_form_cover_url: coverUrl })
        .eq("id", settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success("Imagem de capa atualizada!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar capa:", error);
      toast.error("Erro ao atualizar imagem de capa.");
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      // Nome único para o arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `affiliate-form-cover-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload para o bucket event-covers (reutilizando)
      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("event-covers")
        .getPublicUrl(filePath);

      // Atualizar configurações
      await updateCover.mutateAsync(urlData.publicUrl);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!settings?.affiliate_form_cover_url) return;
    
    try {
      // Extrair nome do arquivo da URL
      const urlParts = settings.affiliate_form_cover_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      
      // Remover do storage
      await supabase.storage.from("event-covers").remove([fileName]);
      
      // Atualizar configurações
      await updateCover.mutateAsync(null);
    } catch (error) {
      console.error("Erro ao remover capa:", error);
      toast.error("Erro ao remover imagem de capa.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/settings" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Configurações
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Formulário de Indicação</h1>
        <p className="text-muted-foreground mt-1">
          Configure a aparência do formulário de cadastro via link de líder
        </p>
      </div>

      {/* Cover Image Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Imagem de Capa
          </CardTitle>
          <CardDescription>
            Esta imagem aparecerá no topo do formulário de cadastro via link de líder.
            Recomendamos uma imagem de 1200x400 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview */}
          {settings?.affiliate_form_cover_url ? (
            <div className="relative">
              <img 
                src={settings.affiliate_form_cover_url} 
                alt="Capa do formulário"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(settings.affiliate_form_cover_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveCover}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-48 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center">
              <Image className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma imagem configurada</p>
            </div>
          )}

          {/* Upload */}
          <div className="flex items-center gap-4">
            <Label htmlFor="cover-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? "Enviando..." : "Fazer Upload"}
              </div>
              <Input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </Label>
            <span className="text-sm text-muted-foreground">
              JPG, PNG ou WebP (máx. 5MB)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Preview Link */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>
            Visualize como o formulário aparecerá para os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Para testar o formulário, você precisa de um link de líder válido.
            Acesse a página de Campanhas {">"} Links de Líderes para copiar um link.
          </p>
          <Link to="/campaigns">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para Campanhas
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}