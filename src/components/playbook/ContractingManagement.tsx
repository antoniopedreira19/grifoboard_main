import { PlaybookTable } from "@/components/playbook/PlaybookTable";
import { PlaybookItem } from "@/types/playbook";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ContractingManagementProps {
  data?: PlaybookItem[];
  grandTotalOriginal?: number;
  grandTotalMeta?: number;
  onUpdate?: () => void;
}

export function ContractingManagement({
  data = [],
  grandTotalOriginal = 0,
  grandTotalMeta = 0,
  onUpdate = () => {},
}: ContractingManagementProps) {
  if (data.length === 0) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Orçamento Vazio</AlertTitle>
        <AlertDescription className="text-blue-600">
          Importe uma planilha para começar a gestão de contratação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Contratação</h2>
          <p className="text-slate-600">Defina o destino e visualize os valores de contratação por etapa.</p>
        </div>
      </div>

      <PlaybookTable
        data={data}
        grandTotalOriginal={grandTotalOriginal}
        grandTotalMeta={grandTotalMeta}
        onUpdate={onUpdate}
        // Passar readOnly={false} para permitir edição de destinos,
        // mas sem onEdit para evitar edição de texto/estrutura se não for desejado aqui.
        // O PlaybookTable habilita selects de destino mesmo sem onEdit.
        readOnly={false}
      />
    </div>
  );
}
