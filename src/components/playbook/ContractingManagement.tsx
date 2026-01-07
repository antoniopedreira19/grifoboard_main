import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaybookItem } from "@/types/playbook";
import { playbookService } from "@/services/playbookService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Building2, Truck, User, HardHat, Hammer, Construction, FileText, Loader2, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function ContractingManagement() {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PlaybookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [userSession?.obraAtiva?.id]);

  const loadItems = async () => {
    if (!userSession?.obraAtiva?.id) return;
    try {
      setLoading(true);
      const data = await playbookService.listarItens(userSession.obraAtiva.id);
      // Filtra apenas itens (nível 2) que não são pais
      setItems(data.filter((item) => !item.is_parent && item.nivel === 2));
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
      // Atualiza estado local otimista
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));

      // Salva no Supabase
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
      // Reverte estado em caso de erro (idealmente) ou recarrega
      loadItems();
    }
  };

  // Componente auxiliar para o seletor de destino
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
        className={cn("h-8 text-xs w-full transition-colors", value ? colorClass : "bg-slate-50 text-slate-500")}
      >
        <SelectValue placeholder="Selecionar destino..." />
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Carregando itens do orçamento...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Nenhum item encontrado</AlertTitle>
        <AlertDescription className="text-blue-600">
          Importe uma planilha de orçamento na aba "Importar" para começar a gerenciar as contratações.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Contratação</h2>
          <p className="text-slate-600">Defina para onde vai cada verba do seu orçamento.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => {
          // Verifica se o item tem algum valor para exibir
          const hasValues =
            item.valor_mao_de_obra > 0 ||
            item.valor_materiais > 0 ||
            item.valor_equipamentos > 0 ||
            item.valor_verbas > 0;

          if (!hasValues) return null;

          return (
            <Card
              key={item.id}
              className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                {/* Cabeçalho do Item */}
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      {item.codigo}
                    </span>
                    <span className="font-semibold text-sm text-slate-700 truncate" title={item.descricao}>
                      {item.descricao}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white font-mono text-slate-600 shrink-0">
                    Total: {formatCurrency(item.preco_total || 0)}
                  </Badge>
                </div>

                {/* Grid de Componentes de Custo */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
                  {/* Mão de Obra */}
                  {item.valor_mao_de_obra > 0 ? (
                    <div className="flex flex-col gap-2 p-3 rounded-lg bg-blue-50/40 border border-blue-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide">
                        <HardHat className="w-3 h-3" /> Mão de Obra
                      </div>
                      <div className="text-lg font-bold text-slate-700 font-mono">
                        {formatCurrency(item.valor_mao_de_obra)}
                      </div>
                      <DestinationSelect
                        value={item.destino_mao_de_obra}
                        onChange={(v) => handleAssign(item.id, "destino_mao_de_obra", v)}
                        colorClass="bg-blue-100 border-blue-300 text-blue-900 font-medium hover:bg-blue-200"
                      />
                    </div>
                  ) : (
                    <div className="hidden lg:block"></div>
                  )}

                  {/* Materiais */}
                  {item.valor_materiais > 0 ? (
                    <div className="flex flex-col gap-2 p-3 rounded-lg bg-orange-50/40 border border-orange-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wide">
                        <Hammer className="w-3 h-3" /> Materiais
                      </div>
                      <div className="text-lg font-bold text-slate-700 font-mono">
                        {formatCurrency(item.valor_materiais)}
                      </div>
                      <DestinationSelect
                        value={item.destino_materiais}
                        onChange={(v) => handleAssign(item.id, "destino_materiais", v)}
                        colorClass="bg-orange-100 border-orange-300 text-orange-900 font-medium hover:bg-orange-200"
                      />
                    </div>
                  ) : (
                    <div className="hidden lg:block"></div>
                  )}

                  {/* Equipamentos */}
                  {item.valor_equipamentos > 0 ? (
                    <div className="flex flex-col gap-2 p-3 rounded-lg bg-yellow-50/40 border border-yellow-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-yellow-700 uppercase tracking-wide">
                        <Construction className="w-3 h-3" /> Equipamentos
                      </div>
                      <div className="text-lg font-bold text-slate-700 font-mono">
                        {formatCurrency(item.valor_equipamentos)}
                      </div>
                      <DestinationSelect
                        value={item.destino_equipamentos}
                        onChange={(v) => handleAssign(item.id, "destino_equipamentos", v)}
                        colorClass="bg-yellow-100 border-yellow-300 text-yellow-900 font-medium hover:bg-yellow-200"
                      />
                    </div>
                  ) : (
                    <div className="hidden lg:block"></div>
                  )}

                  {/* Verbas */}
                  {item.valor_verbas > 0 ? (
                    <div className="flex flex-col gap-2 p-3 rounded-lg bg-emerald-50/40 border border-emerald-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        <FileText className="w-3 h-3" /> Verbas/Taxas
                      </div>
                      <div className="text-lg font-bold text-slate-700 font-mono">
                        {formatCurrency(item.valor_verbas)}
                      </div>
                      <DestinationSelect
                        value={item.destino_verbas}
                        onChange={(v) => handleAssign(item.id, "destino_verbas", v)}
                        colorClass="bg-emerald-100 border-emerald-300 text-emerald-900 font-medium hover:bg-emerald-200"
                      />
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
