import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obrasService } from "@/services/obraService";
import { masterAdminService } from "@/services/masterAdminService";
import { Obra } from "@/types/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRegistry } from "@/context/RegistryContext";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import ObrasList from "@/components/obra/ObrasList";
import ObraForm from "@/components/obra/ObraForm";
import ObraEditForm from "@/components/obra/ObraEditForm";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ObrasPageProps {
  onObraSelect: (obra: Obra) => void;
}

const Obras = ({ onObraSelect }: ObrasPageProps) => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedObraForEdit, setSelectedObraForEdit] = useState<Obra | null>(null);
  const { userSession, setObraAtiva } = useAuth();
  const { setSelectedObraId } = useRegistry();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    const checkMasterAdmin = async () => {
      if (userSession?.user && !redirectAttempted) {
        try {
          const isMasterAdmin = await masterAdminService.isMasterAdmin();
          if (isMasterAdmin) {
            navigate("/master-admin", { replace: true });
            setRedirectAttempted(true);
          }
        } catch (error) {
          console.error("Error checking master admin status:", error);
        }
      }
    };
    checkMasterAdmin();
  }, [userSession?.user, navigate, redirectAttempted]);

  useEffect(() => {
    if (!userSession?.user && !redirectAttempted) {
      navigate("/auth");
      setRedirectAttempted(true);
    }
  }, [userSession, navigate, redirectAttempted]);

  // CORREÇÃO: Removemos o redirecionamento automático para o dashboard.
  // Isso permite que o usuário veja a lista de obras mesmo se já tiver uma ativa.
  /*
  useEffect(() => {
    if (userSession?.user && userSession.obraAtiva && !redirectAttempted) {
      navigate('/dashboard');
      setRedirectAttempted(true);
    }
  }, [userSession, navigate, redirectAttempted]);
  */

  const fetchObras = async () => {
    try {
      const obrasData = await obrasService.listarObras();
      setObras(obrasData);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar obras",
        description: error.message || "Ocorreu um erro ao buscar as obras.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userSession?.user) {
      fetchObras();
    }
  }, [userSession?.user, toast]);

  const handleSelectObra = async (obra: Obra) => {
    try {
      setObraAtiva(obra);
      setSelectedObraId(obra.id);
      onObraSelect(obra);
      navigate("/playbook");
    } catch (error: any) {
      toast({
        title: "Erro ao selecionar obra",
        description: error.message || "Ocorreu um erro ao selecionar a obra.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteObra = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await obrasService.excluirObra(id);
      setObras((prevObras) => prevObras.filter((obra) => obra.id !== id));
      if (userSession?.obraAtiva?.id === id) {
        setObraAtiva(null);
        setSelectedObraId(null);
      }
      toast({
        title: "Obra excluída",
        description: "A obra foi excluída com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir obra",
        description: error.message || "Ocorreu um erro ao excluir a obra.",
        variant: "destructive",
      });
    }
  };

  const handleEditObra = (obra: Obra, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedObraForEdit(obra);
    setIsEditFormOpen(true);
  };

  const handleObraCriada = async () => {
    await fetchObras();
  };

  const handleObraAtualizada = async () => {
    await fetchObras();
    if (selectedObraForEdit && userSession?.obraAtiva?.id === selectedObraForEdit.id) {
      const updatedObra = obras.find((o) => o.id === selectedObraForEdit.id);
      if (updatedObra) setObraAtiva(updatedObra);
    }
  };

  if (!userSession?.user) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header da Página */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold text-grifo-primary flex items-center gap-3">
            <Building2 className="h-8 w-8 text-grifo-secondary" />
            Minhas Obras
          </h1>
          <p className="text-grifo-primary/60 max-w-lg">
            Gerencie seus projetos, acompanhe o progresso e acesse os detalhes de cada canteiro.
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-grifo-secondary hover:bg-grifo-secondary/90 text-white shadow-lg shadow-grifo-secondary/20 transition-all hover:-translate-y-0.5"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" /> Nova Obra
        </Button>
      </motion.div>

      {/* Lista de Obras */}
      <ObrasList
        obras={obras}
        isLoading={isLoading}
        onSelectObra={handleSelectObra}
        onDeleteObra={handleDeleteObra}
        onEditObra={handleEditObra}
      />

      {/* Modais */}
      <ObraForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onObraCriada={handleObraCriada} />

      <ObraEditForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setSelectedObraForEdit(null);
        }}
        onObraAtualizada={handleObraAtualizada}
        obra={selectedObraForEdit}
      />
    </div>
  );
};

export default Obras;
