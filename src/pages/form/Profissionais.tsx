import { useState, useRef, useEffect, useCallback } from "react";
import { PublicFormLayout } from "@/components/PublicFormLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"; // Importando Switch
import {
  Users,
  Loader2,
  CheckCircle2,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  X,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cadastrosService } from "@/services/cadastrosService";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SignupAfterFormDialog } from "@/components/auth/SignupAfterFormDialog";

// --- Constantes ---
const OPCOES_REGIOES = ["Região Norte", "Região Nordeste", "Região Centro-Oeste", "Região Sudeste", "Região Sul"];

const OPCOES_DIFERENCIAIS = [
  "Experiência em obras de médio/grande porte",
  "Especialização técnica",
  "Curso profissionalizante",
  "Certificação NR (10, 35, etc)",
  "Carteira de motorista (CNH)",
  "Veículo próprio",
  "Disponibilidade para viagens",
  "Outro",
];

const OPCOES_ESPECIALIDADES = [
  "Acabamentos",
  "Alvenaria / Estrutura",
  "Carpintaria / Marcenaria",
  "Elétrica Residencial",
  "Elétrica Predial/Industrial",
  "Gesso / Drywall",
  "Hidráulica",
  "Impermeabilização",
  "Pintura",
  "Serralheria",
  "Telhados / Coberturas",
  "Vidraçaria",
  "Outro",
];

// --- Componente de Upload Mobile-Friendly ---
const UploadField = ({
  label,
  sublabel,
  accept,
  icon: Icon,
  files,
  onFilesChange,
  multiple = false,
}: {
  label: string;
  sublabel: string;
  accept: string;
  icon: any;
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (multiple) {
        onFilesChange([...files, ...newFiles]);
      } else {
        onFilesChange(newFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary shrink-0" /> {label}
      </Label>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-primary/50 transition-all group bg-white min-h-[110px] active:bg-slate-100"
      >
        <div className="text-slate-400 group-hover:text-primary transition-colors mb-2">
          <UploadCloud className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-sm font-medium text-slate-700">Toque para adicionar</p>
        <p className="text-[11px] text-slate-400">{sublabel}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mt-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="relative flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md shadow-sm"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="h-10 w-10 object-cover rounded bg-slate-100 border border-slate-100"
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded border border-slate-100">
                  <FileText className="h-5 w-5 text-slate-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Profissionais() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [createdId, setCreatedId] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Estado dos Dados
  const [formData, setFormData] = useState({
    // Pessoais
    nome_completo: "",
    cpf: "",
    data_nascimento: "",
    telefone: "",
    email: "",
    cidade: "",
    estado: "",
    // Profissional
    funcao_principal: "",
    funcao_principal_outro: "",
    especialidades: [] as string[],
    especialidades_outro: "",
    tempo_experiencia: "",
    obras_relevantes: "",
    disponibilidade_atual: "",
    modalidade_trabalho: "",
    pretensao_valor: "",
    equipamentos_proprios: "Não",
    // Extras
    cidades_frequentes: "",
    regioes_atendidas: [] as string[],
    diferenciais: [] as string[],
    diferenciais_outro: "",
    // Novo Campo
    ja_trabalhou_com_grifo: false,
  });

  const [filesLogo, setFilesLogo] = useState<File[]>([]);
  const [filesFotos, setFilesFotos] = useState<File[]>([]);
  const [filesCurriculo, setFilesCurriculo] = useState<File[]>([]);
  const [filesCertificados, setFilesCertificados] = useState<File[]>([]);

  const checkEmailExists = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailError(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const { checkEmailExistsGlobal } = await import("@/services/emailValidationService");
      const result = await checkEmailExistsGlobal(email);

      if (result.exists) {
        setEmailError("Esse email já está cadastrado no sistema.");
      } else {
        setEmailError(null);
      }
    } catch (err) {
      console.error("Erro ao verificar email:", err);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailExists(formData.email);
      } else {
        setEmailError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, checkEmailExists]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (
    field: "regioes_atendidas" | "diferenciais" | "especialidades",
    item: string,
    checked: boolean,
  ) => {
    setFormData((prev) => {
      const list = prev[field];
      if (checked) {
        return { ...prev, [field]: [...list, item] };
      } else {
        return { ...prev, [field]: list.filter((i) => i !== item) };
      }
    });
  };

  const uploadFiles = async (files: File[], folder: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage.from("formularios-profissionais").upload(fileName, file);

      if (!error && data) {
        const { data: urlData } = supabase.storage.from("formularios-profissionais").getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!formData.nome_completo || !formData.telefone || !formData.funcao_principal) {
      toast({
        title: "Campos obrigatórios",
        description: "Verifique seus dados pessoais e função.",
        variant: "destructive",
      });
      setStep(1);
      return;
    }

    if (emailError) {
      toast({
        title: "Email inválido",
        description: emailError,
        variant: "destructive",
      });
      setStep(1);
      return;
    }

    if (formData.funcao_principal === "Outros" && !formData.funcao_principal_outro) {
      toast({ title: "Atenção", description: "Especifique sua função principal.", variant: "destructive" });
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const [logoUrls, fotosUrls, curriculoUrls, certificadosUrls] = await Promise.all([
        uploadFiles(filesLogo, "logos"),
        uploadFiles(filesFotos, "trabalhos"),
        uploadFiles(filesCurriculo, "curriculos"),
        uploadFiles(filesCertificados, "certificados"),
      ]);

      const payload = {
        ...formData,
        especialidades: [
          ...formData.especialidades,
          formData.funcao_principal === "Outros" ? formData.funcao_principal_outro : formData.funcao_principal,
        ],
        logo_path: logoUrls[0] || null,
        fotos_trabalhos_path: JSON.stringify(fotosUrls),
        curriculo_path: JSON.stringify(curriculoUrls),
        certificacoes_path: JSON.stringify(certificadosUrls),
        data_nascimento: formData.data_nascimento || "2000-01-01",
        ja_trabalhou_com_grifo: formData.ja_trabalhou_com_grifo, // Campo adicionado ao payload
      };

      const { data, error } = await supabase.from("formulario_profissionais").insert(payload).select("id").single();

      if (error) throw error;

      setCreatedId(data.id);
      setShowSignupModal(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao enviar", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PublicFormLayout
        title="Cadastro Recebido!"
        description="Seu perfil profissional foi criado com sucesso."
        icon={<CheckCircle2 className="h-8 w-8 text-green-600" />}
      >
        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
          <p className="text-slate-600">
            Nossa equipe de engenharia analisará seu portfólio. Mantenha seu WhatsApp atualizado.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-12 text-base">
            Novo Cadastro
          </Button>
        </div>
      </PublicFormLayout>
    );
  }

  return (
    <PublicFormLayout
      title="Banco de Talentos"
      description="Junte-se à elite da construção civil."
      icon={<Users className="h-8 w-8" />}
    >
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step === i
                  ? "bg-primary text-white scale-110 shadow-md"
                  : step > i
                    ? "bg-green-500 text-white"
                    : "bg-slate-100 text-slate-400",
              )}
            >
              {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
            </div>
            {i < 3 && <div className={cn("w-8 h-1 mx-1 rounded-full", step > i ? "bg-green-500" : "bg-slate-100")} />}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-500">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome_completo}
                onChange={(e) => handleChange("nome_completo", e.target.value)}
                required
                placeholder="Nome completo"
                className="bg-slate-50 h-12"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  className="bg-slate-50 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Nascimento</Label>
                <Input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleChange("data_nascimento", e.target.value)}
                  className="bg-slate-50 h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>WhatsApp *</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  required
                  placeholder="(DDD) 99999-9999"
                  className="bg-slate-50 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={cn(
                      "bg-slate-50 h-12",
                      emailError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                    )}
                  />
                  {checkingEmail && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
                {emailError && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {emailError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade (Base)</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                  className="bg-slate-50 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => handleChange("estado", e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  className="bg-slate-50 h-12"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Regiões onde aceita trabalhar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-md border border-slate-100">
                {OPCOES_REGIOES.map((regiao) => (
                  <div key={regiao} className="flex items-center space-x-3 p-1">
                    <Checkbox
                      id={`reg-${regiao}`}
                      checked={formData.regioes_atendidas.includes(regiao)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("regioes_atendidas", regiao, checked as boolean)
                      }
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`reg-${regiao}`} className="text-sm font-normal cursor-pointer leading-none py-1">
                      {regiao}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cidades Frequentes (Onde mais trabalha)</Label>
              <Input
                value={formData.cidades_frequentes}
                onChange={(e) => handleChange("cidades_frequentes", e.target.value)}
                placeholder="Ex: Goiânia, Anápolis..."
                className="bg-slate-50 h-12"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-500">
            <div className="space-y-2">
              <Label>Função Principal *</Label>
              <Select onValueChange={(val) => handleChange("funcao_principal", val)} value={formData.funcao_principal}>
                <SelectTrigger className="bg-slate-50 h-12">
                  <SelectValue placeholder="Selecione sua função principal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                  <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                  <SelectItem value="Mestre de Obras">Mestre de Obras</SelectItem>
                  <SelectItem value="Eletricista">Eletricista</SelectItem>
                  <SelectItem value="Encanador">Encanador</SelectItem>
                  <SelectItem value="Pedreiro">Pedreiro</SelectItem>
                  <SelectItem value="Pintor">Pintor</SelectItem>
                  <SelectItem value="Gesseiro">Gesseiro</SelectItem>
                  <SelectItem value="Serralheiro">Serralheiro</SelectItem>
                  <SelectItem value="Ajudante">Ajudante</SelectItem>
                  <SelectItem value="Outros">Outros (Especifique)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.funcao_principal === "Outros" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>Especifique sua função *</Label>
                <Input
                  value={formData.funcao_principal_outro}
                  onChange={(e) => handleChange("funcao_principal_outro", e.target.value)}
                  placeholder="Ex: Azulejista, Carpinteiro..."
                  className="bg-slate-50 border-primary/50 h-12"
                />
              </div>
            )}

            <div className="space-y-3 pt-2 border-t mt-4">
              <Label>Outras Especialidades (O que você domina?)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-md border border-slate-100">
                {OPCOES_ESPECIALIDADES.map((item) => (
                  <div key={item} className="flex items-center space-x-3 p-1">
                    <Checkbox
                      id={`esp-${item}`}
                      checked={formData.especialidades.includes(item)}
                      onCheckedChange={(checked) => handleCheckboxChange("especialidades", item, checked as boolean)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`esp-${item}`} className="text-sm font-normal cursor-pointer leading-none py-1">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.especialidades.includes("Outro") && (
                <Input
                  placeholder="Qual outra especialidade?"
                  value={formData.especialidades_outro}
                  onChange={(e) => handleChange("especialidades_outro", e.target.value)}
                  className="mt-2 h-12"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label>Tempo de Experiência</Label>
                <Select
                  onValueChange={(val) => handleChange("tempo_experiencia", val)}
                  value={formData.tempo_experiencia}
                >
                  <SelectTrigger className="bg-slate-50 h-12">
                    <SelectValue placeholder="Anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="1-3 anos">1-3 anos</SelectItem>
                    <SelectItem value="3-5 anos">3-5 anos</SelectItem>
                    <SelectItem value="Mais de 5 anos">Mais de 5 anos</SelectItem>
                    <SelectItem value="Mais de 10 anos">Mais de 10 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disponibilidade *</Label>
                <Select
                  onValueChange={(val) => handleChange("disponibilidade_atual", val)}
                  value={formData.disponibilidade_atual}
                >
                  <SelectTrigger className="bg-slate-50 h-12">
                    <SelectValue placeholder="Quando pode?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Imediata">Imediata</SelectItem>
                    <SelectItem value="Em 15 dias">Em 15 dias</SelectItem>
                    <SelectItem value="Em 30 dias">Em 30 dias</SelectItem>
                    <SelectItem value="Apenas por contrato pontual">Apenas por contrato pontual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modalidade</Label>
                <Select
                  onValueChange={(val) => handleChange("modalidade_trabalho", val)}
                  value={formData.modalidade_trabalho}
                >
                  <SelectTrigger className="bg-slate-50 h-12">
                    <SelectValue placeholder="Prefere..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="Diaria">Diária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pretensão (R$)</Label>
                <Input
                  placeholder="Valor dia/mês"
                  value={formData.pretensao_valor}
                  onChange={(e) => handleChange("pretensao_valor", e.target.value)}
                  className="bg-slate-50 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Possui Equipamentos Próprios?</Label>
              <RadioGroup
                value={formData.equipamentos_proprios}
                onValueChange={(val) => handleChange("equipamentos_proprios", val)}
                className="flex gap-4 p-3 bg-slate-50 rounded-md border border-slate-100"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sim" id="sim" className="h-5 w-5" />
                  <Label htmlFor="sim" className="cursor-pointer text-sm">
                    Sim
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Não" id="nao" className="h-5 w-5" />
                  <Label htmlFor="nao" className="cursor-pointer text-sm">
                    Não
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Diferenciais (Selecione todos que se aplicam)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-md border border-slate-100">
                {OPCOES_DIFERENCIAIS.map((item) => (
                  <div key={item} className="flex items-center space-x-3 p-1">
                    <Checkbox
                      id={`dif-${item}`}
                      checked={formData.diferenciais.includes(item)}
                      onCheckedChange={(checked) => handleCheckboxChange("diferenciais", item, checked as boolean)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`dif-${item}`} className="text-sm font-normal cursor-pointer leading-none py-1">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.diferenciais.includes("Outro") && (
                <Input
                  placeholder="Qual outro diferencial?"
                  value={formData.diferenciais_outro}
                  onChange={(e) => handleChange("diferenciais_outro", e.target.value)}
                  className="mt-2 h-12"
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 mb-2">
              <strong>Dica:</strong> Perfis completos aparecem primeiro nas buscas dos engenheiros.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UploadField
                label="Foto de Perfil ou Logo"
                sublabel="JPG/PNG. Use uma foto clara do rosto."
                accept="image/*"
                icon={Users}
                files={filesLogo}
                onFilesChange={setFilesLogo}
                multiple={false}
              />

              <UploadField
                label="Currículo / Apresentação"
                sublabel="PDF ou Imagem do seu CV."
                accept=".pdf,image/*"
                icon={Briefcase}
                files={filesCurriculo}
                onFilesChange={setFilesCurriculo}
                multiple={true}
              />
            </div>

            <UploadField
              label="Fotos dos Trabalhos Realizados"
              sublabel="Obras que você já fez. Antes e Depois valorizam muito!"
              accept="image/*"
              icon={ImageIcon}
              files={filesFotos}
              onFilesChange={setFilesFotos}
              multiple={true}
            />

            <UploadField
              label="Certificações e NRs"
              sublabel="Diploma, NR10, NR35, Certificados Técnicos..."
              accept=".pdf,image/*"
              icon={GraduationCap}
              files={filesCertificados}
              onFilesChange={setFilesCertificados}
              multiple={true}
            />

            <div className="space-y-2 mt-4">
              <Label>Resumo Profissional / Obras Relevantes</Label>
              <Textarea
                placeholder="Conte sobre as principais obras que participou ou detalhes que não estão nos documentos..."
                value={formData.obras_relevantes}
                onChange={(e) => handleChange("obras_relevantes", e.target.value)}
                className="bg-slate-50 min-h-[100px]"
              />
            </div>

            {/* Novo Campo Switch */}
            <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50">
              <Switch
                id="ja-trabalhou"
                checked={formData.ja_trabalhou_com_grifo}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ja_trabalhou_com_grifo: checked }))}
                className="data-[state=checked]:bg-[#C7A347]"
              />
              <Label htmlFor="ja-trabalhou" className="cursor-pointer">
                Já trabalhou com a Grifo anteriormente?
              </Label>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-4 pt-4 border-t border-slate-100 mt-8">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((prev) => prev - 1)}
              disabled={loading}
              className="h-12"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              className="bg-slate-800 hover:bg-slate-900 h-12 px-6"
            >
              Próximo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 min-w-[140px] h-12 text-base shadow-lg font-bold"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Finalizar Cadastro"}
            </Button>
          )}
        </div>
      </div>

      <SignupAfterFormDialog
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        entityId={createdId || ""}
        entityType="profissional"
        emailDefault={formData.email}
      />
    </PublicFormLayout>
  );
}
