import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ClipboardList, Database, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainHeaderProps {
  onNewTaskClick: () => void;
  onRegistryClick: () => void;
  onChecklistClick: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({ onNewTaskClick, onRegistryClick, onChecklistClick }) => {
  const { session } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="mb-6 md:mb-8 flex flex-col gap-4">
      {/* Título e descrição */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "#021C2F" }}>
          {session.obraAtiva ? `Tarefas - ${session.obraAtiva.nome_obra}` : "Planejamento Semanal"}
        </h2>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">Gerencie e acompanhe o progresso das atividades da obra.</p>
      </div>

      {/* Botões de ação - layout otimizado para mobile */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="border-gray-200 hover:bg-gray-50 hover:text-primary transition-colors shadow-sm flex-1 md:flex-none"
          style={{ color: "#021C2F" }}
          onClick={onRegistryClick}
        >
          <Database className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Cadastros</span>
        </Button>

        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="border-gray-200 hover:bg-gray-50 hover:text-primary transition-colors shadow-sm flex-1 md:flex-none"
          style={{ color: "#021C2F" }}
          onClick={onChecklistClick}
        >
          <ClipboardList className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Checklist</span>
        </Button>

        <Button 
          onClick={onNewTaskClick} 
          size={isMobile ? "sm" : "default"}
          className="shadow-md hover:shadow-lg transition-all flex-1 md:flex-none"
        >
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </Button>
      </div>
    </div>
  );
};

export default MainHeader;
