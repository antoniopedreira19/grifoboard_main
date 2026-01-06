import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const SuccessModal = ({ 
  open, 
  onClose, 
  title = "Formulário enviado com sucesso!",
  message = "Obrigado por se cadastrar. Entraremos em contato em breve."
}: SuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <CheckCircle2 className="h-16 w-16 text-green-500 opacity-75" />
            </div>
            <CheckCircle2 className="h-16 w-16 text-green-500 relative z-10" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {message}
            </p>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full mt-4"
            size="lg"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};