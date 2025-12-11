import { useState, useMemo } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfficeLeaders } from "@/hooks/office/useOfficeLeaders";

interface LeaderAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  cityId?: string;
  disabled?: boolean;
  placeholder?: string;
  allowAllLeaders?: boolean;
}

export function LeaderAutocomplete({
  value,
  onValueChange,
  cityId,
  disabled,
  placeholder = "Selecione o líder",
  allowAllLeaders = false
}: LeaderAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const { data: leaders, isLoading, isError, refetch } = useOfficeLeaders({
    cidade_id: cityId,
    search: search || undefined
  });
  
  const selectedLeader = useMemo(
    () => leaders?.find((leader) => leader.id === value),
    [leaders, value]
  );
  
  const hasLeaders = leaders && leaders.length > 0;
  const isDisabled = disabled || (!cityId && !allowAllLeaders);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isDisabled || isLoading}
          onClick={isError ? () => refetch() : undefined}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : isError ? (
            <span className="text-destructive">Erro ao carregar - Clique para tentar novamente</span>
          ) : selectedLeader ? (
            <>
              {selectedLeader.nome_completo}
              {selectedLeader.cidade && (
                <span className="ml-2 text-xs text-muted-foreground">
                  — {selectedLeader.cidade.nome}
                </span>
              )}
            </>
          ) : !cityId && !allowAllLeaders ? (
            "Selecione a cidade primeiro"
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar líder..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {!cityId && !allowAllLeaders
                ? "Selecione uma cidade primeiro"
                : !hasLeaders
                ? "Nenhum líder cadastrado nesta região. Cadastre um líder primeiro."
                : "Nenhum líder encontrado"}
            </CommandEmpty>
            <CommandGroup>
              {leaders?.map((leader) => (
                <CommandItem
                  key={leader.id}
                  value={leader.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === leader.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{leader.nome_completo}</span>
                    {leader.cidade && (
                      <span className="text-xs text-muted-foreground">
                        {leader.cidade.nome} ({leader.cidade.codigo_ra})
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
