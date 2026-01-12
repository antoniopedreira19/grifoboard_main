import { Obra } from "@/types/supabase";
import ObraCard from "./ObraCard";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

interface ObrasListProps {
  obras: (Obra & { responsavel_nome?: string })[];
  isLoading: boolean;
  onSelectObra: (obra: Obra) => void;
  onDeleteObra: (id: string, e: React.MouseEvent) => void;
  onEditObra?: (obra: Obra, e: React.MouseEvent) => void;
}

const ObrasList = ({ obras, isLoading, onSelectObra, onDeleteObra, onEditObra }: ObrasListProps) => {
  // Skeleton de carregamento elegante
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-gray-200/50 animate-pulse border border-white/40" />
        ))}
      </div>
    );
  }

  // Estado vazio estilizado
  if (obras.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-4 bg-white/50 border-2 border-dashed border-grifo-tertiary rounded-3xl text-center"
      >
        <div className="w-16 h-16 bg-grifo-tertiary/30 rounded-full flex items-center justify-center mb-4">
          <FolderOpen className="h-8 w-8 text-grifo-primary/50" />
        </div>
        <h3 className="text-xl font-bold text-grifo-primary mb-2">Nenhuma obra encontrada</h3>
        <p className="text-grifo-primary/60 max-w-md">
          Você ainda não tem obras cadastradas. Clique em "Nova Obra" para começar a gerenciar seus projetos.
        </p>
      </motion.div>
    );
  }

  // Grid com animação stagger (um por um)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {obras.map((obra, index) => (
        <motion.div
          key={obra.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="h-full"
        >
          <ObraCard obra={obra} onSelect={onSelectObra} onDelete={onDeleteObra} onEdit={onEditObra} />
        </motion.div>
      ))}
    </div>
  );
};

export default ObrasList;
