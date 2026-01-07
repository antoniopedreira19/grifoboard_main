import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
// CORREÇÃO: Usando PlaybookItem
import { PlaybookItem } from "@/types/playbook";
import { Separator } from "@/components/ui/separator";
import { Building2, DollarSign, User, Calendar, FileText, HardHat, Hammer, Construction } from "lucide-react";

interface PlaybookDetailsModalProps {
  item: PlaybookItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaybookDetailsModal({ item, isOpen, onClose }: PlaybookDetailsModalProps) {
  if (!item) return null;

  const formatCurrency = (val: number | null | undefined) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  // Cast para any para garantir acesso caso tipagem ainda não tenha atualizado no cache
  const data = item as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs text-slate-500">
              {data.codigo || data.proposta}
            </Badge>
            <DialogTitle className="text-lg leading-tight text-slate-800">{data.descricao || data.etapa}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-sm font-medium text-slate-600">Status</span>
            <Badge
              className={
                data.status_contratacao === "Negociadas"
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : data.status_contratacao === "Em Andamento"
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
              }
            >
              {data.status_contratacao || "A Negociar"}
            </Badge>
          </div>

          {/* Dados Gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1">
                <User className="w-3 h-3" /> Responsável
              </span>
              <p className="text-sm font-medium text-slate-700">{data.responsavel || "-"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Unidade
              </span>
              <p className="text-sm font-medium text-slate-700">
                {data.qtd} {data.unidade}
              </p>
            </div>
          </div>

          <Separator />

          {/* Detalhamento de Custos */}
          <div className="space-y-3">
            <h4 className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1 mb-2">
              <DollarSign className="w-3 h-3" /> Composição de Custos
            </h4>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex flex-col p-2 bg-blue-50/50 rounded border border-blue-100">
                <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                  <HardHat className="w-3 h-3" /> Mão de Obra
                </span>
                <span className="font-mono text-slate-700">{formatCurrency(data.valor_mao_de_obra)}</span>
              </div>
              <div className="flex flex-col p-2 bg-orange-50/50 rounded border border-orange-100">
                <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                  <Hammer className="w-3 h-3" /> Materiais
                </span>
                <span className="font-mono text-slate-700">{formatCurrency(data.valor_materiais)}</span>
              </div>
              <div className="flex flex-col p-2 bg-yellow-50/50 rounded border border-yellow-100">
                <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-1">
                  <Construction className="w-3 h-3" /> Equipamentos
                </span>
                <span className="font-mono text-slate-700">{formatCurrency(data.valor_equipamentos)}</span>
              </div>
              <div className="flex flex-col p-2 bg-emerald-50/50 rounded border border-emerald-100">
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Verbas
                </span>
                <span className="font-mono text-slate-700">{formatCurrency(data.valor_verbas)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
              <span className="font-bold text-slate-700">Total do Item</span>
              <span className="font-bold font-mono text-lg text-slate-900">
                {formatCurrency(data.preco_total || data.precoTotal)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Dados de Contratação */}
          {data.status_contratacao === "Negociadas" && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 space-y-1">
              <span className="text-xs text-green-600 uppercase font-bold">Valor Fechado</span>
              <p className="text-lg font-mono font-bold text-green-700">{formatCurrency(data.valor_contratado)}</p>
            </div>
          )}

          {data.observacao && (
            <div className="space-y-1 bg-slate-50 p-3 rounded text-sm text-slate-600 italic">
              <p>"{data.observacao}"</p>
            </div>
          )}

          <div className="text-xs text-slate-400 text-right">
            Criado em: {data.created_at ? format(new Date(data.created_at), "dd/MM/yyyy") : "-"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
