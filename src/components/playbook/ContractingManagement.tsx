import { useState, useMemo } from "react";
import { PlaybookItem } from "@/types/playbook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Loader2, Building2, Truck, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ContractingTable } from "./ContractingTable";

interface ContractingManagementProps {
  data?: PlaybookItem[];
  grandTotalOriginal?: number;
  grandTotalMeta?: number;
  onUpdate?: () => void;
}

type DestinoType = "obra_direta" | "fornecimento" | "cliente";

const DESTINOS: { key: DestinoType; label: string; icon: React.ReactNode }[] = [
  { key: "obra_direta", label: "Obra", icon: <Building2 className="h-4 w-4" /> },
  { key: "fornecimento", label: "Fornecimento", icon: <Truck className="h-4 w-4" /> },
  { key: "cliente", label: "Cliente", icon: <User className="h-4 w-4" /> },
];

export function ContractingManagement({
  data = [],
  grandTotalOriginal = 0,
  grandTotalMeta = 0,
  onUpdate = () => {},
}: ContractingManagementProps) {
  const [activeDestino, setActiveDestino] = useState<DestinoType>("obra_direta");

  // Filtra apenas itens de nível 2 (itens reais, não etapas)
  const actionableItems = useMemo(() => {
    return data.filter((item) => item.nivel === 2);
  }, [data]);

  // Agrupa itens por destino (verifica todos os campos de destino)
  const itemsByDestino = useMemo(() => {
    const grouped: Record<DestinoType, PlaybookItem[]> = {
      obra_direta: [],
      fornecimento: [],
      cliente: [],
    };

    actionableItems.forEach((item) => {
      // Verifica se o item tem algum destino definido
      const destinos = [
        item.destino_mao_de_obra,
        item.destino_materiais,
        item.destino_equipamentos,
        item.destino_verbas,
      ];

      destinos.forEach((destino) => {
        if (destino && grouped[destino as DestinoType]) {
          // Evita duplicatas no mesmo grupo
          if (!grouped[destino as DestinoType].find((i) => i.id === item.id)) {
            grouped[destino as DestinoType].push(item);
          }
        }
      });
    });

    return grouped;
  }, [actionableItems]);

  // Calcula totais por status para o destino atual
  const statusSummary = useMemo(() => {
    const items = itemsByDestino[activeDestino];
    
    let contratado = 0;
    let emAndamento = 0;
    let aContratar = 0;

    items.forEach((item) => {
      const status = item.status_contratacao || "A Negociar";
      const valor = item.preco_total || 0;

      if (status === "Negociadas" || (item.valor_contratado && item.valor_contratado > 0)) {
        contratado += item.valor_contratado || valor;
      } else if (status === "Em Andamento") {
        emAndamento += valor;
      } else {
        aContratar += valor;
      }
    });

    return { contratado, emAndamento, aContratar, total: contratado + emAndamento + aContratar };
  }, [itemsByDestino, activeDestino]);

  // Conta itens por destino para badges
  const countByDestino = useMemo(() => {
    return {
      obra_direta: itemsByDestino.obra_direta.length,
      fornecimento: itemsByDestino.fornecimento.length,
      cliente: itemsByDestino.cliente.length,
    };
  }, [itemsByDestino]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  if (data.length === 0) {
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

  const hasNoDestinosConfigured = countByDestino.obra_direta === 0 && 
    countByDestino.fornecimento === 0 && 
    countByDestino.cliente === 0;

  if (hasNoDestinosConfigured) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Destinos não configurados</AlertTitle>
        <AlertDescription className="text-amber-600">
          Configure os destinos de contratação na aba "Orçamento" para visualizar os itens aqui.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Farol de Contratações</h2>
          <p className="text-sm text-muted-foreground">Clique em cada campo para editar.</p>
        </div>
      </div>

      {/* Abas por Destino */}
      <Tabs value={activeDestino} onValueChange={(v) => setActiveDestino(v as DestinoType)} className="w-full">
        <TabsList className="bg-muted/50 border p-1 rounded-lg">
          {DESTINOS.map((destino) => (
            <TabsTrigger
              key={destino.key}
              value={destino.key}
              className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {destino.icon}
              <span>{destino.label}</span>
              {countByDestino[destino.key] > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                  {countByDestino[destino.key]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {DESTINOS.map((destino) => (
          <TabsContent key={destino.key} value={destino.key} className="mt-6 space-y-6">
            {/* Cards de Resumo por Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700">Contratado</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(statusSummary.contratado)}
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    {statusSummary.total > 0 
                      ? `${((statusSummary.contratado / statusSummary.total) * 100).toFixed(1)}% do total`
                      : "0% do total"
                    }
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-700">Em Andamento</CardTitle>
                  <Loader2 className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {formatCurrency(statusSummary.emAndamento)}
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    {statusSummary.total > 0 
                      ? `${((statusSummary.emAndamento / statusSummary.total) * 100).toFixed(1)}% do total`
                      : "0% do total"
                    }
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">A Contratar</CardTitle>
                  <Clock className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-700">
                    {formatCurrency(statusSummary.aContratar)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {statusSummary.total > 0 
                      ? `${((statusSummary.aContratar / statusSummary.total) * 100).toFixed(1)}% do total`
                      : "0% do total"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Itens */}
            {itemsByDestino[destino.key].length > 0 ? (
              <ContractingTable
                items={itemsByDestino[destino.key]}
                destino={destino.key}
                onUpdate={onUpdate}
              />
            ) : (
              <Alert className="bg-muted/50 border-muted">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <AlertTitle className="text-foreground">Nenhum item</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Nenhum item configurado para "{destino.label}". Configure na aba Orçamento.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
