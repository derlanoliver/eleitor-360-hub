import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOfficeCitiesByType } from "@/hooks/office/useOfficeCities";
import { Loader2, MapPin } from "lucide-react";

interface RegionSelectProps {
  value?: string;
  onValueChange: (cityId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}

const ENTORNO_OPTION_VALUE = "__ENTORNO__";

export function RegionSelect({
  value,
  onValueChange,
  label = "Cidade/RA",
  placeholder = "Selecione a cidade/RA",
  required = false,
  disabled = false,
  showLabel = false,
}: RegionSelectProps) {
  const { dfCities, entornoCities, isLoading, data: allCities } = useOfficeCitiesByType();
  const [showEntornoSelect, setShowEntornoSelect] = useState(false);
  const [selectedEntornoId, setSelectedEntornoId] = useState("");

  // Determinar se o valor atual é do Entorno
  useEffect(() => {
    if (value && allCities) {
      const city = allCities.find(c => c.id === value);
      if (city?.tipo === 'ENTORNO') {
        setShowEntornoSelect(true);
        setSelectedEntornoId(value);
      } else {
        setShowEntornoSelect(false);
        setSelectedEntornoId("");
      }
    }
  }, [value, allCities]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {showLabel && <Label>{label}{required && " *"}</Label>}
        <div className="flex items-center justify-center h-10 border rounded-md bg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const handleMainSelectChange = (selectedValue: string) => {
    if (selectedValue === ENTORNO_OPTION_VALUE) {
      setShowEntornoSelect(true);
      setSelectedEntornoId("");
      // Não chama onValueChange ainda - esperando seleção do Entorno
    } else {
      setShowEntornoSelect(false);
      setSelectedEntornoId("");
      onValueChange(selectedValue);
    }
  };

  const handleEntornoSelectChange = (entornoId: string) => {
    setSelectedEntornoId(entornoId);
    onValueChange(entornoId);
  };

  // Determinar o valor a ser exibido no select principal
  const mainSelectValue = showEntornoSelect ? ENTORNO_OPTION_VALUE : value;

  return (
    <div className="space-y-3">
      {showLabel && <Label>{label}{required && " *"}</Label>}
      
      {/* Select principal - RAs do DF + opção "Moro no Entorno" */}
      <Select 
        value={mainSelectValue || ""} 
        onValueChange={handleMainSelectChange} 
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {dfCities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.nome} ({city.codigo_ra})
            </SelectItem>
          ))}
          
          {entornoCities.length > 0 && (
            <>
              <div className="my-1 border-t" />
              <SelectItem value={ENTORNO_OPTION_VALUE}>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Moro no Entorno
                </span>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      {/* Select secundário - Cidades do Entorno */}
      {showEntornoSelect && entornoCities.length > 0 && (
        <div className="space-y-2">
          {showLabel && <Label className="text-sm text-muted-foreground">Qual cidade do Entorno?{required && " *"}</Label>}
          <Select 
            value={selectedEntornoId} 
            onValueChange={handleEntornoSelectChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cidade do Entorno" />
            </SelectTrigger>
            <SelectContent>
              {entornoCities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
