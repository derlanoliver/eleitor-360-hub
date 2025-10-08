import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type OrganizationData = {
  public_name: string;
  contact_email: string;
  contact_phone: string;
  default_ra_id: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  social: {
    instagram: string;
    youtube: string;
    site: string;
  };
};

export default function OrganizationPage() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ras, setRas] = useState<Array<{ id: string; ra: string }>>([]);
  const [org, setOrg] = useState<OrganizationData>({
    public_name: '',
    contact_email: '',
    contact_phone: '',
    default_ra_id: null,
    address: { street: '', city: '', state: 'DF', zip: '' },
    social: { instagram: '', youtube: '', site: '' },
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Buscar RAs
        const { data: rasData } = await supabase
          .from('regiao_administrativa')
          .select('id, ra')
          .order('ra');
        if (rasData) setRas(rasData);

        if (!tenantId) {
          setLoading(false);
          return;
        }

        // Buscar tenant_settings
        const { data } = await supabase
          .from('tenant_settings')
          .select('organization_data')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (data?.organization_data && typeof data.organization_data === 'object') {
          setOrg({ ...org, ...data.organization_data as Partial<OrganizationData> });
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Erro ao carregar configurações', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId, toast]);

  async function save() {
    if (!tenantId) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('tenant_settings')
      .update({ 
        organization_data: org, 
        updated_at: new Date().toISOString() 
      })
      .eq('tenant_id', tenantId);
    
    setSaving(false);
    
    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Organização atualizada',
        description: 'As configurações foram salvas com sucesso.',
      });
    }
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

  if (!tenantId) {
    return (
      <div className="p-6">
        <SettingsTabs />
        <div className="mt-8 p-6 border border-destructive/50 rounded-lg bg-destructive/10 max-w-3xl">
          <h2 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar tenant</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível identificar sua organização. Por favor, tente recarregar a página.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SettingsTabs />
      
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organização</h1>
          <p className="text-muted-foreground mt-1">
            Configure os dados públicos da sua organização política
          </p>
        </div>

        {/* Dados básicos */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Dados Básicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="public_name">Nome Público</Label>
              <Input
                id="public_name"
                value={org.public_name}
                onChange={(e) => setOrg({ ...org, public_name: e.target.value })}
                placeholder="Ex: Deputado Rafael Prudente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">E-mail de Contato</Label>
              <Input
                id="contact_email"
                type="email"
                value={org.contact_email}
                onChange={(e) => setOrg({ ...org, contact_email: e.target.value })}
                placeholder="contato@exemplo.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefone/WhatsApp</Label>
              <Input
                id="contact_phone"
                value={org.contact_phone}
                onChange={(e) => setOrg({ ...org, contact_phone: e.target.value })}
                placeholder="+55 61 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_ra">RA Padrão</Label>
              <select
                id="default_ra"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={org.default_ra_id || ''}
                onChange={(e) => setOrg({ ...org, default_ra_id: e.target.value || null })}
              >
                <option value="">Selecione...</option>
                {ras.map((ra) => (
                  <option key={ra.id} value={ra.id}>
                    {ra.ra}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input
                id="street"
                value={org.address.street}
                onChange={(e) => setOrg({ ...org, address: { ...org.address, street: e.target.value } })}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={org.address.city}
                onChange={(e) => setOrg({ ...org, address: { ...org.address, city: e.target.value } })}
                placeholder="Brasília"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">UF</Label>
              <Input
                id="state"
                value={org.address.state}
                onChange={(e) => setOrg({ ...org, address: { ...org.address, state: e.target.value } })}
                placeholder="DF"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">CEP</Label>
              <Input
                id="zip"
                value={org.address.zip}
                onChange={(e) => setOrg({ ...org, address: { ...org.address, zip: e.target.value } })}
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Redes Sociais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={org.social.instagram}
                onChange={(e) => setOrg({ ...org, social: { ...org.social, instagram: e.target.value } })}
                placeholder="@usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={org.social.youtube}
                onChange={(e) => setOrg({ ...org, social: { ...org.social, youtube: e.target.value } })}
                placeholder="Canal do YouTube"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                type="url"
                value={org.social.site}
                onChange={(e) => setOrg({ ...org, social: { ...org.social, site: e.target.value } })}
                placeholder="https://exemplo.com.br"
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
