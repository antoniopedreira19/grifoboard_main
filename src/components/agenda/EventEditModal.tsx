import { useState, useEffect } from "react";
import { AgendaEvent } from "@/types/agenda";
import { agendaService } from "@/services/agendaService";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, Upload, ExternalLink, FileText } from "lucide-react";

interface EventEditModalProps {
  event: AgendaEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  obraId: string;
}

export function EventEditModal({
  event,
  open,
  onOpenChange,
  onUpdate,
  obraId,
}: EventEditModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    endTime: "",
    category: "geral",
    participants: "",
    description: "",
    resumo: "",
  });

  useEffect(() => {
    if (event) {
      const startDate = parseISO(event.start_date);
      const endDate = parseISO(event.end_date);
      
      setFormData({
        title: event.title,
        date: format(startDate, "yyyy-MM-dd"),
        time: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        category: event.category || "geral",
        participants: event.participants?.join(", ") || "",
        description: event.description || "",
        resumo: event.resumo || "",
      });
    }
  }, [event]);

  if (!event) return null;

  const handleSave = async () => {
    if (!formData.title || !formData.date) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

      await agendaService.atualizarEvento(event.id, {
        title: formData.title,
        description: formData.description || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        category: formData.category,
        participants: formData.participants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        resumo: formData.resumo || null,
      });

      toast({ description: "Evento atualizado com sucesso!" });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar evento.", variant: "destructive" });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Título do Evento *</Label>
            <Input
              placeholder="Ex: Reunião de Alinhamento"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Início</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Término</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="visita">Visita Técnica</SelectItem>
                <SelectItem value="entrega">Entrega de Material</SelectItem>
                <SelectItem value="milestone">Marco Importante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Participantes</Label>
            <Input
              placeholder="João, Maria, Empreiteira X"
              value={formData.participants}
              onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Detalhes sobre o evento..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Seção de Resumo - apenas se concluído */}
          {event.completed && (
            <>
              <div className="border-t pt-4 grid gap-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Resumo do Evento
                </Label>
                <Textarea
                  placeholder="Adicione um resumo do que foi discutido/realizado..."
                  value={formData.resumo}
                  onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Seção de Anexo */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Anexo
                </Label>
                
                {event.anexo_url ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
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
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="edit-anexo-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => document.getElementById('edit-anexo-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Enviando..." : "Anexar Arquivo"}
                    </Button>
                    <span className="text-xs text-slate-400">PDF, Word, Excel, Imagens</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
