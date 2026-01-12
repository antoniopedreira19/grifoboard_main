import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Obra } from "@/types/supabase";
import { MapPin, User } from "lucide-react";

interface ObraCardProps {
  obra: Obra & { responsavel_nome?: string };
  onSelect: (obra: Obra) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onEdit?: (obra: Obra, e: React.MouseEvent) => void;
}

const ObraCard = ({ obra, onSelect, onDelete, onEdit }: ObraCardProps) => {
  // Função auxiliar para formatar a data corretamente
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    // Usa 'UTC' como timeZone para evitar que o fuso horário local altere o dia
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100 bg-white h-full flex flex-col"
      onClick={() => onSelect(obra)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1" style={{ overflow: "hidden", whiteSpace: "normal", wordWrap: "break-word" }}>
            <CardTitle
              className="text-gray-900"
              style={{ overflow: "hidden", whiteSpace: "normal", wordWrap: "break-word" }}
            >
              {obra.nome_obra}
            </CardTitle>
            <CardDescription className="text-gray-500 flex items-center mt-1">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
              <span style={{ overflow: "hidden", whiteSpace: "normal", wordWrap: "break-word" }}>
                {obra.localizacao}
              </span>
            </CardDescription>
          </div>
          <div className="flex space-x-2 flex-shrink-0 ml-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(obra, e);
                }}
              >
                Editar
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(obra.id, e);
              }}
            >
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-1">
        <div className="text-sm text-gray-700 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Início:</span>
            <span>{formatDate(obra.data_inicio)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status:</span>
            <span className="capitalize">
              {obra.status === "em_andamento"
                ? "Em andamento"
                : obra.status === "concluida"
                  ? "Concluída"
                  : obra.status === "nao_iniciada"
                    ? "Não iniciada"
                    : obra.status}
            </span>
          </div>
          {obra.responsavel_nome && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1">
                <User className="h-3 w-3" />
                Responsável:
              </span>
              <span className="truncate max-w-[120px]" title={obra.responsavel_nome}>
                {obra.responsavel_nome}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          variant="outline"
          className="w-full text-gray-700 border-gray-200 hover:bg-gray-50"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(obra);
          }}
        >
          Selecionar Obra
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ObraCard;
