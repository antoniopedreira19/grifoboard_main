import { useState } from "react";
import { AgendaEvent } from "@/types/agenda";
import { agendaService } from "@/services/agendaService";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Users,
  FileText,
  Paperclip,
  Upload,
  CheckCircle2,
  Edit,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventDetailModalProps {
  event: AgendaEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: AgendaEvent) => void;
  onDelete: (eventId: string) => void;
  onUpdate: () => void;
  obraId: string;
}

export function EventDetailModal({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onUpdate,
  obraId,
}: EventDetailModalProps) {
  const { toast } = useToast();
  const [resumo, setResumo] = useState(event?.resumo || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!event) return null;

  const handleSaveResumo = async () => {
    setSaving(true);
    try {
      await agendaService.atualizarEvento(event.id, { resumo });
      toast({ description: "Resumo salvo com sucesso!" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar resumo.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await agendaService.uploadAnexo(file, obraId, event.id);
      await agendaService.atualizarEvento(event.id, { anexo_url: url });
      toast({ description: "Arquivo anexado com sucesso!" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao fazer upload do arquivo.", variant: "destructive" });
    } finally {
    setUploading(false);
    }
  };

  const handleDeleteAnexo = async () => {
    if (!event.anexo_url) return;
    
    setDeleting(true);
    try {
      await agendaService.deletarAnexo(event.anexo_url, event.id);
      toast({ description: "Anexo removido com sucesso!" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao remover anexo.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (cat: string | null) => {
    switch (cat) {
      case "reuniao": return "Reunião";
      case "visita": return "Visita Técnica";
      case "entrega": return "Entrega";
      case "milestone": return "Marco";
      default: return "Geral";
    }
  };

  const getCategoryColor = (cat: string | null) => {
    switch (cat) {
      case "reuniao": return "bg-blue-100 text-blue-700";
      case "visita": return "bg-purple-100 text-purple-700";
      case "entrega": return "bg-green-100 text-green-700";
      case "milestone": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {event.completed && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {event.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn("text-xs", getCategoryColor(event.category))}>
                  {getCategoryLabel(event.category)}
                </Badge>
                {event.completed && (
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                    Concluído
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info básica */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>
                {format(parseISO(event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às{" "}
                {format(parseISO(event.start_date), "HH:mm")} - {format(parseISO(event.end_date), "HH:mm")}
              </span>
            </div>
            
            {event.participants && event.participants.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4" />
                <span>{event.participants.join(", ")}</span>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <FileText className="w-4 h-4 mt-0.5" />
                <p>{event.description}</p>
              </div>
            )}
          </div>

          {/* Seção de Resumo - apenas se concluído */}
          {event.completed && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resumo do Evento
              </Label>
              <Textarea
                placeholder="Adicione um resumo do que foi discutido/realizado..."
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                rows={4}
              />
              <Button 
                size="sm" 
                onClick={handleSaveResumo} 
                disabled={saving || resumo === (event.resumo || "")}
              >
                {saving ? "Salvando..." : "Salvar Resumo"}
              </Button>
            </div>
          )}

          {/* Seção de Anexo - apenas se concluído */}
          {event.completed && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Anexo
              </Label>
              
              {event.anexo_url ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <a 
                      href={event.anexo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Ver anexo <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteAnexo}
                    disabled={deleting}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    {deleting ? "..." : <X className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="anexo-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById('anexo-upload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Enviando..." : "Anexar Arquivo"}
                  </Button>
                  <span className="text-xs text-slate-400">PDF, Word, Excel, Imagens</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              onDelete(event.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              onEdit(event);
              onOpenChange(false);
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
