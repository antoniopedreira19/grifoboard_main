import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import RegistryForm from "./RegistryForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegistry } from "@/context/RegistryContext"; // Importar o contexto

interface RegistryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegistryDialog = ({ isOpen, onOpenChange }: RegistryDialogProps) => {
  // Consumir o contexto para obter as funções e estados necessários
  const { addRegistry, isSaving } = useRegistry();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-white border-border shadow-2xl overflow-hidden rounded-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const isClickOutside = e.type === "pointerdown";
          if (!isClickOutside) e.preventDefault();
        }}
      >
        {/* Cabeçalho Fixo */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-white flex flex-row items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Database className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-heading font-bold text-primary">Gerenciar Cadastros</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione, edite ou remova itens das listas auxiliares
              </p>
            </div>
          </div>

          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-hidden bg-slate-50/50">
          <ScrollArea className="h-full w-full">
            <div className="p-6">
              {/* CORREÇÃO: Passando as props obrigatórias para o RegistryForm */}
              <RegistryForm onClose={() => onOpenChange(false)} onRegistryCreate={addRegistry} isSaving={isSaving} />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistryDialog;
