
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface RegistrySelectProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  onOpenRegistryDialog?: () => void;
  className?: string;
}

const RegistrySelect: React.FC<RegistrySelectProps> = ({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  onOpenRegistryDialog,
  className
}) => {
  // Filter out any empty options
  const validOptions = options.filter(option => option.trim() !== "");
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="font-medium">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {validOptions.length > 0 ? (
            validOptions.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <p>Nenhum {label.toLowerCase()} cadastrado</p>
              {onOpenRegistryDialog && (
                <Button 
                  variant="link" 
                  className="mt-2 p-0 h-auto text-primary"
                  onClick={onOpenRegistryDialog}
                >
                  Adicione através do botão "Cadastro"
                </Button>
              )}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RegistrySelect;
