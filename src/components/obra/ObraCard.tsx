import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Obra } from "@/types/supabase";
import { MapPin, User, Pencil, Trash2 } from "lucide-react";

interface ObraCardProps {
  obra: Obra & { responsavel_nome?: string };
  onSelect: (obra: Obra) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onEdit?: (obra: Obra, e: React.MouseEvent) => void;
}

const ObraCard = ({ obra, onSelect, onDelete, onEdit }: ObraCardProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100 bg-white h-full flex flex-col"
      onClick={() => onSelect(obra)}
    >
      <CardHeader className="p-3 md:pb-2 md:p-6">
        <div className="flex flex-col gap-2">
          <div className="min-w-0">
            <CardTitle className="text-gray-900 text-sm md:text-base break-words">
              {obra.nome_obra}
            </CardTitle>
            <CardDescription className="text-gray-500 flex items-center mt-1 text-xs">
              <MapPin className="mr-1 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
              <span className="break-words">{obra.localizacao}</span>
            </CardDescription>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs md:h-9 md:px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(obra, e);
                }}
              >
                <Pencil className="h-3 w-3 mr-1 md:hidden" />
                <span className="hidden md:inline">Editar</span>
                <span className="md:hidden">Editar</span>
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2 text-xs md:h-9 md:px-3"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(obra.id, e);
              }}
            >
              <Trash2 className="h-3 w-3 mr-1 md:hidden" />
              <span className="hidden md:inline">Excluir</span>
              <span className="md:hidden">Excluir</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0 md:pb-2 flex-1">
        <div className="text-xs md:text-sm text-gray-700 space-y-1">
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
                Resp:
              </span>
              <span className="truncate max-w-[120px]" title={obra.responsavel_nome}>
                {obra.responsavel_nome}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 md:p-6 md:pt-0 mt-auto">
        <Button
          variant="outline"
          className="w-full text-gray-700 border-gray-200 hover:bg-gray-50 h-8 text-xs md:h-10 md:text-sm"
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
