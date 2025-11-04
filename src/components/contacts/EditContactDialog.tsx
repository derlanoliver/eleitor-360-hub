import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegions } from "@/hooks/useRegions";
import { useOfficeLeaders } from "@/hooks/office/useOfficeLeaders";
import { useUpdateContact } from "@/hooks/contacts/useUpdateContact";
import { Loader2 } from "lucide-react";

interface EditContactDialogProps {
  contact: {
    id: string;
    nome: string;
    telefone_norm: string;
    cidade_id: string;
    source_type: string | null;
    source_id: string | null;
    genero?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
  const [cidadeId, setCidadeId] = useState(contact.cidade_id);
  const [leaderId, setLeaderId] = useState(contact.source_id || "");
  const [genero, setGenero] = useState(contact.genero || "Não identificado");
  
  const { data: regions = [] } = useRegions();
  const { data: leaders = [] } = useOfficeLeaders({ cidade_id: undefined });
  const updateContact = useUpdateContact();

  const handleSave = () => {
    updateContact.mutate(
      {
        id: contact.id,
        data: {
          cidade_id: cidadeId,
          source_id: leaderId || null,
          source_type: leaderId ? 'lider' : contact.source_type,
          genero,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Contato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome (read-only) */}
          <div>
            <Label>Nome</Label>
            <Input value={contact.nome} disabled className="bg-gray-50" />
          </div>

          {/* Telefone (read-only) */}
          <div>
            <Label>Telefone</Label>
            <Input value={contact.telefone_norm} disabled className="bg-gray-50" />
          </div>

          {/* Gênero */}
          <div>
            <Label>Gênero</Label>
            <Select value={genero} onValueChange={setGenero}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
                <SelectItem value="Não identificado">Não identificado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Região Administrativa */}
          <div>
            <Label>Região Administrativa</Label>
            <Select value={cidadeId} onValueChange={setCidadeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Líder */}
          <div>
            <Label>Líder Responsável</Label>
            <Select value={leaderId || "none"} onValueChange={(value) => setLeaderId(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum líder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum líder</SelectItem>
                {leaders.map((leader) => (
                  <SelectItem key={leader.id} value={leader.id}>
                    {leader.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateContact.isPending}>
            {updateContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
