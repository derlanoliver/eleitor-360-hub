import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette } from 'lucide-react';

type BrandingData = {
  id?: string;
  primary_color: string;
  logo_url: string;
  favicon_url: string;
};

export default function BrandingPage() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState<BrandingData>({
    primary_color: '#F25822',
    logo_url: '',
    favicon_url: '',
  });

  useEffect(() => {
    if (!tenantId) return;
    
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (data) {
        setBrand({
          id: data.id,
          primary_color: data.primary_color || '#F25822',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
        });
      }
      
      setLoading(false);
    })();
  }, [tenantId]);

  async function save() {
    if (!tenantId) return;
    
    setSaving(true);
    const payload = {
      primary_color: brand.primary_color,
      logo_url: brand.logo_url || null,
      favicon_url: brand.favicon_url || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('tenant_branding')
      .update(payload)
      .eq('tenant_id', tenantId);
    
    setSaving(false);
    
    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Aplicar mudanças em runtime
    document.documentElement.style.setProperty('--primary', brand.primary_color);
    
    // Atualizar favicon se fornecido
    if (brand.favicon_url) {
      let linkEl = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.rel = 'icon';
        document.head.appendChild(linkEl);
      }
      linkEl.href = brand.favicon_url;
    }

    toast({
      title: 'Branding atualizado',
      description: 'As mudanças foram aplicadas imediatamente.',
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <SettingsTabs />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SettingsTabs />
      
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Branding</h1>
          <p className="text-muted-foreground mt-1">
            Personalize a identidade visual da sua plataforma
          </p>
        </div>

        {/* Cor Primária */}
        <div className="space-y-4 p-6 border rounded-lg">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Cor Primária</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="primary_color">Escolha a cor principal da sua marca</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primary_color"
                  value={brand.primary_color}
                  onChange={(e) => setBrand({ ...brand, primary_color: e.target.value })}
                  className="h-12 w-20 rounded border border-input cursor-pointer"
                />
                <Input
                  value={brand.primary_color}
                  onChange={(e) => setBrand({ ...brand, primary_color: e.target.value })}
                  placeholder="#F25822"
                  className="flex-1"
                />
              </div>
            </div>
            <div 
              className="h-20 w-20 rounded-lg border-2 border-input"
              style={{ backgroundColor: brand.primary_color }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Esta cor será aplicada em botões, links e elementos de destaque
          </p>
        </div>

        {/* Logo e Favicon */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Imagens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                type="url"
                value={brand.logo_url}
                onChange={(e) => setBrand({ ...brand, logo_url: e.target.value })}
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Logo exibido no cabeçalho da plataforma
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="favicon_url">URL do Favicon</Label>
              <Input
                id="favicon_url"
                type="url"
                value={brand.favicon_url}
                onChange={(e) => setBrand({ ...brand, favicon_url: e.target.value })}
                placeholder="https://exemplo.com/favicon.ico"
              />
              <p className="text-xs text-muted-foreground">
                Ícone exibido na aba do navegador
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6 border rounded-lg bg-muted/30">
          <h3 className="text-sm font-semibold mb-3">Preview</h3>
          <div className="flex items-center gap-4">
            <Button style={{ backgroundColor: brand.primary_color }}>
              Botão Exemplo
            </Button>
            <a 
              href="#" 
              className="text-sm font-medium underline"
              style={{ color: brand.primary_color }}
            >
              Link Exemplo
            </a>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
