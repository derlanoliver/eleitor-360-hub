import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface ResponsiveSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export function ResponsiveSelect({
  value,
  onValueChange,
  placeholder = "Selecione...",
  options,
  disabled = false,
  className,
}: ResponsiveSelectProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label;

  // Mobile: use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !selectedLabel && "text-muted-foreground",
              className
            )}
          >
            {selectedLabel || placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <DrawerTitle>{placeholder}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="h-[50vh]">
            <div className="p-2">
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-colors",
                    "hover:bg-accent active:bg-accent",
                    value === option.value && "bg-accent"
                  )}
                >
                  <span className="text-sm">{option.label}</span>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: use standard Select
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
