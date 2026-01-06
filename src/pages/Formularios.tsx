import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormularioCard {
  id: string;
  titulo: string;
  descricao: string;
  url: string;
}

const formularios: FormularioCard[] = [
  {
    id: 'profissionais',
    titulo: 'Profissionais',
    descricao: 'Formulário de cadastro para profissionais',
    url: `${window.location.origin}/form/profissionais`
  },
  {
    id: 'empresas',
    titulo: 'Empresas',
    descricao: 'Formulário de cadastro para empresas',
    url: `${window.location.origin}/form/empresas`
  },
  {
    id: 'fornecedores',
    titulo: 'Fornecedores',
    descricao: 'Formulário de cadastro para fornecedores',
    url: `${window.location.origin}/form/fornecedores`
  }
];

const Formularios = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Formulários Públicos</h1>
        <p className="text-muted-foreground">
          Compartilhe os links abaixo para receber cadastros de profissionais, empresas e fornecedores
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formularios.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{form.titulo}</CardTitle>
              <CardDescription>{form.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-md break-all text-sm">
                {form.url}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(form.url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => openInNewTab(form.url)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Formularios;
