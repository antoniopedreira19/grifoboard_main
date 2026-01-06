import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlaybookFarolItem } from '@/types/playbook';

const formSchema = z.object({
  etapa: z.string().min(1, 'Etapa é obrigatória'),
  proposta: z.string().min(1, 'Proposta é obrigatória'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
  quantidade: z.string().min(1, 'Quantidade é obrigatória'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  orcamento_meta_unitario: z.string().min(1, 'Orçamento Meta Unitário é obrigatório'),
  valor_contratado: z.string().optional(),
  status: z.enum(['Negociadas', 'Em Andamento', 'A Negociar']),
  observacao: z.string().optional(),
}).refine((data) => {
  if (data.status === 'Negociadas' && !data.valor_contratado) {
    return false;
  }
  return true;
}, {
  message: 'Valor Contratado é obrigatório quando o status for Negociadas',
  path: ['valor_contratado'],
});

interface PlaybookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  obraId: string;
  table: 'fornecimentos' | 'obra';
  editingItem: PlaybookFarolItem | null;
}

export default function PlaybookForm({
  isOpen,
  onClose,
  onSuccess,
  obraId,
  table,
  editingItem,
}: PlaybookFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      etapa: '',
      proposta: '',
      responsavel: '',
      quantidade: '',
      unidade: '',
      orcamento_meta_unitario: '',
      valor_contratado: '',
      status: 'A Negociar',
      observacao: '',
    },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        etapa: editingItem.etapa,
        proposta: editingItem.proposta,
        responsavel: editingItem.responsavel,
        quantidade: String(editingItem.quantidade),
        unidade: editingItem.unidade,
        orcamento_meta_unitario: String(editingItem.orcamento_meta_unitario),
        valor_contratado: editingItem.valor_contratado ? String(editingItem.valor_contratado) : '',
        status: editingItem.status,
        observacao: editingItem.observacao || '',
      });
    } else {
      form.reset({
        etapa: '',
        proposta: '',
        responsavel: '',
        quantidade: '',
        unidade: '',
        orcamento_meta_unitario: '',
        valor_contratado: '',
        status: 'A Negociar',
        observacao: '',
      });
    }
  }, [editingItem, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const tableName = table === 'fornecimentos' ? 'playbook_fornecimentos' : 'playbook_obra';
      
      const data = {
        obra_id: obraId,
        etapa: values.etapa,
        proposta: values.proposta,
        responsavel: values.responsavel,
        quantidade: parseFloat(values.quantidade),
        unidade: values.unidade,
        orcamento_meta_unitario: parseFloat(values.orcamento_meta_unitario),
        valor_contratado: values.valor_contratado ? parseFloat(values.valor_contratado) : null,
        status: values.status,
        observacao: values.observacao || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Item atualizado com sucesso',
        });
      } else {
        const { error } = await supabase.from(tableName).insert([data]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Item adicionado com sucesso',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Editar Item' : 'Adicionar Item'} - {table === 'fornecimentos' ? 'Fornecimentos' : 'Obra'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="etapa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proposta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposta</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="orcamento_meta_unitario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orçamento Meta Unitário (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Negociadas">Negociadas</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="A Negociar">A Negociar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('status') === 'Negociadas' && (
              <FormField
                control={form.control}
                name="valor_contratado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Contratado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
