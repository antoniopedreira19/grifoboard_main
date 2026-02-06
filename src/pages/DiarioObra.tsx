import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { diarioService, type DiarioObra as DiarioObraRecord } from "@/services/diarioService";
import { diarioFotosService, type DiarioFoto } from "@/services/diarioFotosService";
import { gamificationService } from "@/services/gamificationService";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Save,
  CloudSun,
  HardHat,
  ClipboardList,
  Camera,
  Loader2,
  FileText,
  BookOpen,
  History,
  Pencil,
  Trash2,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PhotoUploader } from "@/components/diario/PhotoUploader";
import { PhotoGallery } from "@/components/diario/PhotoGallery";
import { DiarioExportDialog } from "@/components/diario/DiarioExportDialog";

const DiarioObra = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true); // true = editing, false = view only
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<{ files: File[]; legenda: string }[]>([]);

  // Estados de Dados
  const [diarioId, setDiarioId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<DiarioFoto[]>([]);
  const [diarioHistory, setDiarioHistory] = useState<DiarioObraRecord[]>([]);
  const [formData, setFormData] = useState({
    clima_manha: "",
    clima_tarde: "",
    clima_noite: "",
    mao_de_obra: "",
    equipamentos: "",
    atividades: "",
    ocorrencias: "",
    observacoes: "",
  });

  const obraId = userSession?.obraAtiva?.id;
  const obraNome = userSession?.obraAtiva?.nome_obra;

  // Carregar dados ao mudar a data ou obra
  useEffect(() => {
    if (obraId) {
      loadDiario();
      loadPhotos();
      loadDiarioHistory();
    }
  }, [date, obraId]);

  // === VERIFICAÇÃO DE OBRA SELECIONADA ===
  // Se não houver obra selecionada, mostra a tela de seleção (igual às outras abas)
  if (!obraId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Nenhuma obra selecionada</h2>
          <p className="text-slate-600">Selecione uma obra para continuar.</p>
          <Button
            onClick={() => navigate("/obras")}
            className="px-6 py-3 bg-[#C7A347] text-white rounded-xl font-semibold hover:bg-[#B7943F] transition-colors"
          >
            Selecionar Obra
          </Button>
        </div>
      </div>
    );
  }

  // --- FUNÇÕES DE DADOS DO DIÁRIO ---

  const loadDiario = async () => {
    setIsLoading(true);
    try {
      const data = await diarioService.getDiarioByDate(obraId!, date);
      if (data) {
        setDiarioId(data.id);
        setIsEditMode(false); // Diário já existe, modo visualização

        let climas = { manha: "", tarde: "", noite: "" };
        try {
          const parsed = JSON.parse(data.clima || "{}");
          if (typeof parsed === "object") {
            climas = {
              manha: parsed.manha || "",
              tarde: parsed.tarde || "",
              noite: parsed.noite || "",
            };
          }
        } catch (e) {
          climas.manha = data.clima || "";
        }

        setFormData({
          clima_manha: climas.manha,
          clima_tarde: climas.tarde,
          clima_noite: climas.noite,
          mao_de_obra: data.mao_de_obra || "",
          equipamentos: data.equipamentos || "",
          atividades: data.atividades || "",
          ocorrencias: data.ocorrencias || "",
          observacoes: data.observacoes || "",
        });
      } else {
        setDiarioId(null);
        setIsEditMode(true); // Novo diário, modo edição
        setPendingPhotos([]);
        setFormData({
          clima_manha: "",
          clima_tarde: "",
          clima_noite: "",
          mao_de_obra: "",
          equipamentos: "",
          atividades: "",
          ocorrencias: "",
          observacoes: "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar diário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do diário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!obraId) {
      toast({
        title: "Erro",
        description: "Nenhuma obra selecionada.",
        variant: "destructive",
      });
      return;
    }

    // Validação: atividades é obrigatório
    if (!formData.atividades.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha as atividades realizadas antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const isNewDiario = !diarioId; // Marca se é novo ANTES de salvar
    
    try {
      const climaJson = JSON.stringify({
        manha: formData.clima_manha,
        tarde: formData.clima_tarde,
        noite: formData.clima_noite,
      });

      const savedDiario = await diarioService.upsertDiario({
        id: diarioId,
        obra_id: obraId,
        data_diario: format(date, "yyyy-MM-dd"),
        clima: climaJson,
        mao_de_obra: formData.mao_de_obra,
        equipamentos: formData.equipamentos,
        atividades: formData.atividades.trim(),
        ocorrencias: formData.ocorrencias,
        observacoes: formData.observacoes,
      });

      setDiarioId(savedDiario.id);

      // Upload pending photos after saving
      if (pendingPhotos.length > 0) {
        const isoDate = format(date, "yyyy-MM-dd");
        for (const pending of pendingPhotos) {
          await diarioFotosService.uploadDailyPhotos(obraId, isoDate, pending.files, pending.legenda);
        }
        setPendingPhotos([]);
        loadPhotos();
      }

      // === GAMIFICAÇÃO: Dar XP apenas para NOVO diário ===
      if (isNewDiario && userSession?.user?.id) {
        // Calcula XP baseado se foi preenchido no dia correto (sem timezone, apenas data local)
        const diarioDateStr = format(date, "yyyy-MM-dd");
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // 60 XP se preenchido no mesmo dia, 20 XP se atrasado
        const xpAmount = diarioDateStr === todayStr ? 60 : 20;
        
        await gamificationService.awardXP(
          userSession.user.id,
          'DIARIO_CRIADO',
          xpAmount,
          savedDiario.id
        );
      }

      setIsEditMode(false); // Switch to view mode after saving
      loadDiarioHistory(); // Refresh history

      toast({
        title: isNewDiario ? "Diário Registrado! 📖" : "Diário Atualizado",
        description: isNewDiario ? "Novo registro criado com sucesso." : "As informações foram atualizadas.",
        className: isNewDiario ? "bg-[#C7A347] text-white border-none" : "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnterEditMode = () => {
    setIsEditMode(true);
  };

  const handleDelete = async () => {
    if (!diarioId) return;
    
    setIsDeleting(true);
    try {
      // Guardar o ID antes de deletar para remover XP
      const diarioIdToRemove = diarioId;
      
      await diarioService.delete(diarioId);
      
      // Remover XP que foi dado quando o diário foi criado
      if (userSession?.user?.id) {
        gamificationService.removeXP(userSession.user.id, "DIARIO_CRIADO", 25, diarioIdToRemove);
      }
      
      // Reset form and state
      setDiarioId(null);
      setIsEditMode(true);
      setPendingPhotos([]);
      setFormData({
        clima_manha: "",
        clima_tarde: "",
        clima_noite: "",
        mao_de_obra: "",
        equipamentos: "",
        atividades: "",
        ocorrencias: "",
        observacoes: "",
      });
      
      loadDiarioHistory();
      loadPhotos();
      
      toast({
        title: "Diário excluído",
        description: "O registro foi removido com sucesso.",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o diário.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAddPendingPhotos = async (files: File[], legenda?: string) => {
    setPendingPhotos((prev) => [...prev, { files, legenda: legenda || "" }]);
    toast({ title: "Fotos adicionadas", description: "As fotos serão salvas junto com o diário." });
  };

  // --- FUNÇÃO DE HISTÓRICO ---
  const loadDiarioHistory = async () => {
    if (!obraId) return;
    setIsLoadingHistory(true);
    try {
      const data = await diarioService.getByObra(obraId);
      setDiarioHistory(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // --- FUNÇÕES DE FOTOS ---

  const loadPhotos = async () => {
    if (!obraId) return;
    setIsLoadingPhotos(true);
    try {
      const isoDate = format(date, "yyyy-MM-dd");
      // Filtro "todos" carrega fotos de todos os usuários
      const data = await diarioFotosService.loadPhotos(obraId, isoDate, "todos");
      setPhotos(data);
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handlePhotoUpload = async (files: File[], legenda?: string) => {
    if (!obraId) return;
    try {
      const isoDate = format(date, "yyyy-MM-dd");
      await diarioFotosService.uploadDailyPhotos(obraId, isoDate, files, legenda || "");
      toast({ title: "Sucesso", description: "Fotos enviadas com sucesso." });
      loadPhotos(); // Recarrega a galeria
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao enviar fotos.", variant: "destructive" });
    }
  };

  const handlePhotoDelete = async (id: string, path: string) => {
    try {
      await diarioFotosService.deletePhoto(id, path);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Foto excluída", description: "A imagem foi removida do diário." });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível excluir a foto.", variant: "destructive" });
    }
  };

  // --- HELPERS ---

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setDate(newDate);
  };

  const handleSelectDiario = (diario: DiarioObraRecord) => {
    setDate(parseISO(diario.data));
  };

  const climaOptions = ["Ensolarado", "Nublado", "Chuvoso", "Variável", "Impraticável"];

  // ===== MOBILE VERSION =====
  if (isMobile) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-slate-50/30">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Header Mobile */}
          <div className="px-1 pt-2 pb-2 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Diário de Obra
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {obraNome || "Selecione uma obra"}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Export PDF Button Mobile */}
                <DiarioExportDialog obraId={obraId} obraNome={obraNome || "Obra"} date={date} />
                
                {/* Histórico Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 h-9">
                      <History className="h-4 w-4" />
                      {diarioHistory.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {diarioHistory.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                  <SheetHeader className="pb-4 border-b">
                    <SheetTitle>Diários Salvos</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-full py-4">
                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : diarioHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2 opacity-40" />
                        <p className="text-sm">Nenhum diário registrado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {diarioHistory.map((diario) => {
                          const isSelected = format(date, "yyyy-MM-dd") === diario.data;
                          return (
                            <button
                              key={diario.id}
                              onClick={() => handleSelectDiario(diario)}
                              className={cn(
                                "w-full text-left p-4 rounded-xl transition-all",
                                isSelected ? "bg-primary/10 border-2 border-primary/30" : "bg-slate-50 border border-slate-100"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm text-foreground">
                                  {format(parseISO(diario.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                </span>
                                {isSelected && (
                                  <Badge variant="default" className="text-xs h-5">Atual</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {diario.atividades || "Sem atividades registradas"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Date Navigator Mobile */}
          <div className="px-4 py-3 bg-white/80 border-b border-slate-100">
            <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDay("prev")}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex-1 h-10 font-semibold text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {format(date, "dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDay("next")}
                className="h-10 w-10"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground text-sm">Carregando...</p>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              {/* Status Badge */}
              {diarioId && !isEditMode && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Diário salvo</span>
                </div>
              )}

              {/* Clima Card Mobile */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-slate-100">
                  <CloudSun className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-slate-700">Clima</span>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { key: "manha", label: "Manhã", icon: Sun, color: "text-amber-500" },
                    { key: "tarde", label: "Tarde", icon: Sunset, color: "text-orange-500" },
                    { key: "noite", label: "Noite", icon: Moon, color: "text-indigo-500" },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 w-14">{label}</span>
                      <Select
                        value={formData[`clima_${key}` as keyof typeof formData]}
                        onValueChange={(val) => handleInputChange(`clima_${key}`, val)}
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className={cn("flex-1 h-11", !isEditMode && "bg-slate-50")}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {climaOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recursos Card Mobile */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-slate-100">
                  <HardHat className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-slate-700">Recursos</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Mão de Obra</Label>
                    <Textarea
                      placeholder="Ex: 5 Pedreiros, 4 Serventes..."
                      value={formData.mao_de_obra}
                      onChange={(e) => handleInputChange("mao_de_obra", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[80px] text-base resize-none", !isEditMode && "bg-slate-50")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Equipamentos</Label>
                    <Textarea
                      placeholder="Ex: 1 Betoneira, 1 Serra..."
                      value={formData.equipamentos}
                      onChange={(e) => handleInputChange("equipamentos", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[80px] text-base resize-none", !isEditMode && "bg-slate-50")}
                    />
                  </div>
                </div>
              </div>

              {/* Atividades Card Mobile */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-slate-100">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-slate-700">Atividades</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Serviços Executados</Label>
                    <Textarea
                      placeholder="Descreva o que foi feito hoje..."
                      value={formData.atividades}
                      onChange={(e) => handleInputChange("atividades", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[120px] text-base resize-none", !isEditMode && "bg-slate-50")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-red-500 uppercase">Ocorrências</Label>
                    <Textarea
                      placeholder="Houve algum problema?"
                      value={formData.ocorrencias}
                      onChange={(e) => handleInputChange("ocorrencias", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[80px] text-base resize-none border-red-100", !isEditMode && "bg-slate-50")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Observações</Label>
                    <Textarea
                      placeholder="Outras anotações..."
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange("observacoes", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[80px] text-base resize-none", !isEditMode && "bg-slate-50")}
                    />
                  </div>
                </div>
              </div>

              {/* Fotos Card Mobile */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-slate-700">Fotos</span>
                    {photos.length > 0 && (
                      <Badge variant="secondary" className="h-5 text-xs">{photos.length}</Badge>
                    )}
                  </div>
                  {isEditMode && <PhotoUploader onUpload={diarioId ? handlePhotoUpload : handleAddPendingPhotos} />}
                </div>
                <div className="p-4 min-h-[120px]">
                  {/* Pending Photos */}
                  {!diarioId && pendingPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {pendingPhotos.flatMap((p, idx) =>
                        p.files.map((file, fileIdx) => (
                          <div key={`pending-${idx}-${fileIdx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-primary/40">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Foto pendente"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] py-0.5 text-center font-medium">
                              Pendente
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {diarioId ? (
                    <PhotoGallery
                      photos={photos}
                      loading={isLoadingPhotos}
                      onDelete={isEditMode ? handlePhotoDelete : undefined}
                      currentUserId={userSession?.user?.id}
                    />
                  ) : pendingPhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl">
                      <Camera className="h-6 w-6 mb-1 opacity-20" />
                      <p className="text-xs">Adicione fotos</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg z-20">
          {!isEditMode && diarioId ? (
            <div className="flex gap-3">
              <Button
                onClick={handleEnterEditMode}
                variant="outline"
                className="flex-1 h-12 gap-2 border-primary text-primary text-base font-semibold rounded-xl"
              >
                <Pencil className="h-5 w-5" />
                Editar
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                className="h-12 w-12 border-destructive text-destructive rounded-xl"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 shadow-md text-base font-semibold rounded-xl gap-2"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Salvar Diário
            </Button>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-[90vw] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Diário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={isDeleting} className="flex-1">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ===== DESKTOP VERSION (Original) =====
  return (
    <div className="container mx-auto max-w-[1600px] px-4 sm:px-6 py-6 min-h-screen pb-24 space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-secondary" />
            Diário de Obra
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {obraNome || "Selecione uma obra"}
          </p>
        </div>

        {/* Histórico de Diários */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 border-border shadow-sm">
              <History className="h-4 w-4" />
              Histórico
              {diarioHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {diarioHistory.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border bg-muted/30">
              <h4 className="font-semibold text-sm text-foreground">Diários Salvos</h4>
              <p className="text-xs text-muted-foreground">Clique para visualizar</p>
            </div>
            <ScrollArea className="h-[280px]">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : diarioHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Nenhum diário registrado</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {diarioHistory.map((diario) => {
                    const isSelected = format(date, "yyyy-MM-dd") === diario.data;
                    return (
                      <button
                        key={diario.id}
                        onClick={() => handleSelectDiario(diario)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all hover:bg-accent",
                          isSelected && "bg-primary/10 border border-primary/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground">
                            {format(parseISO(diario.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </span>
                          {isSelected && (
                            <Badge variant="default" className="text-xs h-5">
                              Atual
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {diario.atividades || "Sem atividades registradas"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-6">
        {/* Barra de Navegação e Ações */}
        <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay("prev")}
              className="h-9 w-9 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "justify-start text-left font-semibold w-[240px] h-9 hover:bg-slate-50",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay("next")}
              className="h-9 w-9 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Export PDF Button Desktop */}
            <DiarioExportDialog obraId={obraId} obraNome={obraNome || "Obra"} date={date} />
            
            {!isEditMode && diarioId ? (
              <>
                <Button
                  onClick={handleEnterEditMode}
                  variant="outline"
                  className="gap-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="outline"
                  className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Excluir
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md transition-all gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Diário
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Carregando registros do dia...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base font-heading text-primary flex items-center gap-2">
                    <CloudSun className="h-4 w-4 text-secondary" />
                    Condições Climáticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {["manha", "tarde", "noite"].map((periodo) => (
                      <div key={periodo} className="flex items-center justify-between gap-4">
                        <Label className="capitalize w-16 text-slate-600">
                          {periodo === "manha" ? "Manhã" : periodo}
                        </Label>
                        <Select
                          value={formData[`clima_${periodo}` as keyof typeof formData]}
                          onValueChange={(val) => handleInputChange(`clima_${periodo}`, val)}
                          disabled={!isEditMode}
                        >
                          <SelectTrigger className={cn("flex-1 h-9 border-slate-200", !isEditMode && "bg-slate-50 cursor-not-allowed")}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {climaOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base font-heading text-primary flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-secondary" />
                    Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Mão de Obra (Qtd e Tipo)</Label>
                    <Textarea
                      placeholder="Ex: 5 Pedreiros, 4 Serventes..."
                      value={formData.mao_de_obra}
                      onChange={(e) => handleInputChange("mao_de_obra", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[80px] border-slate-200 resize-none focus:border-secondary", !isEditMode && "bg-slate-50 cursor-not-allowed")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Equipamentos Utilizados</Label>
                    <Textarea
                      placeholder="Ex: 1 Betoneira, 1 Serra Circular..."
                      value={formData.equipamentos}
                      onChange={(e) => handleInputChange("equipamentos", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[80px] border-slate-200 resize-none focus:border-secondary", !isEditMode && "bg-slate-50 cursor-not-allowed")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                  <CardTitle className="text-base font-heading text-primary flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-secondary" />
                    Registro de Atividades
                  </CardTitle>
                  <CardDescription>Descrição detalhada dos serviços executados no dia.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Atividades Executadas</Label>
                    <Textarea
                      placeholder="Descreva o que foi feito hoje..."
                      value={formData.atividades}
                      onChange={(e) => handleInputChange("atividades", e.target.value)}
                      disabled={!isEditMode}
                      className={cn("min-h-[150px] border-slate-200 focus:border-secondary text-base leading-relaxed", !isEditMode && "bg-slate-50 cursor-not-allowed")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Ocorrências / Impeditivos</Label>
                      <Textarea
                        placeholder="Houve algum problema?"
                        value={formData.ocorrencias}
                        onChange={(e) => handleInputChange("ocorrencias", e.target.value)}
                        disabled={!isEditMode}
                        className={cn("min-h-[100px] border-red-100 focus:border-red-300 bg-red-50/10", !isEditMode && "bg-slate-50 cursor-not-allowed")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Observações Gerais</Label>
                      <Textarea
                        placeholder="Outras anotações..."
                        value={formData.observacoes}
                        onChange={(e) => handleInputChange("observacoes", e.target.value)}
                        disabled={!isEditMode}
                        className={cn("min-h-[100px] border-slate-200", !isEditMode && "bg-slate-50 cursor-not-allowed")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Galeria de Fotos - Antes de Salvar */}
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-heading text-primary flex items-center gap-2">
                      <Camera className="h-4 w-4 text-secondary" />
                      Galeria de Fotos
                    </CardTitle>
                    {/* Upload: em modo edição, ou se já existe diário e está em modo edição */}
                    {isEditMode && <PhotoUploader onUpload={diarioId ? handlePhotoUpload : handleAddPendingPhotos} />}
                  </div>
                  <CardDescription>
                    {isEditMode && !diarioId && pendingPhotos.length > 0
                      ? `${pendingPhotos.reduce((acc, p) => acc + p.files.length, 0)} foto(s) pendente(s) - serão salvas com o diário.`
                      : "Documentação visual do dia."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 bg-slate-50/30 min-h-[200px]">
                  {/* Show pending photos if no diarioId yet */}
                  {!diarioId && pendingPhotos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {pendingPhotos.flatMap((p, idx) =>
                        p.files.map((file, fileIdx) => (
                          <div key={`pending-${idx}-${fileIdx}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/40 bg-primary/5">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Foto pendente"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-xs py-1 px-2 text-center">
                              Pendente
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {diarioId ? (
                    <PhotoGallery
                      photos={photos}
                      loading={isLoadingPhotos}
                      onDelete={isEditMode ? handlePhotoDelete : undefined}
                      currentUserId={userSession?.user?.id}
                    />
                  ) : pendingPhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl">
                      <Camera className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">Adicione fotos antes de salvar o diário</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Diário de Obra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este diário? Esta ação não pode ser desfeita.
              As fotos associadas a este dia também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiarioObra;
