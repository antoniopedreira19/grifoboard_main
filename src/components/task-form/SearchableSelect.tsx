import { useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  onOpenRegistryDialog?: () => void;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  onOpenRegistryDialog,
  className
}) => {
  const [open, setOpen] = useState(false);
  
  // Filter out any empty options
  const validOptions = options.filter(option => option.trim() !== "");
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 px-3 text-sm bg-background"
          >
            <span className="truncate">
              {value || placeholder}
            </span>
            <div className="flex items-center gap-1">
              {value && (
                <X 
                  className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onValueChange("");
                  }}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white z-50 pointer-events-auto" align="start">
          <Command className="pointer-events-auto">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder={`Buscar ${label.toLowerCase()}...`} 
                className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
              />
            </div>
            <CommandList className="max-h-[200px] overflow-y-auto overscroll-contain touch-auto pointer-events-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80">
              {validOptions.length > 0 ? (
                <CommandGroup>
                  {value && (
                    <CommandItem
                      key="clear-option"
                      value=""
                      onSelect={() => {
                        onValueChange("");
                        setOpen(false);
                      }}
                      className="px-3 py-2 text-sm cursor-pointer text-muted-foreground italic border-b"
                    >
                      <X className="mr-2 h-4 w-4" />
                      <span>Limpar seleção</span>
                    </CommandItem>
                  )}
                  {validOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                      className="px-3 py-2 text-sm cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{option}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty className="py-6 text-center text-sm">
                  <div className="text-muted-foreground">
                    <p>Nenhum {label.toLowerCase()} cadastrado</p>
                    {onOpenRegistryDialog && (
                      <Button 
                        variant="link" 
                        className="mt-2 p-0 h-auto text-primary text-sm"
                        onClick={() => {
                          setOpen(false);
                          onOpenRegistryDialog();
                        }}
                      >
                        Adicione através do botão "Cadastro"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchableSelect;