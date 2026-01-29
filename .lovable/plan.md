

## Sistema de Envio de Materiais por RA

### Resumo
Desenvolver um sistema que permite fazer upload de materiais específicos para cada Região Administrativa (RA) e envia automaticamente o link do material para novos líderes verificados daquela região via SMS.

### Fluxo do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FLUXO COMPLETO                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CONFIGURAÇÃO (Admin)                                                     │
│     ├── Acessa: Configurações > Materiais por Região                         │
│     ├── Seleciona a RA (ex: Taguatinga)                                      │
│     ├── Faz upload do material (PDF, etc)                                    │
│     └── Define tempo de delay após verificação (ex: 1 hora)                  │
│                                                                              │
│  2. CADASTRO DO LÍDER                                                        │
│     ├── Líder se cadastra informando a RA                                    │
│     └── Recebe SMS de verificação                                            │
│                                                                              │
│  3. VERIFICAÇÃO DO LÍDER                                                     │
│     ├── Líder clica no link de verificação                                   │
│     ├── Sistema marca como verificado                                        │
│     └── Sistema agenda envio do material da RA (após delay configurado)      │
│                                                                              │
│  4. ENVIO AUTOMÁTICO                                                         │
│     ├── Cron job processa mensagens agendadas                                │
│     ├── Busca material da RA do líder                                        │
│     └── Envia SMS com link do material                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Componentes a Criar

#### 1. Nova Página de Configurações: "Materiais por Região"
- **Local**: Menu Configurações
- **Funcionalidades**:
  - Lista de todas as RAs com indicador de material configurado
  - Upload de arquivo por RA (PDF, ZIP, etc)
  - Configuração de delay antes do envio (minutos/horas após verificação)
  - Template SMS selecionável
  - Ativar/desativar envio por RA

#### 2. Nova Tabela: `region_materials`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| city_id | uuid | FK para office_cities |
| material_url | text | URL do arquivo no storage |
| material_name | text | Nome amigável do material |
| sms_template_slug | text | Template SMS a usar |
| delay_minutes | integer | Tempo de espera após verificação |
| is_active | boolean | Se o envio está ativo |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

#### 3. Novo Template SMS
- **Slug**: `material-regiao-sms`
- **Variáveis**: `{{nome}}`, `{{regiao}}`, `{{link_material}}`
- **Exemplo**: "{{nome}}, temos um material especial para você de {{regiao}}! Acesse: {{link_material}}"

#### 4. Configuração Global de Timing
- Adicionar coluna `region_material_delay_minutes` na tabela `integrations_settings`
- Permite definir delay padrão (pode ser sobrescrito por RA)

### Alteração no Fluxo de Verificação

Após o líder ser verificado (em `VerifyLeader.tsx` ou trigger):

1. Verificar se a RA do líder tem material configurado
2. Se sim, agendar mensagem na tabela `scheduled_messages` com:
   - `scheduled_for` = now() + delay configurado
   - `template_slug` = template configurado para a RA
   - `variables` = { nome, regiao, link_material }

---

## Seção Técnica

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/settings/RegionMaterials.tsx` | Página de configuração dos materiais |
| `src/hooks/useRegionMaterials.ts` | Hook para CRUD de materiais por região |
| `supabase/functions/schedule-region-material/index.ts` | Edge function para agendar envio |

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/Settings.tsx` | Adicionar link para nova página |
| `src/App.tsx` | Adicionar rota `/settings/region-materials` |
| `supabase/functions/send-leader-affiliate-links/index.ts` | Chamar agendamento de material após verificação |

### Migrações SQL

```sql
-- 1. Criar tabela de materiais por região
CREATE TABLE public.region_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES office_cities(id) ON DELETE CASCADE,
  material_url TEXT NOT NULL,
  material_name TEXT NOT NULL,
  sms_template_slug TEXT DEFAULT 'material-regiao-sms',
  delay_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.region_materials ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso
CREATE POLICY "region_materials_select" ON region_materials
  FOR SELECT USING (true);

CREATE POLICY "region_materials_modify" ON region_materials
  FOR ALL USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));

-- 4. Adicionar configuração global de delay
ALTER TABLE integrations_settings 
ADD COLUMN region_material_default_delay_minutes INTEGER DEFAULT 60;
```

### Lógica de Agendamento (Edge Function)

```typescript
// Chamado após verificação do líder
async function scheduleRegionMaterial(supabase, leaderId) {
  // 1. Buscar líder e sua cidade
  const { data: leader } = await supabase
    .from('lideres')
    .select('id, nome_completo, telefone, cidade_id, office_cities(nome)')
    .eq('id', leaderId)
    .single();

  if (!leader?.cidade_id || !leader.telefone) return;

  // 2. Buscar material da região
  const { data: material } = await supabase
    .from('region_materials')
    .select('*')
    .eq('city_id', leader.cidade_id)
    .eq('is_active', true)
    .single();

  if (!material) return;

  // 3. Agendar mensagem
  const scheduledFor = new Date();
  scheduledFor.setMinutes(scheduledFor.getMinutes() + material.delay_minutes);

  await supabase.from('scheduled_messages').insert({
    message_type: 'sms',
    recipient_phone: leader.telefone,
    recipient_name: leader.nome_completo,
    template_slug: material.sms_template_slug,
    variables: {
      nome: leader.nome_completo,
      regiao: leader.office_cities?.nome,
      link_material: material.material_url
    },
    scheduled_for: scheduledFor.toISOString(),
    leader_id: leaderId
  });
}
```

### Interface da Página de Configuração

A página terá:
1. **Cabeçalho** com título e descrição
2. **Configuração global** de delay padrão
3. **Lista de RAs** em cards/tabela com:
   - Nome da RA
   - Status (com/sem material)
   - Botão de upload/editar
   - Toggle ativar/desativar
4. **Dialog de upload** com:
   - Seletor de arquivo
   - Nome do material
   - Delay específico (opcional)
   - Preview do material atual

### Storage Bucket

Utilizar bucket existente `lead-funnel-assets` ou criar novo bucket `region-materials` para armazenar os arquivos.

