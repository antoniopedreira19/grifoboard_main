import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  Save,
  AlertCircle,
  X,
  Download,
  LayoutList,
  ListTree,
  Minus,
  Info,
  HardHat,
  Hammer,
  Construction,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { playbookService } from "@/services/playbookService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interface interna do componente atualizada
interface PlaybookItem {
  id: number;
  codigo: string; // Nova coluna baseada no CSV
  descricao: string;
  unidade: string;
  qtd: number;
  // Novos campos desagregados
  valorMaoDeObra: number;
  valorMateriais: number;
  valorEquipamentos: number;
  valorVerbas: number;
  // Totais
  precoTotal: number;
  nivel: 0 | 1 | 2; // 0=Principal, 1=Subetapa, 2=Item
  isEtapa: boolean;
}

interface PlaybookImporterProps {
  onSave?: () => void;
}

export function PlaybookImporter({ onSave }: PlaybookImporterProps) {
  const { toast } = useToast();
  const { userSession } = useAuth();
  const obraId = userSession?.obraAtiva?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [rawData, setRawData] = useState<PlaybookItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [coef1, setCoef1] = useState<string>("0.57");
  const [coef2, setCoef2] = useState<string>("0.75");
  const [selectedCoef, setSelectedCoef] = useState<"1" | "2">("1");

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    // Cabeçalhos exatos solicitados
    const headers = [
      "Código",
      "Descrição",
      "Unidade",
      "Quantidade orçada",
      "Mão de obra",
      "Materiais & Ferramentas",
      "Equipamentos de Obra",
      "Verbas, Taxas e Impostos",
      "Preço total",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    ws["!cols"] = [
      { wch: 15 }, // Código
      { wch: 45 }, // Descrição
      { wch: 10 }, // Unidade
      { wch: 12 }, // Qtd
      { wch: 15 }, // MO
      { wch: 20 }, // Mat
      { wch: 15 }, // Equip
      { wch: 15 }, // Verbas
      { wch: 15 }, // Total
    ];

    const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1:I1");
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[address]) {
        ws[address].s = {
          fill: { fgColor: { rgb: "112231" } },
          font: { color: { rgb: "A47528" }, bold: true },
          alignment: { horizontal: "center" },
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Orçamento Grifo");
    XLSX.writeFile(wb, "modelo_orcamento_grifo.xlsx");

    toast({ title: "Modelo baixado!", description: "Preencha a planilha e importe novamente." });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Mapeamento baseado no CSV "TESTE ANTONIO"
      // Col 0: Código | Col 1: Descrição | Col 2: Unidade | Col 3: Qtd
      // Col 4: MO | Col 5: Mat | Col 6: Equip | Col 7: Verbas | Col 8: Total
      const formatted: PlaybookItem[] = data
        .slice(1) // Pula cabeçalho
        .map((row, index) => {
          const valorMaoDeObra = row[4] ? Number(row[4]) : 0;
          const valorMateriais = row[5] ? Number(row[5]) : 0;
          const valorEquipamentos = row[6] ? Number(row[6]) : 0;
          const valorVerbas = row[7] ? Number(row[7]) : 0;

          // Se coluna 8 (Total) estiver vazia, soma os componentes
          const totalCalculado = valorMaoDeObra + valorMateriais + valorEquipamentos + valorVerbas;
          const precoTotal = row[8] ? Number(row[8]) : totalCalculado;

          return {
            id: index,
            codigo: row[0] ? String(row[0]).trim() : "",
            descricao: row[1] ? String(row[1]).trim() : "",
            unidade: row[2] ? String(row[2]).trim() : "",
            qtd: row[3] ? Number(row[3]) : 0,
            valorMaoDeObra,
            valorMateriais,
            valorEquipamentos,
            valorVerbas,
            precoTotal,
            nivel: 2 as 0 | 1 | 2,
            isEtapa: false,
          };
        })
        .filter((item) => item.descricao !== "" || item.codigo !== "");

      // Detecção Automática de Nível baseada no CSV
      // Itens com QTD vazia ou 0 são considerados cabeçalhos (Etapas)
      const autoDetected = formatted.map((item) => {
        const isHeader = !item.qtd || item.qtd === 0;

        // Tenta inferir nível pelo código (ex: "01" = nv0, "01.001" = nv1) se for header
        let nivel: 0 | 1 | 2 = 2;

        if (isHeader) {
          const dots = (item.codigo.match(/\./g) || []).length;
          if (dots === 0) nivel = 0;
          else if (dots === 1) nivel = 1;
          else nivel = 1; // Fallback para subetapa
        } else {
          nivel = 2;
        }

        return {
          ...item,
          nivel,
          isEtapa: nivel !== 2,
        } as PlaybookItem;
      });

      setRawData(autoDetected);
    };
    reader.readAsBinaryString(file);
  };

  const cycleLevel = (index: number) => {
    setRawData((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nextLevel = item.nivel === 2 ? 0 : item.nivel === 0 ? 1 : 2;
        return {
          ...item,
          nivel: nextLevel as 0 | 1 | 2,
          isEtapa: nextLevel !== 2,
        };
      }),
    );
  };

  const processedData = useMemo(() => {
    const activeCoef = selectedCoef === "1" ? parseFloat(coef1) : parseFloat(coef2);
    const validCoef = isNaN(activeCoef) ? 1 : activeCoef;

    let grandTotalMeta = 0;
    let grandTotalOriginal = 0;

    const hierarchyData = rawData.map((item) => {
      // Aplica o coeficiente em cada componente para gerar a Meta
      const metaMO = item.valorMaoDeObra * validCoef;
      const metaMat = item.valorMateriais * validCoef;
      const metaEquip = item.valorEquipamentos * validCoef;
      const metaVerb = item.valorVerbas * validCoef;
      const precoTotalMeta = item.precoTotal * validCoef;

      if (item.nivel === 2) {
        grandTotalMeta += precoTotalMeta;
        grandTotalOriginal += item.precoTotal;
      }

      return {
        ...item,
        metaMO,
        metaMat,
        metaEquip,
        metaVerb,
        precoTotalMeta,
      };
    });

    const finalData = hierarchyData.map((item) => ({
      ...item,
      porcentagem: grandTotalMeta > 0 && item.nivel === 2 ? (item.precoTotalMeta / grandTotalMeta) * 100 : 0,
    }));

    return { items: finalData, grandTotalMeta, grandTotalOriginal };
  }, [rawData, coef1, coef2, selectedCoef]);

  const handleSave = async () => {
    if (!obraId) {
      toast({ title: "Erro", description: "Nenhuma obra selecionada.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const itemsToSave = processedData.items.map((item, index) => ({
        obra_id: obraId,
        codigo: item.codigo,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade_orcada: item.qtd,
        // Salvando os 4 novos valores
        valor_mao_de_obra: item.valorMaoDeObra,
        valor_materiais: item.valorMateriais,
        valor_equipamentos: item.valorEquipamentos,
        valor_verbas: item.valorVerbas,
        preco_total: item.precoTotal,
        is_etapa: item.nivel !== 2,
        nivel: item.nivel,
        ordem: index,
      }));

      const configToSave = {
        obra_id: obraId,
        coeficiente_1: parseFloat(coef1),
        coeficiente_2: parseFloat(coef2),
        coeficiente_selecionado: selectedCoef as "1" | "2",
      };

      await playbookService.savePlaybook(obraId, configToSave, itemsToSave);

      toast({
        title: "Playbook Salvo!",
        description: `Orçamento importado com sucesso.`,
        className: "bg-green-50 border-green-200",
      });

      if (onSave) onSave();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Verifique se a tabela do banco foi atualizada.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 shadow-sm transition-all">
          <FileSpreadsheet className="h-4 w-4" />
          Importar Orçamento
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50/50">
        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center">
          <div>
            <DialogTitle className="text-xl font-heading text-slate-800">Importação Inteligente</DialogTitle>
            <DialogDescription>
              {step === 1 ? "Prepare seu arquivo e defina a hierarquia." : "Revise os custos desagregados."}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-8 rounded-full", step === 1 ? "bg-primary" : "bg-primary/30")} />
              <div className={cn("h-2 w-8 rounded-full", step === 2 ? "bg-primary" : "bg-slate-200")} />
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
            {rawData.length === 0 ? (
              <div className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto w-full">
                <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                  <Info className="h-5 w-5 text-amber-600" />
                  <div className="ml-2">
                    <AlertTitle className="text-amber-800 font-bold mb-1">Modelo de Importação</AlertTitle>
                    <AlertDescription className="text-sm text-amber-700 space-y-1">
                      <p>1. Baixe o modelo abaixo.</p>
                      <p>
                        2. Preencha as colunas: <strong>Mão de Obra, Materiais, Equipamentos e Verbas</strong>.
                      </p>
                      <p>3. Mantenha a coluna "Código" para auxiliar na ordenação.</p>
                    </AlertDescription>
                  </div>
                </Alert>

                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-colors p-8 shadow-sm">
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-4 w-full h-full justify-center"
                  >
                    <div className="bg-blue-50 p-4 rounded-full shadow-sm">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="text-lg font-medium text-slate-700">Selecione o arquivo .xlsx</span>
                      <p className="text-sm text-slate-400">Modelo "TESTE ANTONIO" compatível</p>
                    </div>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" /> Baixar Modelo Padrão
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full gap-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-800 text-xs flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Verifique a hierarquia. O sistema tentou detectar Etapas baseado na Quantidade Vazia.</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-slate-800">PRINCIPAL (0)</Badge>
                    <Badge className="bg-blue-100 text-blue-800">SUBETAPA (1)</Badge>
                    <Badge variant="outline" className="bg-white text-slate-500">
                      ITEM (2)
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 border rounded-lg bg-white overflow-hidden flex flex-col">
                  <div className="overflow-auto flex-1">
                    <Table>
                      <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="w-[100px] text-center">Nível</TableHead>
                          <TableHead className="w-[100px]">Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="w-[150px] text-right">Preço Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rawData.map((row, idx) => (
                          <TableRow
                            key={idx}
                            className={cn(
                              "cursor-pointer transition-all select-none",
                              row.nivel === 0
                                ? "bg-slate-100 font-bold border-l-4 border-l-primary"
                                : row.nivel === 1
                                  ? "bg-blue-50/50 text-blue-900 border-l-4 border-l-blue-400"
                                  : "hover:bg-slate-50 text-slate-600 pl-4",
                            )}
                            onClick={() => cycleLevel(idx)}
                          >
                            <TableCell className="text-center py-2">
                              {row.nivel === 0 && (
                                <Badge className="w-full justify-center bg-slate-800">PRINCIPAL</Badge>
                              )}
                              {row.nivel === 1 && (
                                <Badge variant="secondary" className="w-full justify-center bg-blue-100 text-blue-800">
                                  SUB
                                </Badge>
                              )}
                              {row.nivel === 2 && (
                                <Badge variant="outline" className="w-full justify-center border-dashed text-slate-400">
                                  ITEM
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-slate-500">{row.codigo}</TableCell>
                            <TableCell className="py-2">
                              <div
                                className={cn(
                                  "flex items-center gap-2",
                                  row.nivel === 1 && "pl-4",
                                  row.nivel === 2 && "pl-8",
                                )}
                              >
                                {row.nivel === 0 && <LayoutList className="h-4 w-4" />}
                                {row.nivel === 1 && <ListTree className="h-4 w-4 opacity-50" />}
                                {row.nivel === 2 && <Minus className="h-3 w-3 opacity-30" />}
                                {row.descricao}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs py-2">
                              {formatCurrency(row.precoTotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-end shadow-sm z-10">
              <div className="space-y-1.5">
                <Label>Coeficiente 1</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={coef1}
                  onChange={(e) => setCoef1(e.target.value)}
                  className="bg-white h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Coeficiente 2</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={coef2}
                  onChange={(e) => setCoef2(e.target.value)}
                  className="bg-white h-9"
                />
              </div>
              <div className="space-y-2">
                <Label>Coeficiente Ativo</Label>
                <RadioGroup
                  value={selectedCoef}
                  onValueChange={(v: "1" | "2") => setSelectedCoef(v)}
                  className="flex gap-2"
                >
                  <div
                    className={cn(
                      "flex-1 flex items-center justify-center px-3 py-2 rounded-md border cursor-pointer text-sm font-bold",
                      selectedCoef === "1" ? "bg-primary text-white" : "bg-white",
                    )}
                  >
                    <RadioGroupItem value="1" id="c1" className="sr-only" />
                    <Label htmlFor="c1" className="cursor-pointer w-full text-center">
                      Opção 1
                    </Label>
                  </div>
                  <div
                    className={cn(
                      "flex-1 flex items-center justify-center px-3 py-2 rounded-md border cursor-pointer text-sm font-bold",
                      selectedCoef === "2" ? "bg-primary text-white" : "bg-white",
                    )}
                  >
                    <RadioGroupItem value="2" id="c2" className="sr-only" />
                    <Label htmlFor="c2" className="cursor-pointer w-full text-center">
                      Opção 2
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50/30 p-6">
              <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                      <TableRow>
                        <TableHead className="w-[30%] pl-6">Descrição</TableHead>
                        <TableHead className="text-right w-[10%]">Mão de Obra</TableHead>
                        <TableHead className="text-right w-[10%]">Materiais</TableHead>
                        <TableHead className="text-right w-[10%]">Equip.</TableHead>
                        <TableHead className="text-right w-[10%]">Verbas</TableHead>
                        <TableHead className="text-right w-[15%] bg-blue-50/50">Total Meta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.items.map((item, idx) => (
                        <TableRow
                          key={idx}
                          className={cn(
                            item.nivel === 0 ? "bg-slate-100 font-bold" : item.nivel === 1 ? "bg-blue-50/20" : "",
                          )}
                        >
                          <TableCell className="py-2 pl-4">
                            <div
                              className={cn(
                                "flex flex-col",
                                item.nivel === 0
                                  ? "uppercase font-black"
                                  : item.nivel === 1
                                    ? "pl-4 font-bold text-blue-900"
                                    : "pl-8 text-slate-600 capitalize",
                              )}
                            >
                              <span>{item.descricao.toLowerCase()}</span>
                              {item.codigo && (
                                <span className="text-[10px] text-slate-400 font-mono">{item.codigo}</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right text-xs">
                            {item.nivel === 2 && item.valorMaoDeObra > 0 && (
                              <div className="text-blue-600 font-medium">{formatCurrency(item.metaMO)}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {item.nivel === 2 && item.valorMateriais > 0 && (
                              <div className="text-orange-600 font-medium">{formatCurrency(item.metaMat)}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {item.nivel === 2 && item.valorEquipamentos > 0 && (
                              <div className="text-yellow-600 font-medium">{formatCurrency(item.metaEquip)}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {item.nivel === 2 && item.valorVerbas > 0 && (
                              <div className="text-emerald-600 font-medium">{formatCurrency(item.metaVerb)}</div>
                            )}
                          </TableCell>

                          <TableCell className="text-right text-xs font-mono font-bold text-blue-800 bg-blue-50/30">
                            {formatCurrency(item.precoTotalMeta)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-slate-800 text-white sticky bottom-0 z-20">
                      <TableRow>
                        <TableCell colSpan={5} className="pl-6 font-bold">
                          Total Geral (Soma Itens)
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono text-yellow-400">
                          {formatCurrency(processedData.grandTotalMeta)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
          {step === 2 ? (
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
          ) : (
            <span />
          )}
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={rawData.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Próximo
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
