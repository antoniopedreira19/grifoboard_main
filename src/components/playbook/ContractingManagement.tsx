import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaybookItem } from "@/types/playbook";
import { playbookService } from "@/services/playbookService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Truck,
  User,
  HardHat,
  Hammer,
  Construction,
  FileText,
  Loader2,
  AlertCircle,
  Filter,
  Percent,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ContractingManagement() {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PlaybookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllItems, setShowAllItems] = useState(true); // Controle de visualização

  useEffect(() => {
    loadItems();
  }, [userSession?.obraAtiva?.id]);

  const loadItems = async () => {
    if (!userSession?.obraAtiva?.id) return;
    try {
      setLoading(true);
      const data = await playbookService.listarItens(userSession.obraAtiva.id);
      setItems(data);
    } catch (error) {
      console.error("Erro ao carregar itens", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os itens do playbook.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (itemId: string, field: string, value: string) => {
    try {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));

      await playbookService.atualizarItem(itemId, { [field]: value });

      toast({
        title: "Destino definido",
        description: "A configuração de contratação foi salva.",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar a alteração.",
      });
      loadItems();
    }
  };

  const DestinationSelect = ({
    value,
    onChange,
    colorClass,
  }: {
    value?: string | null;
    onChange: (v: string) => void;
    colorClass: string;
  }) => (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-8 text-xs w-full transition-colors font-medium",
          value ? colorClass : "bg-slate-50 text-slate-500 border-slate-200",
        )}
      >
        <SelectValue placeholder="Definir Destino..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="obra_direta">
          <span className="flex items-center gap-2 font-medium">
            <Building2 className="w-3 h-3" /> Obra Direta
          </span>
        </SelectItem>
        <SelectItem value="fornecimento">
          <span className="flex items-center gap-2 font-medium">
            <Truck className="w-3 h-3" /> Fornecimento
          </span>
        </SelectItem>
        <SelectItem value="cliente">
          <span className="flex items-center gap-2 font-medium">
            <User className="w-3 h-3" /> Cliente
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // 1. Calcular o Total Geral da Obra (Soma dos itens nível 2 para evitar duplicação)
  // Se não houver nível definido, usa soma total.
  const grandTotal =
    items
      .filter((i) => i.nivel === 2) // Assume que nível 2 são as folhas
      .reduce((acc, i) => acc + (i.preco_total || 0), 0) || 1; // Evita divisão por zero

  // Filtro visual para a lista
  const filteredItems = items.filter((item) => {
    const hasValue = (item.preco_total || 0) > 0;
    if (!showAllItems) {
      // Se filtro ativado, mostra apenas itens relevantes (> 0.5% por exemplo) para limpar a tela
      const percent = ((item.preco_total || 0) / grandTotal) * 100;
      return hasValue && percent > 0.1;
    }
    return hasValue;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Carregando orçamento...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Orçamento Vazio</AlertTitle>
        <AlertDescription className="text-blue-600">
          Importe uma planilha para começar a gestão de contratação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Contratação (Curva A)</h2>
          <p className="text-slate-600">Defina o destino para itens com representatividade acima de 2%.</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-lg">
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Obra:</span>
            <span className="text-sm font-mono font-bold text-slate-800">{formatCurrency(grandTotal)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllItems(!showAllItems)}
            className="bg-white border shadow-sm h-8 text-xs"
          >
            <Filter className="w-3 h-3 mr-2" />
            {showAllItems ? "Ocultar Irrelevantes" : "Mostrar Tudo"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredItems.map((item) => {
          // Cálculo da Relevância
          const percent = ((item.preco_total || 0) / grandTotal) * 100;
          const isRelevant = percent >= 2.0; // REGRA DE OURO: > 2%

          // Seletor só aparece se for relevante
          const canAssign = isRelevant;

          const isRoot = item.nivel === 0;
          const isEtapa = item.nivel === 1;

          return (
            <Card
              key={item.id}
              className={cn(
                "overflow-hidden border-slate-200 transition-all",
                isRoot
                  ? "bg-slate-50 border-l-4 border-l-slate-800"
                  : isEtapa
                    ? "bg-slate-50/50 border-l-4 border-l-slate-400"
                    : "bg-white hover:shadow-md border-l-4 border-l-transparent hover:border-l-blue-400",
              )}
            >
              <CardContent className="p-0">
                {/* Header da Linha */}
                <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <span
                      className={cn(
                        "font-mono text-[10px] px-1.5 py-0.5 rounded border shrink-0",
                        isRoot ? "bg-slate-800 text-white font-bold" : "bg-white text-slate-500",
                      )}
                    >
                      {item.codigo}
                    </span>
                    <span
                      className={cn(
                        "text-sm truncate max-w-[400px]",
                        isRoot || isEtapa ? "font-bold text-slate-900" : "font-medium text-slate-700",
                      )}
                      title={item.descricao}
                    >
                      {item.descricao}
                    </span>

                    {/* Badge de % - Ajuda visual */}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] h-5 px-1.5 gap-1",
                        isRelevant ? "bg-blue-100 text-blue-700 font-bold" : "bg-slate-100 text-slate-400",
                      )}
                    >
                      <Percent className="w-3 h-3" />
                      {percent.toFixed(2)}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-sm font-bold text-slate-700">
                      {formatCurrency(item.preco_total || 0)}
                    </span>
                  </div>
                </div>

                {/* Grid de Valores e Seletores */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Mão de Obra */}
                  {item.valor_mao_de_obra > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase">
                          <HardHat className="w-3 h-3" /> Mão de Obra
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-600">
                          {formatCurrency(item.valor_mao_de_obra)}
                        </span>
                      </div>
                      {canAssign ? (
                        <DestinationSelect
                          value={item.destino_mao_de_obra}
                          onChange={(v) => handleAssign(item.id, "destino_mao_de_obra", v)}
                          colorClass="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                        />
                      ) : (
                        <div className="h-8 bg-slate-50 border border-slate-100 rounded flex items-center px-3 text-[10px] text-slate-400 italic">
                          Item &lt; 2%
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="hidden lg:block"></div>
                  )}

                  {/* Materiais */}
                  {item.valor_materiais > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-700 uppercase">
                          <Hammer className="w-3 h-3" /> Materiais
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-600">
                          {formatCurrency(item.valor_materiais)}
                        </span>
                      </div>
                      {canAssign ? (
                        <DestinationSelect
                          value={item.destino_materiais}
                          onChange={(v) => handleAssign(item.id, "destino_materiais", v)}
                          colorClass="bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
                        />
                      ) : (
                        <div className="h-8 bg-slate-50 border border-slate-100 rounded flex items-center px-3 text-[10px] text-slate-400 italic">
                          Item &lt; 2%
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="hidden lg:block"></div>
                  )}

                  {/* Equipamentos */}
                  {item.valor_equipamentos > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-700 uppercase">
                          <Construction className="w-3 h-3" /> Equipamentos
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-600">
                          {formatCurrency(item.valor_equipamentos)}
                        </span>
                      </div>
                      {canAssign ? (
                        <DestinationSelect
                          value={item.destino_equipamentos}
                          onChange={(v) => handleAssign(item.id, "destino_equipamentos", v)}
                          colorClass="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                        />
                      ) : (
                        <div className="h-8 bg-slate-50 border border-slate-100 rounded flex items-center px-3 text-[10px] text-slate-400 italic">
                          Item &lt; 2%
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="hidden lg:block"></div>
                  )}

                  {/* Verbas */}
                  {item.valor_verbas > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase">
                          <FileText className="w-3 h-3" /> Verbas
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-600">
                          {formatCurrency(item.valor_verbas)}
                        </span>
                      </div>
                      {canAssign ? (
                        <DestinationSelect
                          value={item.destino_verbas}
                          onChange={(v) => handleAssign(item.id, "destino_verbas", v)}
                          colorClass="bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                        />
                      ) : (
                        <div className="h-8 bg-slate-50 border border-slate-100 rounded flex items-center px-3 text-[10px] text-slate-400 italic">
                          Item &lt; 2%
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="hidden lg:block"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
