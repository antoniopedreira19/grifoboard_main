import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlaybookFarolItem } from "@/types/playbook";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";

const formSchema = z
  .object({
    etapa: z.string().min(1, "Etapa é obrigatória"),
    proposta: z.string().min(1, "Código/Proposta é obrigatório"),
    responsavel: z.string().min(1, "Responsável é obrigatório"),
    quantidade: z.string().min(1, "Quantidade é obrigatória"),
    unidade: z.string().min(1, "Unidade é obrigatória"),

    // Novos campos de composição de custo
    valor_mao_de_obra: z.string().default("0"),
    valor_materiais: z.string().default("0"),
    valor_equipamentos: z.string().default("0"),
    valor_verbas: z.string().default("0"),

    valor_contratado: z.string().optional(),
    status: z.enum(["Negociadas", "Em Andamento", "A Negociar"]),
    observacao: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "Negociadas" && !data.valor_contratado) {
        return false;
      }
      return true;
    },
    {
      message: "Valor Contratado é obrigatório quando o status for Negociadas",
      path: ["valor_contratado"],
    },
  );

interface PlaybookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  obraId: string;
  table: "fornecimentos" | "obra"; // Nota: Idealmente migrar para usar apenas 'playbook_items' no futuro
  editingItem: PlaybookFarolItem | null;
}

export default function PlaybookForm({ isOpen, onClose, onSuccess, obraId, table, editingItem }: PlaybookFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      etapa: "",
      proposta: "",
      responsavel: "",
      quantidade: "",
      unidade: "",
      valor_mao_de_obra: "0",
      valor_materiais: "0",
      valor_equipamentos: "0",
      valor_verbas: "0",
      valor_contratado: "",
      status: "A Negociar",
      observacao: "",
    },
  });

  // Calcula o total em tempo real para feedback visual
  const watchValues = form.watch(["valor_mao_de_obra", "valor_materiais", "valor_equipamentos", "valor_verbas"]);
  const totalCalculado = watchValues.reduce((acc, val) => acc + (parseFloat(val || "0") || 0), 0);

  useEffect(() => {
    if (editingItem) {
      // Cast seguro assumindo que o editingItem já vem com os campos do banco (após o alter table)
      const item = editingItem as any;

      form.reset({
        etapa: item.etapa || item.descricao || "",
        proposta: item.proposta || item.codigo || "",
        responsavel: item.responsavel || "",
        quantidade: String(item.quantidade || item.quantidade_orcada || 0),
        unidade: item.unidade || "",

        // Mapeando os novos campos (com fallback para 0)
        valor_mao_de_obra: String(item.valor_mao_de_obra || 0),
        valor_materiais: String(item.valor_materiais || 0),
        valor_equipamentos: String(item.valor_equipamentos || 0),
        valor_verbas: String(item.valor_verbas || 0),

        valor_contratado: item.valor_contratado ? String(item.valor_contratado) : "",
        status: item.status || "A Negociar",
        observacao: item.observacao || "",
      });
    } else {
      form.reset({
        etapa: "",
        proposta: "",
        responsavel: "",
        quantidade: "",
        unidade: "",
        valor_mao_de_obra: "0",
        valor_materiais: "0",
        valor_equipamentos: "0",
        valor_verbas: "0",
        valor_contratado: "",
        status: "A Negociar",
        observacao: "",
      });
    }
  }, [editingItem, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Determina a tabela correta (compatibilidade com estrutura antiga ou nova)
      // Se você migrou tudo para playbook_items, pode forçar 'playbook_items' aqui
      // Por enquanto mantendo a lógica de props, mas enviando os campos novos
      const tableName = "playbook_items"; // Forçando a tabela nova conforme sua instrução de "alter table playbook_items"

      const vMO = parseFloat(values.valor_mao_de_obra || "0");
      const vMat = parseFloat(values.valor_materiais || "0");
      const vEq = parseFloat(values.valor_equipamentos || "0");
      const vVb = parseFloat(values.valor_verbas || "0");
      const precoTotal = vMO + vMat + vEq + vVb;

      const data = {
        obra_id: obraId,
        descricao: values.etapa, // Mapeando etapa -> descricao para compatibilidade
        codigo: values.proposta, // Mapeando proposta -> codigo
        responsavel: values.responsavel,
        quantidade_orcada: parseFloat(values.quantidade), // Mapeando para o nome correto da coluna
        unidade: values.unidade,

        // Novos campos
        valor_mao_de_obra: vMO,
        valor_materiais: vMat,
        valor_equipamentos: vEq,
        valor_verbas: vVb,
        preco_total: precoTotal, // Total calculado

        valor_contratado: values.valor_contratado ? parseFloat(values.valor_contratado) : null,
        status: values.status, // Campo legado ou se existir na tabela nova
        // observacao: values.observacao || null, // Se existir na tabela nova
      };

      // Nota: Ajuste os nomes das colunas acima se sua tabela `playbook_items` usar nomes diferentes (ex: `etapa` vs `descricao`)

      if (editingItem) {
        const { error } = await supabase.from(tableName).update(data).eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Item atualizado com sucesso",
        });
      } else {
        const { error } = await supabase.from(tableName).insert([data]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Item adicionado com sucesso",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Verifique se as colunas existem no banco.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-800">
            {editingItem ? "Editar Item" : "Novo Item do Orçamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Bloco de Identificação */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Identificação</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="proposta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código / Item</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 01.002" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="etapa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Alvenaria Estrutural" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: m²" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bloco de Custos (Novo) */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Composição de Custos (R$)
                </h3>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-bold text-sm">
                  <Calculator className="w-4 h-4" />
                  Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalCalculado)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor_mao_de_obra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-600">Mão de Obra</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className="bg-blue-50/30 border-blue-100 focus:border-blue-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_materiais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-orange-600">Materiais</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className="bg-orange-50/30 border-orange-100 focus:border-orange-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_equipamentos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-yellow-600">Equipamentos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className="bg-yellow-50/30 border-yellow-100 focus:border-yellow-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_verbas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-600">Verbas / Taxas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className="bg-emerald-50/30 border-emerald-100 focus:border-emerald-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bloco de Status e Contratação */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Status da Contratação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Negociadas">Negociadas (Fechado)</SelectItem>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="A Negociar">A Negociar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("status") === "Negociadas" && (
                  <FormField
                    control={form.control}
                    name="valor_contratado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Final Contratado (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="border-green-300 bg-green-50/30" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="Detalhes adicionais..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="w-24">
                Cancelar
              </Button>
              <Button type="submit" className="w-32 bg-blue-600 hover:bg-blue-700">
                {editingItem ? "Salvar" : "Criar Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
