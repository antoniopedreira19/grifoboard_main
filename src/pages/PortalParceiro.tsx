import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LogOut, User, Loader2, Image as ImageIcon, LayoutTemplate, FileText, Plus, Camera, X, Edit3, Save, XCircle, MapPin, Star, Building2, Truck, Phone, Mail, ArrowLeft, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatPhoneNumber } from "@/lib/utils/formatPhone";
import { format, parseISO } from "date-fns";

// Helper to format dates as DD/MM/AAAA
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
};

// Helper component for displaying/editing info fields
interface EditableFieldProps {
  label: string;
  value: string | null | undefined;
  fieldName: string;
  isEditing: boolean;
  onChange: (fieldName: string, value: string) => void;
  type?: "text" | "textarea" | "email" | "tel";
}

const EditableField = ({ label, value, fieldName, isEditing, onChange, type = "text" }: EditableFieldProps) => {
  if (!isEditing && !value) return null;
  
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      {isEditing ? (
        type === "textarea" ? (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className="text-sm"
            rows={3}
          />
        ) : (
          <Input
            type={type}
            value={value || ""}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className="text-sm"
          />
        )
      ) : (
        <p className="text-sm text-foreground font-medium">{value}</p>
      )}
    </div>
  );
};

// Simple read-only info field
const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  );
};

// File upload section component
interface FileUploadSectionProps {
  title: string;
  description: string;
  fieldName: string;
  currentPath: string | null;
  bucket: string;
  onUpload: (fieldName: string, file: File) => Promise<void>;
  onDeleteFile: (fieldName: string, fileIndex: number, filePath: string) => Promise<void>;
  isImage?: boolean;
  isMultiple?: boolean;
  uploading: boolean;
}

const FileUploadSection = ({
  title,
  description,
  fieldName,
  currentPath,
  bucket,
  onUpload,
  onDeleteFile,
  isImage = true,
  isMultiple = false,
  uploading,
}: FileUploadSectionProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<{ path: string; url: string }[]>([]);

  useEffect(() => {
    // Only process if currentPath is a valid non-empty string
    if (currentPath && typeof currentPath === 'string' && currentPath.trim() !== '' && currentPath !== '[]' && currentPath !== 'null') {
      const paths = currentPath.split(",").filter((p) => {
        const trimmed = p.trim();
        // Filter out empty strings, brackets, and invalid paths
        return trimmed && trimmed.length > 2 && !trimmed.startsWith('[') && !trimmed.startsWith(']');
      });
      
      if (paths.length > 0) {
        const data = paths.map((p) => {
          const trimmed = p.trim();
          if (trimmed.startsWith("http")) return { path: trimmed, url: trimmed };
          const { data } = supabase.storage.from(bucket).getPublicUrl(trimmed);
          return { path: trimmed, url: data.publicUrl };
        });
        setFileData(data);
      } else {
        setFileData([]);
      }
    } else {
      setFileData([]);
    }
  }, [currentPath, bucket]);

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      await onUpload(fieldName, files[i]);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={uploading}
          className="text-xs"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          Adicionar
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={isImage ? "image/*" : ".pdf,.doc,.docx,image/*"}
        multiple={isMultiple}
        onChange={handleFileChange}
      />
      {fileData.length > 0 ? (
        <div className={`grid ${isImage ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1"} gap-3`}>
          {fileData.map((file, idx) => (
            <div key={idx} className="relative group">
              {isImage ? (
                <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={file.url} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted hover:bg-muted/80 transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-foreground truncate">Documento {idx + 1}</span>
                </a>
              )}
              <button
                onClick={() => onDeleteFile(fieldName, idx, file.path)}
                disabled={uploading}
                className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-50"
                title="Remover arquivo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
        >
          {isImage ? (
            <Camera className="h-6 w-6 text-muted-foreground mb-2" />
          ) : (
            <FileText className="h-6 w-6 text-muted-foreground mb-2" />
          )}
          <p className="text-xs text-muted-foreground text-center">Clique para adicionar</p>
        </div>
      )}
    </div>
  );
};

export default function PortalParceiro() {
  const { userSession, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [editedData, setEditedData] = useState<any>(null);
  const [partnerType, setPartnerType] = useState<"profissional" | "empresa" | "fornecedor" | null>(null);

  useEffect(() => {
    if (!userSession?.user) {
      navigate("/auth");
      return;
    }
    fetchPartnerData();
  }, [userSession]);

  const fetchPartnerData = async () => {
    setLoading(true);
    const userId = userSession?.user.id;
    if (!userId) return;

    // Tenta encontrar em Profissionais
    let { data: prof } = await supabase.from("formulario_profissionais").select("*").eq("user_id", userId).single();
    if (prof) {
      setPartnerData(prof);
      setPartnerType("profissional");
      setLoading(false);
      return;
    }

    // Tenta encontrar em Empresas
    let { data: emp } = await supabase.from("formulario_empresas").select("*").eq("user_id", userId).single();
    if (emp) {
      setPartnerData(emp);
      setPartnerType("empresa");
      setLoading(false);
      return;
    }

    // Tenta encontrar em Fornecedores
    let { data: forn } = await supabase.from("formulario_fornecedores").select("*").eq("user_id", userId).single();
    if (forn) {
      setPartnerData(forn);
      setPartnerType("fornecedor");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    // signOut already handles redirect to /auth
  };

  const getBucket = () => {
    if (partnerType === "empresa") return "formularios-empresas";
    if (partnerType === "fornecedor") return "formularios-fornecedores";
    return "formularios-profissionais";
  };

  const getTableName = () => {
    if (partnerType === "empresa") return "formulario_empresas";
    if (partnerType === "fornecedor") return "formulario_fornecedores";
    return "formulario_profissionais";
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    if (!partnerData?.id) return;
    setUploading(true);
    
    try {
      const bucket = getBucket();
      const fileExt = file.name.split(".").pop();
      const fileName = `${partnerData.id}/${fieldName}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
      if (uploadError) throw uploadError;

      // Get current value and append new file (for multiple files support)
      const currentValue = partnerData[fieldName];
      const newValue = currentValue ? `${currentValue},${fileName}` : fileName;

      const tableName = getTableName();
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [fieldName]: newValue })
        .eq("id", partnerData.id);

      if (updateError) throw updateError;

      setPartnerData({ ...partnerData, [fieldName]: newValue });
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fieldName: string, fileIndex: number, filePath: string) => {
    if (!partnerData?.id) return;
    setUploading(true);

    try {
      const currentValue = partnerData[fieldName];
      let newValue: string | null = null;
      
      if (currentValue && typeof currentValue === 'string') {
        const paths = currentValue.split(",").map(p => p.trim()).filter(p => p && p.length > 2);
        // Remove the specific file at the index
        paths.splice(fileIndex, 1);
        newValue = paths.length > 0 ? paths.join(",") : null;
      }

      const tableName = getTableName();
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [fieldName]: newValue })
        .eq("id", partnerData.id);

      if (updateError) throw updateError;

      setPartnerData({ ...partnerData, [fieldName]: newValue });
      toast.success("Arquivo removido com sucesso!");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Erro ao remover arquivo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Edit mode functions
  const startEditing = () => {
    setEditedData({ ...partnerData });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedData(null);
    setIsEditing(false);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [fieldName]: value }));
  };

  const saveChanges = async () => {
    if (!editedData || !partnerData?.id) return;
    setSaving(true);

    try {
      const tableName = getTableName();
      const { error } = await supabase
        .from(tableName)
        .update(editedData)
        .eq("id", partnerData.id);

      if (error) throw error;

      setPartnerData(editedData);
      setIsEditing(false);
      setEditedData(null);
      toast.success("Dados atualizados com sucesso!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Função auxiliar para obter URL da imagem
  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const bucket = getBucket();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-secondary" />
        <p className="text-muted-foreground font-medium animate-pulse">Carregando seu perfil...</p>
      </div>
    );
  }

  if (!partnerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-lg border border-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
              <User className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Perfil não encontrado</CardTitle>
            <CardDescription>Não localizamos um cadastro de parceiro vinculado ao seu usuário.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <Button onClick={handleLogout} variant="destructive" className="w-full">
              Sair e tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const partnerName = partnerData.nome_completo || partnerData.nome_empresa;
  const logoUrl = getLogoUrl(partnerData.logo_path);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* --- HEADER --- */}
      <header className="bg-primary border-b border-white/10 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-3">
            <img
              src="/lovable-uploads/grifo-logo-header.png"
              alt="Grifo"
              className="h-8 transition-transform hover:scale-105"
            />
            <div className="hidden md:flex h-6 w-[1px] bg-white/20 mx-1"></div>
            <span className="text-sm font-semibold text-white/80 tracking-tight hidden md:inline-block">
              Portal do Parceiro
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 py-1.5 px-3 rounded-full border border-white/10">
              <Avatar key={logoUrl || 'no-logo'} className="h-8 w-8 border-2 border-secondary shadow-sm">
                <AvatarImage src={logoUrl || ""} alt="Foto de perfil" />
                <AvatarFallback className="bg-secondary text-white font-bold">
                  {partnerName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-xs text-right mr-1">
                <p className="font-semibold text-white truncate max-w-[120px]">{partnerName}</p>
                <p className="text-white/50 font-medium capitalize">{partnerType}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white/70 hover:text-red-400 hover:bg-red-500/20 transition-colors"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="container mx-auto p-4 md:p-8 max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-secondary/10 text-secondary border-secondary/20 px-2.5 py-0.5 uppercase text-[10px] tracking-wider font-bold">
                Portal do Parceiro
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
              Olá,{" "}
              <span className="text-secondary">
                {partnerName?.split(" ")[0]}
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-lg">
              Gerencie suas informações e mantenha seu perfil atualizado para se destacar no marketplace.
            </p>
          </div>
          <div className="hidden md:block">
            {/* Status do Perfil */}
            <div className="text-right">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status do Perfil</span>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-medium text-primary">Ativo no Marketplace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList className="bg-card p-1.5 border border-border shadow-sm rounded-xl w-full md:w-auto h-auto flex-wrap justify-start gap-1">
            <TabsTrigger
              value="dados"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-white font-medium transition-all"
            >
              <User className="h-4 w-4 mr-2" /> Dados Cadastrais
            </TabsTrigger>
            <TabsTrigger
              value="midia"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-white font-medium transition-all"
            >
              <ImageIcon className="h-4 w-4 mr-2" /> Fotos e Documentos
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-secondary data-[state=active]:text-white font-medium transition-all"
            >
              <LayoutTemplate className="h-4 w-4 mr-2" /> Visualizar Cartão
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DADOS */}
          <TabsContent value="dados" className="focus-visible:outline-none">
            <Card className="border border-border shadow-lg bg-card overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-secondary to-secondary/30" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                      <User className="h-5 w-5 text-secondary" /> Informações do Perfil
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {isEditing ? "Edite seus dados cadastrais." : "Seus dados cadastrais no marketplace."}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          disabled={saving}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveChanges}
                          disabled={saving}
                          className="bg-secondary hover:bg-secondary/90 text-white"
                        >
                          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEditing}
                        className="border-secondary/30 text-secondary hover:bg-secondary/10"
                      >
                        <Edit3 className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                {partnerType === "profissional" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditableField label="Nome Completo" value={isEditing ? editedData?.nome_completo : partnerData.nome_completo} fieldName="nome_completo" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="CPF" value={isEditing ? editedData?.cpf : partnerData.cpf} fieldName="cpf" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Data de Nascimento" value={isEditing ? editedData?.data_nascimento : formatDate(partnerData.data_nascimento)} fieldName="data_nascimento" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Telefone" value={isEditing ? editedData?.telefone : partnerData.telefone} fieldName="telefone" isEditing={isEditing} onChange={handleFieldChange} type="tel" />
                    <EditableField label="Email" value={isEditing ? editedData?.email : partnerData.email} fieldName="email" isEditing={isEditing} onChange={handleFieldChange} type="email" />
                    <EditableField label="Cidade" value={isEditing ? editedData?.cidade : partnerData.cidade} fieldName="cidade" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Estado" value={isEditing ? editedData?.estado : partnerData.estado} fieldName="estado" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Função Principal" value={isEditing ? editedData?.funcao_principal : partnerData.funcao_principal} fieldName="funcao_principal" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Tempo de Experiência" value={isEditing ? editedData?.tempo_experiencia : partnerData.tempo_experiencia} fieldName="tempo_experiencia" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Disponibilidade" value={isEditing ? editedData?.disponibilidade_atual : partnerData.disponibilidade_atual} fieldName="disponibilidade_atual" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Modalidade de Trabalho" value={isEditing ? editedData?.modalidade_trabalho : partnerData.modalidade_trabalho} fieldName="modalidade_trabalho" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Pretensão Salarial" value={isEditing ? editedData?.pretensao_valor : partnerData.pretensao_valor} fieldName="pretensao_valor" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Equipamentos Próprios" value={isEditing ? editedData?.equipamentos_proprios : partnerData.equipamentos_proprios} fieldName="equipamentos_proprios" isEditing={isEditing} onChange={handleFieldChange} />
                    <div className="md:col-span-2">
                      <EditableField label="Cidades Frequentes" value={isEditing ? editedData?.cidades_frequentes : partnerData.cidades_frequentes} fieldName="cidades_frequentes" isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                    <div className="md:col-span-2">
                      <EditableField label="Obras Relevantes" value={isEditing ? editedData?.obras_relevantes : partnerData.obras_relevantes} fieldName="obras_relevantes" isEditing={isEditing} onChange={handleFieldChange} type="textarea" />
                    </div>
                    {!isEditing && (
                      <>
                        <div className="md:col-span-2">
                          <InfoField label="Especialidades" value={partnerData.especialidades?.join(", ")} />
                        </div>
                        <div className="md:col-span-2">
                          <InfoField label="Regiões Atendidas" value={partnerData.regioes_atendidas?.join(", ")} />
                        </div>
                        <div className="md:col-span-2">
                          <InfoField label="Diferenciais" value={partnerData.diferenciais?.join(", ")} />
                        </div>
                      </>
                    )}
                  </div>
                )}
                {partnerType === "empresa" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditableField label="Nome da Empresa" value={isEditing ? editedData?.nome_empresa : partnerData.nome_empresa} fieldName="nome_empresa" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="CNPJ" value={isEditing ? editedData?.cnpj : partnerData.cnpj} fieldName="cnpj" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Cidade" value={isEditing ? editedData?.cidade : partnerData.cidade} fieldName="cidade" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Estado" value={isEditing ? editedData?.estado : partnerData.estado} fieldName="estado" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Ano de Fundação" value={isEditing ? editedData?.ano_fundacao : partnerData.ano_fundacao} fieldName="ano_fundacao" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Tamanho da Empresa" value={isEditing ? editedData?.tamanho_empresa : partnerData.tamanho_empresa} fieldName="tamanho_empresa" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Obras em Andamento" value={isEditing ? editedData?.obras_andamento : partnerData.obras_andamento} fieldName="obras_andamento" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Ticket Médio" value={isEditing ? editedData?.ticket_medio : partnerData.ticket_medio} fieldName="ticket_medio" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Site" value={isEditing ? editedData?.site : partnerData.site} fieldName="site" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Nome do Contato" value={isEditing ? editedData?.nome_contato : partnerData.nome_contato} fieldName="nome_contato" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Cargo" value={isEditing ? editedData?.cargo_contato : partnerData.cargo_contato} fieldName="cargo_contato" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="WhatsApp" value={isEditing ? editedData?.whatsapp_contato : partnerData.whatsapp_contato} fieldName="whatsapp_contato" isEditing={isEditing} onChange={handleFieldChange} type="tel" />
                    <EditableField label="Email" value={isEditing ? editedData?.email_contato : partnerData.email_contato} fieldName="email_contato" isEditing={isEditing} onChange={handleFieldChange} type="email" />
                    <div className="md:col-span-2">
                      <EditableField label="Ferramentas de Gestão" value={isEditing ? editedData?.ferramentas_gestao : partnerData.ferramentas_gestao} fieldName="ferramentas_gestao" isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                    <div className="md:col-span-2">
                      <EditableField label="Planejamento Curto Prazo" value={isEditing ? editedData?.planejamento_curto_prazo : partnerData.planejamento_curto_prazo} fieldName="planejamento_curto_prazo" isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                    {!isEditing && (
                      <>
                        <div className="md:col-span-2">
                          <InfoField label="Tipos de Obras" value={partnerData.tipos_obras?.join(", ")} />
                        </div>
                        <div className="md:col-span-2">
                          <InfoField label="Principais Desafios" value={partnerData.principais_desafios?.join(", ")} />
                        </div>
                      </>
                    )}
                  </div>
                )}
                {partnerType === "fornecedor" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditableField label="Nome da Empresa" value={isEditing ? editedData?.nome_empresa : partnerData.nome_empresa} fieldName="nome_empresa" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="CNPJ/CPF" value={isEditing ? editedData?.cnpj_cpf : partnerData.cnpj_cpf} fieldName="cnpj_cpf" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Cidade" value={isEditing ? editedData?.cidade : partnerData.cidade} fieldName="cidade" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Estado" value={isEditing ? editedData?.estado : partnerData.estado} fieldName="estado" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Tempo de Atuação" value={isEditing ? editedData?.tempo_atuacao : partnerData.tempo_atuacao} fieldName="tempo_atuacao" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Ticket Médio" value={isEditing ? editedData?.ticket_medio : partnerData.ticket_medio} fieldName="ticket_medio" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Capacidade de Atendimento" value={isEditing ? editedData?.capacidade_atendimento : partnerData.capacidade_atendimento} fieldName="capacidade_atendimento" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Responsável" value={isEditing ? editedData?.nome_responsavel : partnerData.nome_responsavel} fieldName="nome_responsavel" isEditing={isEditing} onChange={handleFieldChange} />
                    <EditableField label="Telefone" value={isEditing ? editedData?.telefone : partnerData.telefone} fieldName="telefone" isEditing={isEditing} onChange={handleFieldChange} type="tel" />
                    <EditableField label="Email" value={isEditing ? editedData?.email : partnerData.email} fieldName="email" isEditing={isEditing} onChange={handleFieldChange} type="email" />
                    <EditableField label="Site" value={isEditing ? editedData?.site : partnerData.site} fieldName="site" isEditing={isEditing} onChange={handleFieldChange} />
                    <div className="md:col-span-2">
                      <EditableField label="Cidades Frequentes" value={isEditing ? editedData?.cidades_frequentes : partnerData.cidades_frequentes} fieldName="cidades_frequentes" isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                    {!isEditing && (
                      <>
                        <div className="md:col-span-2">
                          <InfoField label="Tipos de Atuação" value={partnerData.tipos_atuacao?.join(", ")} />
                        </div>
                        <div className="md:col-span-2">
                          <InfoField label="Categorias Atendidas" value={partnerData.categorias_atendidas?.join(", ")} />
                        </div>
                        <div className="md:col-span-2">
                          <InfoField label="Regiões Atendidas" value={partnerData.regioes_atendidas?.join(", ")} />
                        </div>
                        <div className="md:col-span-2">
                          <InfoField label="Diferenciais" value={partnerData.diferenciais?.join(", ")} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FOTOS E DOCUMENTOS */}
          <TabsContent value="midia" className="focus-visible:outline-none space-y-6">
            {/* Foto de Perfil / Logo - Destacada */}
            <Card className="border border-border shadow-lg bg-card overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-secondary to-secondary/30" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                  <Camera className="h-5 w-5 text-secondary" /> Foto de Perfil
                </CardTitle>
                <CardDescription className="mt-1">
                  Sua foto principal que aparece no Marketplace.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-secondary/30 shadow-lg">
                      <AvatarImage src={getLogoUrl(partnerData.logo_path) || ""} />
                      <AvatarFallback className="bg-secondary/10 text-secondary text-3xl font-bold">
                        {partnerName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {partnerData.logo_path && (
                      <button
                        onClick={() => handleFileDelete("logo_path", 0, partnerData.logo_path)}
                        disabled={uploading}
                        className="absolute top-0 right-0 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-50"
                        title="Remover foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-secondary rounded-full p-1.5 shadow-lg">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <FileUploadSection
                      title={partnerData.logo_path ? "Substituir Foto" : "Adicionar Foto"}
                      description="JPG, PNG até 5MB"
                      fieldName="logo_path"
                      currentPath={null}
                      bucket={getBucket()}
                      onUpload={handleFileUpload}
                      onDeleteFile={handleFileDelete}
                      isImage={true}
                      uploading={uploading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seções específicas por tipo de parceiro */}
            {partnerType === "profissional" && (
              <>
                <Card className="border border-border shadow-lg bg-card overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/30" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                      <ImageIcon className="h-5 w-5 text-secondary" /> Fotos de Trabalhos
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Mostre seus melhores trabalhos para atrair clientes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <FileUploadSection
                      title="Galeria de Trabalhos"
                      description="Adicione fotos dos seus projetos"
                      fieldName="fotos_trabalhos_path"
                      currentPath={partnerData.fotos_trabalhos_path}
                      bucket={getBucket()}
                      onUpload={handleFileUpload}
                      onDeleteFile={handleFileDelete}
                      isImage={true}
                      isMultiple={true}
                      uploading={uploading}
                    />
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-lg bg-card overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-secondary to-secondary/30" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                      <FileText className="h-5 w-5 text-secondary" /> Documentos
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Adicione currículo e certificações para validar sua experiência.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6 space-y-6">
                    <FileUploadSection
                      title="Currículo"
                      description="PDF ou documento com seu currículo"
                      fieldName="curriculo_path"
                      currentPath={partnerData.curriculo_path}
                      bucket={getBucket()}
                      onUpload={handleFileUpload}
                      onDeleteFile={handleFileDelete}
                      isImage={false}
                      uploading={uploading}
                    />
                    <div className="border-t border-border pt-6">
                      <FileUploadSection
                        title="Certificações"
                        description="Certificados e cursos realizados"
                        fieldName="certificacoes_path"
                        currentPath={partnerData.certificacoes_path}
                        bucket={getBucket()}
                        onUpload={handleFileUpload}
                        onDeleteFile={handleFileDelete}
                        isImage={false}
                        isMultiple={true}
                        uploading={uploading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {partnerType === "fornecedor" && (
              <>
                <Card className="border border-border shadow-lg bg-card overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/30" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                      <ImageIcon className="h-5 w-5 text-secondary" /> Portfólio e Fotos
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Mostre seus produtos e trabalhos realizados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6 space-y-6">
                    <FileUploadSection
                      title="Portfólio"
                      description="Apresentação da empresa ou catálogo"
                      fieldName="portfolio_path"
                      currentPath={partnerData.portfolio_path}
                      bucket={getBucket()}
                      onUpload={handleFileUpload}
                      onDeleteFile={handleFileDelete}
                      isImage={false}
                      uploading={uploading}
                    />
                    <div className="border-t border-border pt-6">
                      <FileUploadSection
                        title="Fotos de Trabalhos"
                        description="Fotos de produtos ou serviços realizados"
                        fieldName="fotos_trabalhos_path"
                        currentPath={partnerData.fotos_trabalhos_path}
                        bucket={getBucket()}
                        onUpload={handleFileUpload}
                        onDeleteFile={handleFileDelete}
                        isImage={true}
                        isMultiple={true}
                        uploading={uploading}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-lg bg-card overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-secondary to-secondary/30" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                      <FileText className="h-5 w-5 text-secondary" /> Certificações
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Adicione certificados e alvarás da empresa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <FileUploadSection
                      title="Certificações e Alvarás"
                      description="Documentos que validam a empresa"
                      fieldName="certificacoes_path"
                      currentPath={partnerData.certificacoes_path}
                      bucket={getBucket()}
                      onUpload={handleFileUpload}
                      onDeleteFile={handleFileDelete}
                      isImage={false}
                      isMultiple={true}
                      uploading={uploading}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {partnerType === "empresa" && (
              <Card className="border border-border shadow-lg bg-card overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-secondary to-secondary/30" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <FileText className="h-5 w-5 text-secondary" /> Apresentação Institucional
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Adicione a apresentação da sua empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <FileUploadSection
                    title="Apresentação PDF"
                    description="Documento institucional da empresa"
                    fieldName="apresentacao_path"
                    currentPath={partnerData.apresentacao_path}
                    bucket={getBucket()}
                    onUpload={handleFileUpload}
                    onDeleteFile={handleFileDelete}
                    isImage={false}
                    uploading={uploading}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: PREVIEW - Card do Marketplace */}
          <TabsContent value="preview" className="focus-visible:outline-none">
            <div className="flex flex-col items-center py-8 space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Prévia do seu Cartão</h3>
                <p className="text-sm text-slate-400">Clique no cartão para ver como aparecerá no Marketplace.</p>
              </div>
              
              {/* Card Preview - exactly like MarketplaceCard */}
              <div className="w-full max-w-sm cursor-pointer" onClick={() => setIsPreviewModalOpen(true)}>
                <Card className="group overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  {/* Header with gradient */}
                  <div
                    className={`h-24 relative ${
                      partnerType === "empresa"
                        ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10"
                        : partnerType === "profissional"
                          ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10"
                          : "bg-gradient-to-br from-amber-500/20 to-amber-600/10"
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      {getLogoUrl(partnerData.logo_path) ? (
                        <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                          <img
                            src={getLogoUrl(partnerData.logo_path)!}
                            alt={partnerName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-full ${
                          partnerType === "empresa" ? "bg-blue-500/10 text-blue-600" :
                          partnerType === "profissional" ? "bg-emerald-500/10 text-emerald-600" :
                          "bg-amber-500/10 text-amber-600"
                        }`}>
                          {partnerType === "empresa" ? <Building2 className="h-5 w-5" /> :
                           partnerType === "profissional" ? <User className="h-5 w-5" /> :
                           <Truck className="h-5 w-5" />}
                        </div>
                      )}
                    </div>

                    {/* New badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                      <Star className="h-3 w-3 opacity-50" />
                      <span className="text-xs opacity-70">Novo no Grifo</span>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Name */}
                    <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
                      {partnerName}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">{partnerData.cidade} - {partnerData.estado}</span>
                    </div>

                    {/* Phone */}
                    {(partnerData.telefone || partnerData.whatsapp_contato) && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="line-clamp-1">{partnerData.telefone || partnerData.whatsapp_contato}</span>
                      </div>
                    )}

                    {/* Email */}
                    {(partnerData.email || partnerData.email_contato) && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="line-clamp-1 text-xs">{partnerData.email || partnerData.email_contato}</span>
                      </div>
                    )}

                    {/* Extra info */}
                    {partnerType === "profissional" && partnerData.funcao_principal && (
                      <p className="text-xs text-muted-foreground mb-2 font-medium px-2 py-1 bg-muted/50 rounded-md inline-block line-clamp-1">
                        {partnerData.funcao_principal === "Outro" && partnerData.funcao_principal_outro 
                          ? partnerData.funcao_principal_outro 
                          : partnerData.funcao_principal}
                      </p>
                    )}
                    {partnerType === "fornecedor" && partnerData.tipos_atuacao?.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-2 font-medium px-2 py-1 bg-muted/50 rounded-md inline-block line-clamp-1">
                        {partnerData.tipos_atuacao.slice(0, 2).join(", ")}
                      </p>
                    )}
                    {partnerType === "empresa" && partnerData.tamanho_empresa && (
                      <p className="text-xs text-muted-foreground mb-2 font-medium px-2 py-1 bg-muted/50 rounded-md inline-block line-clamp-1">
                        {partnerData.tamanho_empresa}
                      </p>
                    )}

                    {/* Categories */}
                    {(() => {
                      const cats = partnerType === "profissional" ? partnerData.especialidades :
                                   partnerType === "fornecedor" ? partnerData.categorias_atendidas :
                                   partnerData.tipos_obras;
                      return cats && cats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {cats.slice(0, 2).map((cat: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] font-normal px-1.5 h-5">
                              {cat}
                            </Badge>
                          ))}
                          {cats.length > 2 && (
                            <Badge variant="outline" className="text-[10px] font-normal px-1.5 h-5">
                              +{cats.length - 2}
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-slate-400 text-center max-w-md">
                Clique no cartão acima para ver uma prévia completa de como seu perfil aparece no Marketplace.
              </p>
            </div>

            {/* Preview Detail Modal */}
            <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
              <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden border-0 rounded-2xl shadow-2xl bg-white flex flex-col">
                {/* Header with gradient */}
                <div className={`relative bg-gradient-to-r ${
                  partnerType === "empresa" ? "from-blue-500 to-blue-600" :
                  partnerType === "profissional" ? "from-emerald-500 to-emerald-600" :
                  "from-amber-500 to-amber-600"
                } p-6 pb-24`}>
                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="absolute top-4 right-16 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    <span className="text-white font-semibold">0.0</span>
                    <span className="text-white/70 text-sm">(0)</span>
                  </div>
                </div>

                {/* Profile Info Overlapping */}
                <div className="relative -mt-20 mx-6 mb-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                    {/* Avatar / Logo */}
                    <div className="rounded-2xl p-1 bg-white shadow-xl">
                      {getLogoUrl(partnerData.logo_path) ? (
                        <img src={getLogoUrl(partnerData.logo_path)!} alt={partnerName} className="w-32 h-32 rounded-xl object-cover bg-slate-100" />
                      ) : (
                        <div className={`w-32 h-32 rounded-xl bg-gradient-to-br ${
                          partnerType === "empresa" ? "from-blue-500 to-blue-600" :
                          partnerType === "profissional" ? "from-emerald-500 to-emerald-600" :
                          "from-amber-500 to-amber-600"
                        } flex items-center justify-center text-white`}>
                          {partnerType === "empresa" ? <Building2 className="h-10 w-10" /> :
                           partnerType === "profissional" ? <User className="h-10 w-10" /> :
                           <Truck className="h-10 w-10" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 pb-2">
                      <Badge variant="secondary" className="mb-2">
                        {partnerType === "empresa" ? "Empresa" : partnerType === "profissional" ? "Profissional" : "Fornecedor"}
                      </Badge>
                      <h2 className="text-3xl font-bold text-slate-900 truncate max-w-lg">{partnerName}</h2>
                      <div className="flex items-center gap-2 mt-1 text-slate-500">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{partnerData.cidade}, {partnerData.estado}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="info" className="flex-1 flex flex-col px-6 mt-4 min-h-0 overflow-hidden">
                  <TabsList className="w-full justify-start gap-2 bg-transparent p-0 h-auto border-b border-border pb-1 mb-4 overflow-x-auto flex-shrink-0">
                    <TabsTrigger value="info" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none">
                      Informações
                    </TabsTrigger>
                    <TabsTrigger value="fotos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none">
                      Fotos
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none">
                      Documentos
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none">
                      Avaliações (0)
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 min-h-0 overflow-auto -mx-6 px-6 pb-6">
                    {/* Info Tab */}
                    <TabsContent value="info" className="mt-0 space-y-6">
                      {/* Contatos */}
                      <div className="bg-muted/30 rounded-2xl p-5 border">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" /> Contatos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoField label="Telefone" value={formatPhoneNumber(partnerData.telefone || partnerData.whatsapp_contato)} />
                          <InfoField label="Email" value={partnerData.email || partnerData.email_contato} />
                        </div>
                      </div>

                      {/* Dados Pessoais / Empresa */}
                      <div className="bg-muted/30 rounded-2xl p-5 border">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" /> 
                          {partnerType === "profissional" ? "Dados Pessoais" : "Dados da Empresa"}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {partnerType === "profissional" && (
                            <>
                              <InfoField label="Nome" value={partnerData.nome_completo} />
                              <InfoField label="CPF" value={partnerData.cpf} />
                              <InfoField label="Data de Nascimento" value={formatDate(partnerData.data_nascimento)} />
                              <InfoField label="Localização" value={`${partnerData.cidade}, ${partnerData.estado}`} />
                              <InfoField label="Função Principal" value={partnerData.funcao_principal} />
                              <InfoField label="Tempo de Experiência" value={partnerData.tempo_experiencia} />
                              <InfoField label="Disponibilidade" value={partnerData.disponibilidade_atual} />
                              <InfoField label="Modalidade" value={partnerData.modalidade_trabalho} />
                              <InfoField label="Pretensão Salarial" value={partnerData.pretensao_valor} />
                              <InfoField label="Equipamentos Próprios" value={partnerData.equipamentos_proprios} />
                            </>
                          )}
                          {partnerType === "empresa" && (
                            <>
                              <InfoField label="Nome da Empresa" value={partnerData.nome_empresa} />
                              <InfoField label="CNPJ" value={partnerData.cnpj} />
                              <InfoField label="Localização" value={`${partnerData.cidade}, ${partnerData.estado}`} />
                              <InfoField label="Ano de Fundação" value={partnerData.ano_fundacao} />
                              <InfoField label="Tamanho" value={partnerData.tamanho_empresa} />
                              <InfoField label="Obras em Andamento" value={partnerData.obras_andamento} />
                              <InfoField label="Ticket Médio" value={partnerData.ticket_medio} />
                              <InfoField label="Site" value={partnerData.site} />
                              <InfoField label="Contato" value={partnerData.nome_contato} />
                              <InfoField label="Cargo" value={partnerData.cargo_contato} />
                            </>
                          )}
                          {partnerType === "fornecedor" && (
                            <>
                              <InfoField label="Nome da Empresa" value={partnerData.nome_empresa} />
                              <InfoField label="CNPJ/CPF" value={partnerData.cnpj_cpf} />
                              <InfoField label="Localização" value={`${partnerData.cidade}, ${partnerData.estado}`} />
                              <InfoField label="Tempo de Atuação" value={partnerData.tempo_atuacao} />
                              <InfoField label="Ticket Médio" value={partnerData.ticket_medio} />
                              <InfoField label="Capacidade" value={partnerData.capacidade_atendimento} />
                              <InfoField label="Responsável" value={partnerData.nome_responsavel} />
                              <InfoField label="Site" value={partnerData.site} />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Especialidades / Categorias */}
                      {partnerType === "profissional" && partnerData.especialidades?.length > 0 && (
                        <div className="bg-muted/30 rounded-2xl p-5 border">
                          <h4 className="font-semibold mb-4">Especialidades</h4>
                          <div className="flex flex-wrap gap-2">
                            {partnerData.especialidades.map((esp: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{esp}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {partnerType === "fornecedor" && partnerData.categorias_atendidas?.length > 0 && (
                        <div className="bg-muted/30 rounded-2xl p-5 border">
                          <h4 className="font-semibold mb-4">Categorias Atendidas</h4>
                          <div className="flex flex-wrap gap-2">
                            {partnerData.categorias_atendidas.map((cat: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{cat}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {partnerType === "empresa" && partnerData.tipos_obras?.length > 0 && (
                        <div className="bg-muted/30 rounded-2xl p-5 border">
                          <h4 className="font-semibold mb-4">Tipos de Obras</h4>
                          <div className="flex flex-wrap gap-2">
                            {partnerData.tipos_obras.map((tipo: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{tipo}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Regiões Atendidas */}
                      {(partnerType === "profissional" || partnerType === "fornecedor") && partnerData.regioes_atendidas?.length > 0 && (
                        <div className="bg-muted/30 rounded-2xl p-5 border">
                          <h4 className="font-semibold mb-4">Regiões Atendidas</h4>
                          <div className="flex flex-wrap gap-2">
                            {partnerData.regioes_atendidas.map((reg: string, idx: number) => (
                              <Badge key={idx} variant="outline">{reg}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Diferenciais */}
                      {(partnerType === "profissional" || partnerType === "fornecedor") && partnerData.diferenciais?.length > 0 && (
                        <div className="bg-muted/30 rounded-2xl p-5 border">
                          <h4 className="font-semibold mb-4">Diferenciais</h4>
                          <div className="flex flex-wrap gap-2">
                            {partnerData.diferenciais.map((dif: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">{dif}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Fotos Tab */}
                    <TabsContent value="fotos" className="mt-0">
                      {(() => {
                        const photoFields = partnerType === "profissional" ? ["fotos_trabalhos_path"] :
                                           partnerType === "fornecedor" ? ["portfolio_path", "fotos_trabalhos_path"] : [];
                        
                        const getPhotos = () => {
                          const photos: string[] = [];
                          photoFields.forEach(field => {
                            const value = partnerData[field];
                            if (value && typeof value === 'string' && value.trim() !== '' && value !== '[]') {
                              const paths = value.split(",").filter((p: string) => {
                                const trimmed = p.trim();
                                return trimmed && trimmed.length > 2 && !trimmed.startsWith('[');
                              });
                              paths.forEach((p: string) => {
                                const trimmed = p.trim();
                                if (trimmed.startsWith("http")) {
                                  photos.push(trimmed);
                                } else {
                                  const { data } = supabase.storage.from(getBucket()).getPublicUrl(trimmed);
                                  photos.push(data.publicUrl);
                                }
                              });
                            }
                          });
                          return photos;
                        };
                        
                        const photos = getPhotos();
                        
                        if (photos.length === 0) {
                          return (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
                              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                              <p className="text-sm">Nenhuma foto cadastrada</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {photos.map((url, idx) => (
                              <div 
                                key={idx} 
                                className="aspect-square rounded-xl overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  setLightboxImages(photos);
                                  setLightboxIndex(idx);
                                  setLightboxOpen(true);
                                }}
                              >
                                <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </TabsContent>

                    {/* Docs Tab */}
                    <TabsContent value="docs" className="mt-0">
                      {(() => {
                        const docFields = partnerType === "profissional" ? ["curriculo_path", "certificacoes_path"] :
                                         partnerType === "fornecedor" ? ["portfolio_path", "certificacoes_path"] :
                                         ["apresentacao_path"];
                        
                        const getDocs = () => {
                          const docs: { name: string; url: string }[] = [];
                          docFields.forEach(field => {
                            const value = partnerData[field];
                            if (value && typeof value === 'string' && value.trim() !== '' && value !== '[]') {
                              const paths = value.split(",").filter((p: string) => {
                                const trimmed = p.trim();
                                return trimmed && trimmed.length > 2 && !trimmed.startsWith('[');
                              });
                              paths.forEach((p: string, idx: number) => {
                                const trimmed = p.trim();
                                const ext = trimmed.toLowerCase().split(".").pop();
                                if (!["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
                                  let url = trimmed;
                                  if (!trimmed.startsWith("http")) {
                                    const { data } = supabase.storage.from(getBucket()).getPublicUrl(trimmed);
                                    url = data.publicUrl;
                                  }
                                  const label = field === "curriculo_path" ? "Currículo" :
                                               field === "certificacoes_path" ? `Certificação ${idx + 1}` :
                                               field === "apresentacao_path" ? "Apresentação Institucional" :
                                               `Documento ${idx + 1}`;
                                  docs.push({ name: label, url });
                                }
                              });
                            }
                          });
                          return docs;
                        };
                        
                        const docs = getDocs();
                        
                        if (docs.length === 0) {
                          return (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
                              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                              <p className="text-sm">Nenhum documento cadastrado</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-3">
                            {docs.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                              >
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="flex-1 font-medium text-sm">{doc.name}</span>
                                <Download className="h-4 w-4 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        );
                      })()}
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews" className="mt-0">
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
                        <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Nenhuma avaliação ainda</p>
                        <p className="text-xs mt-2 text-muted-foreground/60">
                          As avaliações aparecem aqui quando clientes avaliam seu perfil no Marketplace.
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Lightbox for photos */}
            {lightboxOpen && (
              <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
                <button 
                  className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
                
                {lightboxIndex > 0 && (
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i - 1); }}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                )}
                
                {lightboxIndex < lightboxImages.length - 1 && (
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i + 1); }}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                )}
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                  {lightboxIndex + 1} / {lightboxImages.length}
                </div>
                
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt="Foto ampliada"
                  className="max-h-[85vh] max-w-[90vw] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
