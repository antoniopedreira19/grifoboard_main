import React, { useState } from "react";
import { Plus, AlertTriangle, AlertCircle, CheckCircle2, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PmpFormData, Restricao, ColorKey } from "@/types/pmp";
import { safeFormatDate, isDateOverdue } from "@/utils/pmpDateUtils";

const COLOR_BG_MAP_LOCAL: Record<string, string> = {
  yellow: "bg-yellow-400",
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
  lime: "bg-lime-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  teal: "bg-teal-500",
};

const COLOR_KEYS = Object.keys(COLOR_BG_MAP_LOCAL);

interface PmpAtividadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    formData: PmpFormData;
    restricoesNovas: Restricao[];
  }) => void;
  onOpenSetorModal: () => void;
  editingId: string | null;
  initialFormData: PmpFormData;
  initialRestricoes: Restricao[];
  setores: string[];
  isSaving?: boolean;
}

export const PmpAtividadeModal = React.memo(function PmpAtividadeModal({
  isOpen,
  onClose,
  onSave,
  onOpenSetorModal,
  editingId,
  initialFormData,
  initialRestricoes,
  setores,
  isSaving = false,
}: PmpAtividadeModalProps) {
  const [formData, setFormData] = useState<PmpFormData>(initialFormData);
  const [restricoesTemp, setRestricoesTemp] = useState<Restricao[]>(initialRestricoes);
  const [novaRestricao, setNovaRestricao] = useState({ descricao: "", data_limite: "" });

  // Sincroniza dados quando modal abre com novos dados
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setRestricoesTemp(initialRestricoes);
      setNovaRestricao({ descricao: "", data_limite: "" });
    }
  }, [isOpen, initialFormData, initialRestricoes]);

  const handleAddRestricao = () => {
    if (!novaRestricao.descricao || !novaRestricao.data_limite) return;
    setRestricoesTemp([...restricoesTemp, { ...novaRestricao }]);
    setNovaRestricao({ descricao: "", data_limite: "" });
  };

  const handleRemoveRestricao = (index: number) => {
    const newList = [...restricoesTemp];
    newList.splice(index, 1);
    setRestricoesTemp(newList);
  };

  const handleSave = () => {
    if (!formData.titulo) return;
    
    // Filtra apenas restrições novas (sem ID)
    const restricoesNovas = restricoesTemp.filter((r) => !r.id);
    
    onSave({
      formData,
      restricoesNovas,
    });
  };

  const pendingCount = restricoesTemp.filter((r) => !r.resolvido).length;
  const resolvedCount = restricoesTemp.filter((r) => r.resolvido).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingId ? "Editar" : "Nova"} Atividade
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Título</Label>
            <Input
              placeholder="O que será feito?"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="h-11"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Início</Label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Término</Label>
              <Input
                type="date"
                value={formData.data_termino}
                onChange={(e) => setFormData({ ...formData, data_termino: e.target.value })}
                className="h-11"
              />
            </div>
          </div>

          {/* Responsável e Setor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Responsável</Label>
              <Input
                placeholder="Nome"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Setor</Label>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={onOpenSetorModal}
                >
                  Novo
                </Button>
              </div>
              <Select
                value={formData.setor}
                onValueChange={(value) => setFormData({ ...formData, setor: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Restrições */}
          <div className="space-y-3 border-t pt-5 mt-1">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Restrições
              </Label>
              {restricoesTemp.length > 0 && (
                <div className="flex gap-2">
                  {pendingCount > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                      {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {resolvedCount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      {resolvedCount} resolvida{resolvedCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Input para nova restrição */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Descrição da restrição"
                  value={novaRestricao.descricao}
                  onChange={(e) =>
                    setNovaRestricao({ ...novaRestricao, descricao: e.target.value })
                  }
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && novaRestricao.descricao && novaRestricao.data_limite) {
                      e.preventDefault();
                      handleAddRestricao();
                    }
                  }}
                />
              </div>
              <div className="w-[150px]">
                <Input
                  type="date"
                  value={novaRestricao.data_limite}
                  onChange={(e) =>
                    setNovaRestricao({ ...novaRestricao, data_limite: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddRestricao}
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={!novaRestricao.descricao || !novaRestricao.data_limite}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de restrições */}
            {restricoesTemp.length > 0 && (
              <div className="space-y-2 mt-3">
                {restricoesTemp.map((rest, index) => {
                  const isOverdue = !rest.resolvido && isDateOverdue(rest.data_limite);
                  
                  return (
                    <div
                      key={rest.id || `temp-${index}`}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-all
                        ${rest.resolvido 
                          ? "bg-green-50/50 border-green-200" 
                          : isOverdue 
                            ? "bg-red-50/50 border-red-200" 
                            : "bg-amber-50/50 border-amber-200"
                        }
                      `}
                    >
                      {/* Ícone de status */}
                      <div className="flex-shrink-0">
                        {rest.resolvido ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : isOverdue ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight ${
                          rest.resolvido ? "text-green-700 line-through" : isOverdue ? "text-red-700" : "text-slate-700"
                        }`}>
                          {rest.descricao}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className={`text-xs ${
                            isOverdue && !rest.resolvido ? "text-red-600 font-semibold" : "text-slate-500"
                          }`}>
                            {safeFormatDate(rest.data_limite, "dd/MM/yyyy", "-")}
                          </span>
                          {isOverdue && !rest.resolvido && (
                            <Badge variant="destructive" className="text-[10px] h-4 ml-1">
                              Atrasada
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Botão remover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        onClick={() => handleRemoveRestricao(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {restricoesTemp.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-400">
                Nenhuma restrição cadastrada
              </div>
            )}
          </div>

          {/* Cor do Card */}
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Cor do Card</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setFormData({ ...formData, cor: key as ColorKey })}
                  className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                    COLOR_BG_MAP_LOCAL[key]
                  } ${
                    formData.cor === key
                      ? "border-slate-700 scale-110 ring-2 ring-offset-2 ring-slate-300"
                      : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.titulo}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
