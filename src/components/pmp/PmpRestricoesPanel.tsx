import React, { useState, useMemo } from "react";
import { AlertTriangle, Search, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { RestricaoComAtividade } from "@/types/pmp";
import { safeFormatDate, isDateOverdue } from "@/utils/pmpDateUtils";

interface PmpRestricoesPanelProps {
  restricoes: RestricaoComAtividade[];
  isLoading?: boolean;
  onResolve: (id: string, resolvido: boolean) => void;
}

export const PmpRestricoesPanel = React.memo(function PmpRestricoesPanel({
  restricoes,
  isLoading = false,
  onResolve,
}: PmpRestricoesPanelProps) {
  const [showResolved, setShowResolved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");

  // Extrai semanas únicas das restrições
  const uniqueWeeks = useMemo(() => {
    const weeks = new Set<string>();
    restricoes.forEach((r) => {
      if (r.semana) {
        weeks.add(r.semana);
      }
    });
    return Array.from(weeks).sort();
  }, [restricoes]);

  // Filtra as restrições
  const filteredRestricoes = useMemo(() => {
    return restricoes.filter((r) => {
      // Filtro de resolvidas
      if (!showResolved && r.resolvido) {
        return false;
      }

      // Filtro por semana
      if (selectedWeek !== "all" && r.semana !== selectedWeek) {
        return false;
      }

      // Filtro por busca (atividade ou descrição)
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const matchesAtividade = r.atividadeTitulo?.toLowerCase().includes(search);
        const matchesDescricao = r.descricao?.toLowerCase().includes(search);
        if (!matchesAtividade && !matchesDescricao) {
          return false;
        }
      }

      return true;
    });
  }, [restricoes, showResolved, selectedWeek, searchTerm]);

  const pendingCount = restricoes.filter((r) => !r.resolvido).length;
  const hasActiveFilters = searchTerm.trim() !== "" || selectedWeek !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedWeek("all");
  };

  if (isLoading) {
    return (
      <div className="w-full border border-slate-200 rounded-xl bg-white shadow-sm p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white shadow-sm p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-slate-700 text-lg">
            Painel de Restrições
          </h3>
          <Badge variant="outline" className="ml-2">
            {pendingCount} pendentes
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="show-resolved"
            className="text-sm text-slate-600 cursor-pointer"
          >
            Mostrar Resolvidas
          </Label>
          <Switch
            id="show-resolved"
            checked={showResolved}
            onCheckedChange={setShowResolved}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Busca por atividade */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por atividade ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>

        {/* Filtro por semana */}
        <div className="w-full sm:w-[200px]">
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="h-9 bg-white">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filtrar por semana" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Todas as semanas</SelectItem>
              {uniqueWeeks.map((week) => (
                <SelectItem key={week} value={week}>
                  {safeFormatDate(week, "dd/MM/yyyy", week)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Contador de resultados filtrados */}
      {hasActiveFilters && (
        <div className="text-xs text-slate-500 mb-2">
          Mostrando {filteredRestricoes.length} de {showResolved ? restricoes.length : pendingCount} restrições
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-lg border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead>Restrição</TableHead>
              <TableHead>Semana</TableHead>
              <TableHead>Data Limite</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRestricoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  {hasActiveFilters 
                    ? "Nenhuma restrição encontrada com os filtros aplicados."
                    : "Nenhuma restrição encontrada."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredRestricoes.map((restricao, index) => {
                const uniqueKey = restricao.id || `${restricao.atividadeId}-${index}`;
                const isOverdue = !restricao.resolvido && isDateOverdue(restricao.data_limite);

                return (
                  <TableRow
                    key={uniqueKey}
                    className={restricao.resolvido ? "bg-slate-50/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={restricao.resolvido}
                        disabled={!restricao.id}
                        onCheckedChange={(checked) => {
                          if (restricao.id) {
                            onResolve(restricao.id, !!checked);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {restricao.atividadeTitulo}
                    </TableCell>
                    <TableCell>{restricao.descricao}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {safeFormatDate(restricao.semana, "dd/MM", "-")}
                    </TableCell>
                    <TableCell
                      className={isOverdue ? "text-red-600 font-bold" : ""}
                    >
                      {safeFormatDate(restricao.data_limite, "dd/MM/yyyy", "-")}
                    </TableCell>
                    <TableCell>
                      {restricao.resolvido ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Resolvido
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
