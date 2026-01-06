import React, { useState } from "react";
import { Plus, X, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { PmpFormData, Restricao, ColorKey, COLOR_BG_MAP } from "@/types/pmp";
import { safeFormatDate } from "@/utils/pmpDateUtils";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar" : "Nova"} Atividade</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Título */}
          <div className="space-y-1">
            <Label>Título</Label>
            <Input
              placeholder="O que será feito?"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Início</Label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Término</Label>
              <Input
                type="date"
                value={formData.data_termino}
                onChange={(e) => setFormData({ ...formData, data_termino: e.target.value })}
              />
            </div>
          </div>

          {/* Responsável e Setor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Input
                placeholder="Nome"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Setor</Label>
                <Button
                  variant="link"
                  className="h-4 p-0 text-xs"
                  onClick={onOpenSetorModal}
                >
                  Novo
                </Button>
              </div>
              <Select
                value={formData.setor}
                onValueChange={(value) => setFormData({ ...formData, setor: value })}
              >
                <SelectTrigger>
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
          <div className="space-y-2 border-t pt-4 mt-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Restrições (Lookahead)
            </Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Descrição da restrição (ex: Falta material)"
                  value={novaRestricao.descricao}
                  onChange={(e) =>
                    setNovaRestricao({ ...novaRestricao, descricao: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div className="w-[140px] space-y-1">
                <Input
                  type="date"
                  value={novaRestricao.data_limite}
                  onChange={(e) =>
                    setNovaRestricao({ ...novaRestricao, data_limite: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddRestricao}
                size="icon"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {restricoesTemp.length > 0 && (
              <div className="bg-slate-50 rounded-md border border-slate-100 p-2 space-y-1 mt-2">
                {restricoesTemp.map((rest, index) => (
                  <div
                    key={rest.id || `temp-${index}`}
                    className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      {rest.resolvido ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className={rest.resolvido ? "line-through text-slate-400" : ""}>
                        {rest.descricao}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {safeFormatDate(rest.data_limite, "dd/MM", "-")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-600"
                        onClick={() => handleRemoveRestricao(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cor do Card */}
          <div className="space-y-2 pt-2">
            <Label>Cor do Card</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setFormData({ ...formData, cor: key as ColorKey })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    COLOR_BG_MAP_LOCAL[key]
                  } ${
                    formData.cor === key
                      ? "border-slate-600 scale-110 ring-2"
                      : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving || !formData.titulo}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
