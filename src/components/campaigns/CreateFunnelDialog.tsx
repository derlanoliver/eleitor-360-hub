import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LeadFunnel, 
  CreateFunnelData,
  useCreateFunnel, 
  useUpdateFunnel,
  uploadFunnelAsset 
} from "@/hooks/campaigns/useLeadFunnels";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  lead_magnet_nome: z.string().min(3, "Nome da isca é obrigatório"),
  lead_magnet_url: z.string().url("URL inválida"),
  titulo: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  subtitulo: z.string().optional(),
  texto_botao: z.string().min(1, "Texto do botão é obrigatório"),
  cor_botao: z.string(),
  campos_form: z.array(z.string()).min(1, "Selecione pelo menos um campo"),
  obrigado_titulo: z.string().min(5, "Título é obrigatório"),
  obrigado_subtitulo: z.string().optional(),
  obrigado_texto_botao: z.string().min(1, "Texto do botão é obrigatório"),
  cta_adicional_texto: z.string().optional(),
  cta_adicional_url: z.string().url("URL inválida").optional().or(z.literal('')),
  status: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateFunnelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editFunnel?: LeadFunnel;
}

const AVAILABLE_FIELDS = [
  { value: 'nome', label: 'Nome Completo', required: true },
  { value: 'email', label: 'E-mail', required: true },
  { value: 'whatsapp', label: 'WhatsApp', required: false },
  { value: 'cidade', label: 'Cidade/RA', required: false },
];

const BUTTON_COLORS = [
  { value: '#10b981', label: 'Verde', class: 'bg-emerald-500' },
  { value: '#3b82f6', label: 'Azul', class: 'bg-blue-500' },
  { value: '#8b5cf6', label: 'Roxo', class: 'bg-violet-500' },
  { value: '#f59e0b', label: 'Laranja', class: 'bg-amber-500' },
  { value: '#ef4444', label: 'Vermelho', class: 'bg-red-500' },
  { value: '#ec4899', label: 'Rosa', class: 'bg-pink-500' },
];

export function CreateFunnelDialog({ open, onOpenChange, editFunnel }: CreateFunnelDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(editFunnel?.cover_url || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(editFunnel?.logo_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const createFunnel = useCreateFunnel();
  const updateFunnel = useUpdateFunnel();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: editFunnel?.nome || '',
      descricao: editFunnel?.descricao || '',
      lead_magnet_nome: editFunnel?.lead_magnet_nome || '',
      lead_magnet_url: editFunnel?.lead_magnet_url || '',
      titulo: editFunnel?.titulo || '',
      subtitulo: editFunnel?.subtitulo || '',
      texto_botao: editFunnel?.texto_botao || 'Quero Receber',
      cor_botao: editFunnel?.cor_botao || '#10b981',
      campos_form: editFunnel?.campos_form || ['nome', 'email', 'whatsapp'],
      obrigado_titulo: editFunnel?.obrigado_titulo || 'Parabéns! Seu material está pronto.',
      obrigado_subtitulo: editFunnel?.obrigado_subtitulo || '',
      obrigado_texto_botao: editFunnel?.obrigado_texto_botao || 'Baixar Agora',
      cta_adicional_texto: editFunnel?.cta_adicional_texto || '',
      cta_adicional_url: editFunnel?.cta_adicional_url || '',
      status: editFunnel?.status || 'draft',
    },
  });

  useEffect(() => {
    if (editFunnel) {
      form.reset({
        nome: editFunnel.nome,
        descricao: editFunnel.descricao || '',
        lead_magnet_nome: editFunnel.lead_magnet_nome,
        lead_magnet_url: editFunnel.lead_magnet_url,
        titulo: editFunnel.titulo,
        subtitulo: editFunnel.subtitulo || '',
        texto_botao: editFunnel.texto_botao,
        cor_botao: editFunnel.cor_botao,
        campos_form: editFunnel.campos_form,
        obrigado_titulo: editFunnel.obrigado_titulo,
        obrigado_subtitulo: editFunnel.obrigado_subtitulo || '',
        obrigado_texto_botao: editFunnel.obrigado_texto_botao,
        cta_adicional_texto: editFunnel.cta_adicional_texto || '',
        cta_adicional_url: editFunnel.cta_adicional_url || '',
        status: editFunnel.status,
      });
      setCoverPreview(editFunnel.cover_url);
      setLogoPreview(editFunnel.logo_url);
    }
  }, [editFunnel, form]);

  const handleFileChange = (type: 'cover' | 'logo', file: File | null) => {
    if (type === 'cover') {
      setCoverFile(file);
      setCoverPreview(file ? URL.createObjectURL(file) : editFunnel?.cover_url || null);
    } else {
      setLogoFile(file);
      setLogoPreview(file ? URL.createObjectURL(file) : editFunnel?.logo_url || null);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsUploading(true);
    
    try {
      let cover_url = editFunnel?.cover_url;
      let logo_url = editFunnel?.logo_url;

      // Upload cover if changed
      if (coverFile) {
        const path = `covers/${Date.now()}-${coverFile.name}`;
        cover_url = await uploadFunnelAsset(coverFile, path);
      }

      // Upload logo if changed
      if (logoFile) {
        const path = `logos/${Date.now()}-${logoFile.name}`;
        logo_url = await uploadFunnelAsset(logoFile, path);
      }

      const funnelData: CreateFunnelData = {
        nome: data.nome,
        descricao: data.descricao,
        lead_magnet_nome: data.lead_magnet_nome,
        lead_magnet_url: data.lead_magnet_url,
        titulo: data.titulo,
        subtitulo: data.subtitulo,
        texto_botao: data.texto_botao,
        cor_botao: data.cor_botao,
        campos_form: data.campos_form,
        obrigado_titulo: data.obrigado_titulo,
        obrigado_subtitulo: data.obrigado_subtitulo,
        obrigado_texto_botao: data.obrigado_texto_botao,
        cta_adicional_texto: data.cta_adicional_texto,
        cta_adicional_url: data.cta_adicional_url || undefined,
        status: data.status,
        cover_url,
        logo_url,
      };

      if (editFunnel) {
        await updateFunnel.mutateAsync({ id: editFunnel.id, ...funnelData });
      } else {
        await createFunnel.mutateAsync(funnelData);
      }

      onOpenChange(false);
      form.reset();
      setCoverFile(null);
      setLogoFile(null);
      setCoverPreview(null);
      setLogoPreview(null);
      setActiveTab("info");
    } catch (error) {
      console.error('Error saving funnel:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = createFunnel.isPending || updateFunnel.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editFunnel ? 'Editar Funil de Captação' : 'Novo Funil de Captação'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="landing">Landing Page</TabsTrigger>
                <TabsTrigger value="obrigado">Pág. Obrigado</TabsTrigger>
              </TabsList>

              {/* Tab: Informações */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Funil *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Guia Completo de Marketing" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome interno para identificação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição interna do funil..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">🎁 Isca Digital</h4>
                  
                  <FormField
                    control={form.control}
                    name="lead_magnet_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Isca *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: E-book: 10 Dicas de Produtividade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lead_magnet_url"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel>URL de Download *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://drive.google.com/..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Link direto para download do material (Google Drive, Dropbox, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">📝 Campos do Formulário</h4>
                  
                  <FormField
                    control={form.control}
                    name="campos_form"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          {AVAILABLE_FIELDS.map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={item.value}
                                checked={field.value.includes(item.value)}
                                disabled={item.required}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, item.value]);
                                  } else {
                                    field.onChange(field.value.filter((v: string) => v !== item.value));
                                  }
                                }}
                              />
                              <Label htmlFor={item.value} className="text-sm font-normal">
                                {item.label}
                                {item.required && <span className="text-muted-foreground ml-1">(obrigatório)</span>}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="paused">Pausado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Apenas funis ativos aparecem na página pública
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tab: Landing Page */}
              <TabsContent value="landing" className="space-y-4 mt-4">
                {/* Cover Image */}
                <div>
                  <Label>Imagem de Capa</Label>
                  <div className="mt-2">
                    {coverPreview ? (
                      <div className="relative">
                        <img 
                          src={coverPreview} 
                          alt="Cover preview" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => handleFileChange('cover', null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Clique para enviar imagem de capa</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG (recomendado: 1200x630)</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleFileChange('cover', e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <Label>Logo</Label>
                  <div className="mt-2">
                    {logoPreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="h-20 w-auto object-contain bg-white rounded-lg p-2 shadow"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleFileChange('logo', null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-40 h-20 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="text-center">
                          <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Upload logo</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Principal *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Baixe Grátis o Guia Completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Texto complementar que aparece abaixo do título..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="texto_botao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto do Botão *</FormLabel>
                        <FormControl>
                          <Input placeholder="Quero Receber" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cor_botao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor do Botão</FormLabel>
                        <div className="flex gap-2 mt-2">
                          {BUTTON_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              className={`w-8 h-8 rounded-full ${color.class} ${
                                field.value === color.value 
                                  ? 'ring-2 ring-offset-2 ring-primary' 
                                  : ''
                              }`}
                              onClick={() => field.onChange(color.value)}
                              title={color.label}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Tab: Página de Obrigado */}
              <TabsContent value="obrigado" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="obrigado_titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título de Sucesso *</FormLabel>
                      <FormControl>
                        <Input placeholder="Parabéns! Seu material está pronto." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="obrigado_subtitulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Clique no botão abaixo para baixar seu material..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="obrigado_texto_botao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto do Botão de Download *</FormLabel>
                      <FormControl>
                        <Input placeholder="Baixar Agora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">🔗 CTA Adicional (opcional)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Adicione um botão extra para direcionar o lead a outra ação
                  </p>

                  <FormField
                    control={form.control}
                    name="cta_adicional_texto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto do CTA</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Conhecer nossos serviços" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cta_adicional_url"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel>URL do CTA</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editFunnel ? 'Salvar Alterações' : 'Criar Funil'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
