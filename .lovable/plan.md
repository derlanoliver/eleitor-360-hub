

## Adicionar Seletor de Material no Envio em Massa de SMS

### Resumo
Quando o template "Material Região (padrão)" for selecionado na aba de Envio em Massa, exibir um dropdown para escolher qual material (link) será enviado. O link do material selecionado será usado na variável `{{link_material}}` do template.

### Fluxo Proposto

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FLUXO DE SELEÇÃO                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Usuário seleciona template "Material Região (padrão)"                    │
│                                                                              │
│  2. Sistema exibe novo dropdown:                                             │
│     ┌─────────────────────────────────────────┐                              │
│     │ Material (Link)                          │                              │
│     │ ┌─────────────────────────────────────┐ │                              │
│     │ │ Selecione o material...             │ │                              │
│     │ └─────────────────────────────────────┘ │                              │
│     │   • Guia de Liderança - Taguatinga      │                              │
│     │   • Material do Plano Piloto            │                              │
│     │   • Cartilha Ceilândia                  │                              │
│     └─────────────────────────────────────────┘                              │
│                                                                              │
│  3. Ao enviar, variável {{link_material}} = URL do material selecionado      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interface

Novo campo condicional que aparece quando:
- Template selecionado é `material-regiao-sms`
- OU template contém a variável `{{link_material}}`

O dropdown listará todos os materiais cadastrados em `region_materials`:
- Nome: `{nome_material} - {nome_regiao}` (ex: "Guia de Liderança - Taguatinga")
- Valor: URL do material

---

## Seção Técnica

### Arquivo a Modificar

**`src/components/sms/SMSBulkSendTab.tsx`**

### Alterações

1. **Importar hook de materiais**:
```tsx
import { useRegionMaterials } from "@/hooks/useRegionMaterials";
```

2. **Adicionar estado para material selecionado**:
```tsx
const [selectedMaterialUrl, setSelectedMaterialUrl] = useState<string>("");
```

3. **Buscar materiais**:
```tsx
const { data: regionMaterials } = useRegionMaterials();
```

4. **Verificar se template requer material**:
```tsx
const templateRequiresMaterial = selectedTemplate === "material-regiao-sms" || 
  selectedTemplateData?.variaveis?.includes("link_material");
```

5. **Renderizar seletor condicional** (após o seletor de template):
```tsx
{templateRequiresMaterial && (
  <div className="space-y-2">
    <Label>Material (Link)</Label>
    <Select value={selectedMaterialUrl} onValueChange={setSelectedMaterialUrl}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o material" />
      </SelectTrigger>
      <SelectContent>
        {regionMaterials?.filter(m => m.is_active).map((material) => (
          <SelectItem key={material.id} value={material.material_url}>
            {material.material_name} - {material.office_cities?.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

6. **Passar link do material nas variáveis** (na função `handleSendBulk`):
```tsx
const variables: Record<string, string> = {
  nome: recipient.nome || "",
  email: recipient.email || "",
  // Adicionar link do material quando selecionado
  ...(selectedMaterialUrl && { link_material: selectedMaterialUrl }),
};
```

7. **Validar seleção antes de enviar**:
```tsx
if (templateRequiresMaterial && !selectedMaterialUrl) {
  toast.error("Selecione um material para enviar");
  return;
}
```

8. **Limpar seleção ao trocar template**:
```tsx
// No onChange do Select de template:
onValueChange={(v) => {
  setSelectedTemplate(v);
  setSelectedMaterialUrl(""); // Limpar material ao trocar template
}}
```

### Resultado Esperado

- Ao selecionar o template "Material Região (padrão)", aparece um dropdown com todos os materiais cadastrados
- O usuário escolhe qual material será enviado
- O sistema usa a URL do material na variável `{{link_material}}`
- Se não selecionar um material, o envio é bloqueado com mensagem de erro

