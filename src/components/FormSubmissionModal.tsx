import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Globe,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  User,
  Briefcase as BriefcaseIcon,
  Award,
  Clock,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface FormSubmission {
  id: string;
  tipo: 'profissionais' | 'empresas' | 'fornecedores';
  nome: string;
  created_at: string;
  data: any;
}

interface FormSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: FormSubmission | null;
}

export function FormSubmissionModal({ isOpen, onClose, submission }: FormSubmissionModalProps) {
  const { toast } = useToast();
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Se não há submission, não renderiza o modal
  if (!submission) {
    return null;
  }

  const getTipoIcon = () => {
    switch (submission.tipo) {
      case 'profissionais':
        return <Users className="h-6 w-6" />;
      case 'empresas':
        return <Building2 className="h-6 w-6" />;
      case 'fornecedores':
        return <Briefcase className="h-6 w-6" />;
    }
  };

  const getTipoLabel = () => {
    switch (submission.tipo) {
      case 'profissionais':
        return 'Profissional';
      case 'empresas':
        return 'Empresa';
      case 'fornecedores':
        return 'Fornecedor';
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    setDownloadingFile(filePath);
    try {
      const bucketName = `formularios-${submission.tipo}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download concluído',
        description: 'O arquivo foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Erro ao baixar',
        description: 'Não foi possível baixar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleViewFile = async (filePath: string) => {
    try {
      const bucketName = `formularios-${submission.tipo}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600); // 1 hour

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      toast({
        title: 'Erro ao visualizar',
        description: 'Não foi possível visualizar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground mt-0.5">{value}</p>
        </div>
      </div>
    );
  };

  const FileItem = ({ filePath, label }: { filePath: string | null | undefined; label: string }) => {
    if (!filePath) return null;
    
    const fileName = filePath.split('/').pop() || 'arquivo';
    
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewFile(filePath)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownloadFile(filePath, fileName)}
            disabled={downloadingFile === filePath}
          >
            {downloadingFile === filePath ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderProfissionalDetails = () => {
    const data = submission.data;
    return (
      <div className="space-y-6">
        {/* Informações Básicas */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Básicas
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<User className="h-4 w-4" />} label="Nome Completo" value={data.nome_completo} />
            <InfoItem icon={<FileText className="h-4 w-4" />} label="CPF" value={data.cpf} />
            <InfoItem icon={<Calendar className="h-4 w-4" />} label="Data de Nascimento" value={data.data_nascimento} />
            <InfoItem icon={<MapPin className="h-4 w-4" />} label="Localização" value={`${data.cidade} - ${data.estado}`} />
          </div>
        </div>

        <Separator />

        {/* Área de Atuação */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5" />
            Área de Atuação
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<BriefcaseIcon className="h-4 w-4" />} label="Função Principal" value={data.funcao_principal} />
            {data.funcao_principal_outro && (
              <InfoItem icon={<BriefcaseIcon className="h-4 w-4" />} label="Função (Outro)" value={data.funcao_principal_outro} />
            )}
            {data.especialidades && data.especialidades.length > 0 && (
              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-2">
                  {data.especialidades.map((esp: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{esp}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.especialidades_outro && (
              <InfoItem icon={<Award className="h-4 w-4" />} label="Especialidades (Outro)" value={data.especialidades_outro} />
            )}
          </div>
        </div>

        <Separator />

        {/* Experiência */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Experiência
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<Clock className="h-4 w-4" />} label="Tempo de Experiência" value={data.tempo_experiencia} />
            {data.obras_relevantes && (
              <InfoItem icon={<Award className="h-4 w-4" />} label="Obras Relevantes" value={data.obras_relevantes} />
            )}
          </div>
        </div>

        <Separator />

        {/* Disponibilidade */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Disponibilidade
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<Calendar className="h-4 w-4" />} label="Disponibilidade Atual" value={data.disponibilidade_atual} />
            <InfoItem icon={<BriefcaseIcon className="h-4 w-4" />} label="Modalidade de Trabalho" value={data.modalidade_trabalho} />
            {data.regioes_atendidas && data.regioes_atendidas.length > 0 && (
              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Regiões Atendidas</p>
                <div className="flex flex-wrap gap-2">
                  {data.regioes_atendidas.map((reg: string, idx: number) => (
                    <Badge key={idx} variant="outline">{reg}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.cidades_frequentes && (
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Cidades Frequentes" value={data.cidades_frequentes} />
            )}
          </div>
        </div>

        <Separator />

        {/* Condições */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Condições e Valores
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Pretensão de Valor" value={data.pretensao_valor} />
            <InfoItem icon={<Award className="h-4 w-4" />} label="Equipamentos Próprios" value={data.equipamentos_proprios} />
          </div>
        </div>

        {/* Diferenciais */}
        {data.diferenciais && data.diferenciais.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Diferenciais
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.diferenciais.map((dif: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{dif}</Badge>
                ))}
              </div>
              {data.diferenciais_outro && (
                <div className="mt-3">
                  <InfoItem icon={<Award className="h-4 w-4" />} label="Outro" value={data.diferenciais_outro} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Contato */}
        <Separator />
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contato
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<Phone className="h-4 w-4" />} label="Telefone/WhatsApp" value={data.telefone} />
            <InfoItem icon={<Mail className="h-4 w-4" />} label="E-mail" value={data.email} />
          </div>
        </div>

        {/* Documentos */}
        {(data.curriculo_path || data.fotos_trabalhos_path || data.certificacoes_path) && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </h3>
              <div className="space-y-3">
                <FileItem filePath={data.curriculo_path} label="Currículo" />
                <FileItem filePath={data.fotos_trabalhos_path} label="Fotos de Trabalhos" />
                <FileItem filePath={data.certificacoes_path} label="Certificações/Cursos" />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderEmpresaDetails = () => {
    const data = submission.data;
    return (
      <div className="space-y-6">
        {/* Informações da Empresa */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<Building2 className="h-4 w-4" />} label="Nome da Empresa" value={data.nome_empresa} />
            <InfoItem icon={<FileText className="h-4 w-4" />} label="CNPJ" value={data.cnpj} />
            <InfoItem icon={<Globe className="h-4 w-4" />} label="Website" value={data.site} />
            <InfoItem icon={<MapPin className="h-4 w-4" />} label="Localização" value={`${data.cidade} - ${data.estado}`} />
            <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ano de Fundação" value={data.ano_fundacao} />
            <InfoItem icon={<Users className="h-4 w-4" />} label="Tamanho da Empresa" value={data.tamanho_empresa} />
          </div>
        </div>

        <Separator />

        {/* Contato Principal */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Contato Principal
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<User className="h-4 w-4" />} label="Nome" value={data.nome_contato} />
            <InfoItem icon={<BriefcaseIcon className="h-4 w-4" />} label="Cargo" value={data.cargo_contato} />
            <InfoItem icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={data.whatsapp_contato} />
            <InfoItem icon={<Mail className="h-4 w-4" />} label="E-mail" value={data.email_contato} />
          </div>
        </div>

        <Separator />

        {/* Estrutura Operacional */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5" />
            Estrutura Operacional
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<Award className="h-4 w-4" />} label="Obras em Andamento" value={data.obras_andamento} />
            {data.tipos_obras && data.tipos_obras.length > 0 && (
              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Tipos de Obras</p>
                <div className="flex flex-wrap gap-2">
                  {data.tipos_obras.map((tipo: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{tipo}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.tipos_obras_outro && (
              <InfoItem icon={<Award className="h-4 w-4" />} label="Outros Tipos" value={data.tipos_obras_outro} />
            )}
            <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Ticket Médio" value={data.ticket_medio} />
          </div>
        </div>

        <Separator />

        {/* Processo de Planejamento */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Processo de Planejamento
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<FileText className="h-4 w-4" />} label="Planejamento de Curto Prazo" value={data.planejamento_curto_prazo} />
            <InfoItem icon={<Award className="h-4 w-4" />} label="Ferramentas de Gestão" value={data.ferramentas_gestao} />
          </div>
        </div>

        {/* Desafios */}
        {data.principais_desafios && data.principais_desafios.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Principais Desafios
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.principais_desafios.map((desafio: string, idx: number) => (
                  <Badge key={idx} variant="outline">{desafio}</Badge>
                ))}
              </div>
              {data.desafios_outro && (
                <div className="mt-3">
                  <InfoItem icon={<Award className="h-4 w-4" />} label="Outro" value={data.desafios_outro} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Documentos */}
        {(data.logo_path || data.apresentacao_path) && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </h3>
              <div className="space-y-3">
                <FileItem filePath={data.logo_path} label="Logo da Empresa" />
                <FileItem filePath={data.apresentacao_path} label="Apresentação Institucional" />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderFornecedorDetails = () => {
    const data = submission.data;
    return (
      <div className="space-y-6">
        {/* Informações da Empresa */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<Building2 className="h-4 w-4" />} label="Nome da Empresa" value={data.nome_empresa} />
            <InfoItem icon={<FileText className="h-4 w-4" />} label="CNPJ/CPF" value={data.cnpj_cpf} />
            <InfoItem icon={<Globe className="h-4 w-4" />} label="Website" value={data.site} />
            <InfoItem icon={<MapPin className="h-4 w-4" />} label="Localização" value={`${data.cidade} - ${data.estado}`} />
            <InfoItem icon={<Clock className="h-4 w-4" />} label="Tempo de Atuação" value={data.tempo_atuacao} />
          </div>
        </div>

        <Separator />

        {/* Tipo de Atuação */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5" />
            Tipo de Atuação
          </h3>
          {data.tipos_atuacao && data.tipos_atuacao.length > 0 && (
            <div className="py-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Tipos de Atuação</p>
              <div className="flex flex-wrap gap-2">
                {data.tipos_atuacao.map((tipo: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{tipo}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.tipo_atuacao_outro && (
            <div className="mt-3">
              <InfoItem icon={<Award className="h-4 w-4" />} label="Outro" value={data.tipo_atuacao_outro} />
            </div>
          )}
          {data.categorias_atendidas && data.categorias_atendidas.length > 0 && (
            <div className="py-2 mt-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">Categorias Atendidas</p>
              <div className="flex flex-wrap gap-2">
                {data.categorias_atendidas.map((cat: string, idx: number) => (
                  <Badge key={idx} variant="outline">{cat}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.categorias_outro && (
            <div className="mt-3">
              <InfoItem icon={<Award className="h-4 w-4" />} label="Categoria (Outro)" value={data.categorias_outro} />
            </div>
          )}
        </div>

        <Separator />

        {/* Faixa de Preço e Capacidade */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Faixa de Preço e Capacidade
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Ticket Médio" value={data.ticket_medio} />
            <InfoItem icon={<Award className="h-4 w-4" />} label="Capacidade de Atendimento" value={data.capacidade_atendimento} />
          </div>
        </div>

        <Separator />

        {/* Regiões de Atendimento */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Regiões de Atendimento
          </h3>
          {data.regioes_atendidas && data.regioes_atendidas.length > 0 && (
            <div className="py-2">
              <div className="flex flex-wrap gap-2">
                {data.regioes_atendidas.map((reg: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{reg}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.cidades_frequentes && (
            <div className="mt-3">
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Cidades Frequentes" value={data.cidades_frequentes} />
            </div>
          )}
        </div>

        {/* Diferenciais */}
        {data.diferenciais && data.diferenciais.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Diferenciais
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.diferenciais.map((dif: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{dif}</Badge>
                ))}
              </div>
              {data.diferenciais_outro && (
                <div className="mt-3">
                  <InfoItem icon={<Award className="h-4 w-4" />} label="Outro" value={data.diferenciais_outro} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Contato Comercial */}
        <Separator />
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contato Comercial
          </h3>
          <div className="space-y-2">
            <InfoItem icon={<User className="h-4 w-4" />} label="Nome" value={data.nome_responsavel} />
            <InfoItem icon={<Phone className="h-4 w-4" />} label="Telefone" value={data.telefone} />
            <InfoItem icon={<Mail className="h-4 w-4" />} label="E-mail" value={data.email} />
          </div>
        </div>

        {/* Documentos */}
        {(data.logo_path || data.portfolio_path || data.certificacoes_path) && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos e Portfólio
              </h3>
              <div className="space-y-3">
                <FileItem filePath={data.logo_path} label="Logo/Foto da Empresa" />
                <FileItem filePath={data.portfolio_path} label="Portfólio" />
                <FileItem filePath={data.certificacoes_path} label="Certificações/Alvarás" />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {getTipoIcon()}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{submission.nome}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{getTipoLabel()}</Badge>
                <span className="text-xs">
                  Cadastrado em {format(new Date(submission.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          {submission.tipo === 'profissionais' && renderProfissionalDetails()}
          {submission.tipo === 'empresas' && renderEmpresaDetails()}
          {submission.tipo === 'fornecedores' && renderFornecedorDetails()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
