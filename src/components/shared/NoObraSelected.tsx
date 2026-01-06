import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoObraSelectedProps {
  title?: string;
  description?: string;
}

export const NoObraSelected = ({
  title = "Nenhuma obra selecionada",
  description = "Selecione uma obra para continuar.",
}: NoObraSelectedProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
        <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
          <Building2 className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-600">{description}</p>
        <Button
          onClick={() => navigate("/obras")}
          className="px-6 py-3 bg-[#C7A347] text-white rounded-xl font-semibold hover:bg-[#B7943F] transition-colors"
        >
          Selecionar Obra
        </Button>
      </div>
    </div>
  );
};
