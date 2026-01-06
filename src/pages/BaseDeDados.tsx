import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Trash2, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormSubmissionModal } from '@/components/FormSubmissionModal';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormSubmission {
  id: string;
  tipo: 'profissionais' | 'empresas' | 'fornecedores';
  nome: string;
  created_at: string;
  data: any;
  selo_grifo: boolean;
}

const BaseDeDados = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [regiaoFiltro, setRegiaoFiltro] = useState<string>('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [tipoAtuacaoFiltro, setTipoAtuacaoFiltro] = useState<string>('todos');
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState<string>('todas');
  const [funcaoPrincipalFiltro, setFuncaoPrincipalFiltro] = useState<string>('todas');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FormSubmission | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, tipoFiltro, dataInicio, dataFim, regiaoFiltro, categoriaFiltro, tipoAtuacaoFiltro, especialidadeFiltro, funcaoPrincipalFiltro]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const allSubmissions: FormSubmission[] = [];

      // Load Profissionais
      const { data: profissionais, error: errorProf } = await supabase
        .from('formulario_profissionais')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errorProf && profissionais) {
        profissionais.forEach((item: any) => {
          allSubmissions.push({
            id: item.id,
            tipo: 'profissionais',
            nome: item.nome_completo,
            created_at: item.created_at || '',
            data: item,
            selo_grifo: item.selo_grifo || false,
          });
        });
      }

      // Load Empresas
      const { data: empresas, error: errorEmp } = await supabase
        .from('formulario_empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errorEmp && empresas) {
        empresas.forEach((item: any) => {
          allSubmissions.push({
            id: item.id,
            tipo: 'empresas',
            nome: item.nome_empresa,
            created_at: item.created_at || '',
            data: item,
            selo_grifo: item.selo_grifo || false,
          });
        });
      }

      // Load Fornecedores
      const { data: fornecedores, error: errorForn } = await supabase
        .from('formulario_fornecedores')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errorForn && fornecedores) {
        fornecedores.forEach((item: any) => {
          allSubmissions.push({
            id: item.id,
            tipo: 'fornecedores',
            nome: item.nome_empresa,
            created_at: item.created_at || '',
            data: item,
            selo_grifo: item.selo_grifo || false,
          });
        });
      }

      // Sort all by date
      allSubmissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar cadastros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Filter by type
    if (tipoFiltro !== 'todos') {
      filtered = filtered.filter((s) => s.tipo === tipoFiltro);
    }

    // Filter by date range
    if (dataInicio) {
      filtered = filtered.filter((s) => new Date(s.created_at) >= dataInicio);
    }
    if (dataFim) {
      const endOfDay = new Date(dataFim);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter((s) => new Date(s.created_at) <= endOfDay);
    }

    // Filter by região
    if (regiaoFiltro !== 'todas') {
      filtered = filtered.filter((s) => {
        if (s.tipo === 'profissionais') {
          return s.data.regioes_atendidas?.includes(regiaoFiltro);
        } else if (s.tipo === 'fornecedores') {
          return s.data.regioes_atendidas?.includes(regiaoFiltro);
        }
        return true;
      });
    }

    // Filter by categoria (fornecedores only)
    if (categoriaFiltro !== 'todas' && tipoFiltro === 'fornecedores') {
      filtered = filtered.filter((s) => {
        return s.data.categorias_atendidas?.includes(categoriaFiltro);
      });
    }

    // Filter by tipo de atuação (fornecedores only)
    if (tipoAtuacaoFiltro !== 'todos' && tipoFiltro === 'fornecedores') {
      filtered = filtered.filter((s) => {
        return s.data.tipos_atuacao?.includes(tipoAtuacaoFiltro);
      });
    }

    // Filter by especialidade (profissionais only)
    if (especialidadeFiltro !== 'todas' && tipoFiltro === 'profissionais') {
      filtered = filtered.filter((s) => {
        return s.data.especialidades?.includes(especialidadeFiltro);
      });
    }

    // Filter by função principal (profissionais only)
    if (funcaoPrincipalFiltro !== 'todas' && tipoFiltro === 'profissionais') {
      filtered = filtered.filter((s) => {
        return s.data.funcao_principal === funcaoPrincipalFiltro;
      });
    }

    setFilteredSubmissions(filtered);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from(`formulario_${itemToDelete.tipo}` as any)
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cadastro excluído com sucesso.',
      });

      // Reload submissions
      loadSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir cadastro.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleToggleSelo = async (submission: FormSubmission, newValue: boolean) => {
    try {
      const tableName = `formulario_${submission.tipo}` as 'formulario_profissionais' | 'formulario_empresas' | 'formulario_fornecedores';
      
      const { error } = await supabase
        .from(tableName)
        .update({ selo_grifo: newValue })
        .eq('id', submission.id);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => prev.map(s => 
        s.id === submission.id ? { ...s, selo_grifo: newValue } : s
      ));

      toast({
        title: newValue ? 'Selo Grifo ativado' : 'Selo Grifo removido',
        description: `${submission.nome} ${newValue ? 'agora possui' : 'não possui mais'} o Selo Grifo.`,
      });
    } catch (error) {
      console.error('Error toggling selo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar selo.',
        variant: 'destructive',
      });
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'profissionais':
        return 'default';
      case 'empresas':
        return 'secondary';
      case 'fornecedores':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'profissionais':
        return 'Profissional';
      case 'empresas':
        return 'Empresa';
      case 'fornecedores':
        return 'Fornecedor';
      default:
        return tipo;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Base de Dados</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os cadastros recebidos
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="profissionais">Profissionais</SelectItem>
                  <SelectItem value="empresas">Empresas</SelectItem>
                  <SelectItem value="fornecedores">Fornecedores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataInicio && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataFim && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(tipoFiltro === 'profissionais' || tipoFiltro === 'fornecedores') && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Região de Atuação</label>
                <Select value={regiaoFiltro} onValueChange={setRegiaoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Norte">Norte</SelectItem>
                    <SelectItem value="Nordeste">Nordeste</SelectItem>
                    <SelectItem value="Centro-Oeste">Centro-Oeste</SelectItem>
                    <SelectItem value="Sudeste">Sudeste</SelectItem>
                    <SelectItem value="Sul">Sul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {tipoFiltro === 'fornecedores' && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Categoria Atendida</label>
                  <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="Estrutura">Estrutura</SelectItem>
                      <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="Impermeabilização">Impermeabilização</SelectItem>
                      <SelectItem value="Acabamentos">Acabamentos</SelectItem>
                      <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                      <SelectItem value="Elétrica">Elétrica</SelectItem>
                      <SelectItem value="Pintura">Pintura</SelectItem>
                      <SelectItem value="Drywall">Drywall</SelectItem>
                      <SelectItem value="Carpintaria">Carpintaria</SelectItem>
                      <SelectItem value="Gesso">Gesso</SelectItem>
                      <SelectItem value="Serralheria">Serralheria</SelectItem>
                      <SelectItem value="Demolição">Demolição</SelectItem>
                      <SelectItem value="Locação de Equipamentos">Locação de Equipamentos</SelectItem>
                      <SelectItem value="Entrega">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Tipo de Atuação</label>
                  <Select value={tipoAtuacaoFiltro} onValueChange={setTipoAtuacaoFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Loja">Loja</SelectItem>
                      <SelectItem value="Distribuidor">Distribuidor</SelectItem>
                      <SelectItem value="Fabricante">Fabricante</SelectItem>
                      <SelectItem value="Prestador de Serviços">Prestador de Serviços</SelectItem>
                      <SelectItem value="Logística">Logística</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {tipoFiltro === 'profissionais' && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Especialidade</label>
                  <Select value={especialidadeFiltro} onValueChange={setEspecialidadeFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="Estrutura">Estrutura</SelectItem>
                      <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="Acabamentos">Acabamentos</SelectItem>
                      <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                      <SelectItem value="Elétrica">Elétrica</SelectItem>
                      <SelectItem value="Drywall">Drywall</SelectItem>
                      <SelectItem value="Pintura">Pintura</SelectItem>
                      <SelectItem value="Revestimentos">Revestimentos</SelectItem>
                      <SelectItem value="Impermeabilização">Impermeabilização</SelectItem>
                      <SelectItem value="Demolição">Demolição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Função Principal</label>
                  <Select value={funcaoPrincipalFiltro} onValueChange={setFuncaoPrincipalFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="Engenheiro">Engenheiro</SelectItem>
                      <SelectItem value="Técnico em Edificações">Técnico em Edificações</SelectItem>
                      <SelectItem value="Mestre de Obras">Mestre de Obras</SelectItem>
                      <SelectItem value="Pedreiro">Pedreiro</SelectItem>
                      <SelectItem value="Carpinteiro">Carpinteiro</SelectItem>
                      <SelectItem value="Eletricista">Eletricista</SelectItem>
                      <SelectItem value="Encanador">Encanador</SelectItem>
                      <SelectItem value="Pintor">Pintor</SelectItem>
                      <SelectItem value="Gesseiro">Gesseiro</SelectItem>
                      <SelectItem value="Ferreiro">Ferreiro</SelectItem>
                      <SelectItem value="Servente">Servente</SelectItem>
                      <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(tipoFiltro !== 'todos' || dataInicio || dataFim || regiaoFiltro !== 'todas' || categoriaFiltro !== 'todas' || tipoAtuacaoFiltro !== 'todos' || especialidadeFiltro !== 'todas' || funcaoPrincipalFiltro !== 'todas') && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setTipoFiltro('todos');
                    setDataInicio(undefined);
                    setDataFim(undefined);
                    setRegiaoFiltro('todas');
                    setCategoriaFiltro('todas');
                    setTipoAtuacaoFiltro('todos');
                    setEspecialidadeFiltro('todas');
                    setFuncaoPrincipalFiltro('todas');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadastros ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cadastro encontrado
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-center">Selo Grifo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Badge variant={getTipoBadgeVariant(submission.tipo)}>
                          {getTipoLabel(submission.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell 
                        className="font-medium"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setIsModalOpen(true);
                        }}
                      >
                        {submission.nome}
                      </TableCell>
                      <TableCell
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setIsModalOpen(true);
                        }}
                      >
                        {format(new Date(submission.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={submission.selo_grifo}
                                onCheckedChange={(checked) => handleToggleSelo(submission, checked)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {submission.selo_grifo && (
                                <Award className="h-4 w-4 text-secondary" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {submission.selo_grifo 
                              ? 'Clique para remover o Selo Grifo' 
                              : 'Clique para adicionar o Selo Grifo'
                            }
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(submission);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {selectedSubmission && (
        <FormSubmissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          submission={selectedSubmission}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cadastro de <strong>{itemToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BaseDeDados;
