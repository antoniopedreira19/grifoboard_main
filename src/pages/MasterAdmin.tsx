import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { masterAdminService, EmpresaStats } from '@/services/masterAdminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, Users, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const MasterAdmin = () => {
  const { userSession, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<EmpresaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading && !userSession?.user) {
        navigate('/auth');
        return;
      }

      if (!isLoading && userSession?.user) {
        try {
          const isAdmin = await masterAdminService.isMasterAdmin();
          setIsMasterAdmin(isAdmin);
          
          if (!isAdmin) {
            toast({
              title: 'Acesso negado',
              description: 'Você não tem permissão para acessar esta área.',
              variant: 'destructive',
            });
            navigate('/');
            return;
          }

          // Load empresas stats
          const stats = await masterAdminService.getEmpresasStats();
          setEmpresas(stats);
        } catch (error) {
          console.error('Error loading master admin data:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao carregar dados das empresas.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      }
    };

    checkAccess();
  }, [isLoading, userSession, navigate, toast]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (isLoading || loading || !isMasterAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Master Admin</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento de empresas do Grifoboard
          </p>
        </div>
        <Badge variant="secondary" className="h-8">
          <Building2 className="w-4 h-4 mr-2" />
          {empresas.length} {empresas.length === 1 ? 'Empresa' : 'Empresas'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empresas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empresas.reduce((sum, emp) => sum + emp.total_obras, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empresas.reduce((sum, emp) => sum + emp.total_usuarios, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empresas.filter(emp => emp.ultimo_login).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Empresa</TableHead>
                <TableHead className="text-center">Usuários</TableHead>
                <TableHead className="text-center">Obras</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Data de Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-medium">{empresa.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{empresa.total_usuarios}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{empresa.total_obras}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(empresa.ultimo_login)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(empresa.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterAdmin;
