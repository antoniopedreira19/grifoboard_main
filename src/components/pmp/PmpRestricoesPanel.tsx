import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

  const filteredRestricoes = showResolved
    ? restricoes
    : restricoes.filter((r) => !r.resolvido);

  const pendingCount = restricoes.filter((r) => !r.resolvido).length;

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
                  Nenhuma restrição encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredRestricoes.map((restricao, index) => {
                // Usar um ID único composto se o ID da restrição não existir
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
