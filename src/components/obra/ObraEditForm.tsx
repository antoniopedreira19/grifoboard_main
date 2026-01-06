
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { obrasService } from '@/services/obraService';
import { useToast } from '@/hooks/use-toast';
import { Obra } from '@/types/supabase';

interface ObraEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onObraAtualizada: () => void;
  obra: Obra | null;
}

const ObraEditForm = ({ isOpen, onClose, onObraAtualizada, obra }: ObraEditFormProps) => {
  const [nomeObra, setNomeObra] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [status, setStatus] = useState('em_andamento');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (obra) {
      setNomeObra(obra.nome_obra || '');
      setLocalizacao(obra.localizacao || '');
      setDataInicio(obra.data_inicio ? obra.data_inicio.split('T')[0] : '');
      setDataTermino(obra.data_termino ? obra.data_termino.split('T')[0] : '');
      setStatus(obra.status || 'em_andamento');
    }
  }, [obra]);

  const resetForm = () => {
    setNomeObra('');
    setLocalizacao('');
    setDataInicio('');
    setDataTermino('');
    setStatus('em_andamento');
    setIsSubmitting(false);
  };
  
  const isFormValid = () => {
    return nomeObra.trim() !== '' && localizacao.trim() !== '' && dataInicio !== '';
  };

  const handleUpdateObra = async () => {
    if (!isFormValid() || !obra) return;
    
    setIsSubmitting(true);
    
    try {
      const obraAtualizada = {
        nome_obra: nomeObra,
        localizacao,
        data_inicio: dataInicio,
        data_termino: dataTermino || null,
        status
      };
      
      await obrasService.atualizarObra(obra.id, obraAtualizada);
      
      toast({
        title: "Obra atualizada",
        description: "A obra foi atualizada com sucesso!",
      });
      
      onClose();
      resetForm();
      onObraAtualizada();
    } catch (error: any) {
      console.error("Erro ao atualizar obra:", error);
      
      toast({
        title: "Erro ao atualizar obra",
        description: error.message || "Ocorreu um erro ao atualizar a obra. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent 
        className="sm:max-w-[500px]"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Only allow closing when clicking outside, not on focus loss
          const isClickOutside = e.type === 'pointerdown';
          if (!isClickOutside) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar Obra</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome_obra">Nome da Obra</Label>
            <Input
              id="nome_obra"
              value={nomeObra}
              onChange={(e) => setNomeObra(e.target.value)}
              placeholder="Nome da obra"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização</Label>
            <Input
              id="localizacao"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Localização da obra"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="data_inicio">Data de Início</Label>
            <Input
              id="data_inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="data_termino">Data de Término (Previsão)</Label>
            <Input
              id="data_termino"
              type="date"
              value={dataTermino}
              onChange={(e) => setDataTermino(e.target.value)}
              min={dataInicio}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="nao_iniciada">Não iniciada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateObra} 
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? 'Atualizando...' : 'Atualizar Obra'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ObraEditForm;
