import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, Star, Trash2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type DomainRow = {
  id: string;
  domain: string;
  is_primary: boolean;
  ssl_status?: string;
};

export default function DomainsPage() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DomainRow[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);

      if (!tenantId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tenant_domains')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_primary', { ascending: false });
      
      if (!error && data) {
        setRows(data as DomainRow[]);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao listar domínios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantId]);

  async function addDomain() {
    if (!newDomain.trim()) {
      toast({
        title: 'Domínio inválido',
        description: 'Por favor, insira um domínio válido.',
        variant: 'destructive',
      });
      return;
    }

    if (!tenantId) return;

    setProcessing('add');
    const { error } = await supabase
      .from('tenant_domains')
      .insert({
        tenant_id: tenantId,
        domain: newDomain.trim(),
        is_primary: false,
        ssl_status: 'pending',
      });
    
    setProcessing(null);

    if (error) {
      toast({
        title: 'Erro ao adicionar domínio',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Domínio adicionado',
        description: 'Configure o DNS (CNAME) apontando para a plataforma.',
      });
      setNewDomain('');
      load();
    }
  }

  async function makePrimary(id: string) {
    if (!tenantId) return;

    setProcessing(id);
    
    // Primeiro, desmarcar todos como não primários
    const { error: e1 } = await supabase
      .from('tenant_domains')
      .update({ is_primary: false })
      .eq('tenant_id', tenantId);
    
    if (e1) {
      toast({
        title: 'Erro',
        description: e1.message,
        variant: 'destructive',
      });
      setProcessing(null);
      return;
    }

    // Depois, marcar o selecionado como primário
    const { error: e2 } = await supabase
      .from('tenant_domains')
      .update({ is_primary: true })
      .eq('id', id);
    
    setProcessing(null);

    if (e2) {
      toast({
        title: 'Erro',
        description: e2.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Domínio primário atualizado',
        description: 'Este domínio agora é o principal da sua plataforma.',
      });
      load();
    }
  }

  async function remove(id: string, isPrimary: boolean) {
    if (isPrimary) {
      toast({
        title: 'Ação não permitida',
        description: 'Não é possível remover o domínio primário.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(id);
    const { error } = await supabase
      .from('tenant_domains')
      .delete()
      .eq('id', id);
    
    setProcessing(null);

    if (error) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Domínio removido',
        description: 'O domínio foi excluído com sucesso.',
      });
      load();
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
          <h1 className="text-2xl font-bold">Domínios</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os domínios customizados da sua plataforma
          </p>
        </div>

        {/* Adicionar novo domínio */}
        <div className="flex gap-2">
          <Input
            placeholder="ex: plataforma.seu-dominio.com.br"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            className="flex-1"
          />
          <Button onClick={addDomain} disabled={processing === 'add'}>
            {processing === 'add' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar
          </Button>
        </div>

        {/* Lista de domínios */}
        <div className="border rounded-lg divide-y">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum domínio configurado ainda</p>
              <p className="text-sm mt-1">Adicione seu primeiro domínio customizado acima</p>
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{row.domain}</span>
                    {row.is_primary && (
                      <Badge variant="default" className="shrink-0">
                        <Star className="h-3 w-3 mr-1" />
                        Primário
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <span>SSL: {row.ssl_status || 'pending'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!row.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => makePrimary(row.id)}
                      disabled={processing === row.id}
                    >
                      {processing === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Tornar primário'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(row.id, row.is_primary)}
                    disabled={row.is_primary || processing === row.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instruções DNS */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Como configurar DNS</p>
              <p className="text-muted-foreground">
                1. Acesse o painel do seu provedor de domínio (Registro.br, GoDaddy, etc.)
              </p>
              <p className="text-muted-foreground">
                2. Adicione um registro CNAME apontando para o domínio da plataforma
              </p>
              <p className="text-muted-foreground">
                3. Aguarde a propagação do DNS (pode levar até 48 horas)
              </p>
              <p className="text-muted-foreground">
                4. O certificado SSL será provisionado automaticamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
