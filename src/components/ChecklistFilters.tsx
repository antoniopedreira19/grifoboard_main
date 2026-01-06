
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ChecklistFiltersProps {
  onFiltersChange: (filters: {
    local: string;
    setor: string;
    responsavel: string;
  }) => void;
  uniqueLocais: string[];
  uniqueSetores: string[];
  uniqueResponsaveis: string[];
}

const ChecklistFilters: React.FC<ChecklistFiltersProps> = ({ 
  onFiltersChange, 
  uniqueLocais, 
  uniqueSetores, 
  uniqueResponsaveis 
}) => {
  const [filters, setFilters] = useState({
    local: '',
    setor: '',
    responsavel: ''
  });

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearIndividualFilter = (field: string) => {
    const newFilters = { ...filters, [field]: '' };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = { local: '', setor: '', responsavel: '' };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = filters.local || filters.setor || filters.responsavel;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="filter-local">Local</Label>
            {filters.local && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearIndividualFilter('local')}
                className="h-auto p-0.5"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select value={filters.local} onValueChange={(value) => handleFilterChange('local', value)}>
            <SelectTrigger id="filter-local">
              <SelectValue placeholder="Filtrar por local..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueLocais.map(local => (
                <SelectItem key={local} value={local}>{local}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="filter-setor">Setor</Label>
            {filters.setor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearIndividualFilter('setor')}
                className="h-auto p-0.5"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select value={filters.setor} onValueChange={(value) => handleFilterChange('setor', value)}>
            <SelectTrigger id="filter-setor">
              <SelectValue placeholder="Filtrar por setor..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueSetores.map(setor => (
                <SelectItem key={setor} value={setor}>{setor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="filter-responsavel">Responsável</Label>
            {filters.responsavel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearIndividualFilter('responsavel')}
                className="h-auto p-0.5"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select value={filters.responsavel} onValueChange={(value) => handleFilterChange('responsavel', value)}>
            <SelectTrigger id="filter-responsavel">
              <SelectValue placeholder="Filtrar por responsável..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueResponsaveis.map(responsavel => (
                <SelectItem key={responsavel} value={responsavel}>{responsavel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ChecklistFilters;
