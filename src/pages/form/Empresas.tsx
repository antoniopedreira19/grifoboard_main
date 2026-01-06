import { useState, useEffect, useCallback } from "react";
import FormTemplate from "./FormTemplate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SuccessModal } from "@/components/SuccessModal";
import { toast } from "sonner";
import { FileUploadButton } from "@/components/FileUploadButton";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Empresas = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [apresentacaoFile, setApresentacaoFile] = useState<File | null>(null);
  
  // Estado para validação de email
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [formData, setFormData] = useState({
    // 1. Informações da Empresa
    nomeEmpresa: "",
    cnpj: "",
    site: "",
    cidade: "",
    estado: "",
    anoFundacao: "",
    tamanhoEmpresa: "",

    // 2. Contato Principal
    nomeContato: "",
    cargoContato: "",
    whatsappContato: "",
    emailContato: "",

    // 3. Estrutura Operacional
    obrasAndamento: "",
    tiposObras: [] as string[],
    tiposObrasOutro: "",
    ticketMedio: "",

    // 4. Processo Atual de Planejamento
    planejamentoCurtoPrazo: "",
    ferramentasGestao: "",

    // 5. Principais desafios
    principaisDesafios: [] as string[],
    desafiosOutro: "",
  });

  // Verificar se email já existe em todas as tabelas do sistema
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

  // Debounce para verificação de email
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.emailContato) {
        checkEmailExists(formData.emailContato);
      } else {
        setEmailError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.emailContato, checkEmailExists]);

  const handleCheckboxChange = (field: 'tiposObras' | 'principaisDesafios', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async () => {
    // Validação de email duplicado
    if (emailError) {
      toast.error(emailError);
      return;
    }
    
    setIsSubmitting(true);
    setUploadingFiles(true);
    
    try {
      let logoPath: string | null = null;
      let apresentacaoPath: string | null = null;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('formularios-empresas')
          .upload(`logos/${fileName}`, logoFile);
        if (uploadError) throw uploadError;
        logoPath = `logos/${fileName}`;
      }

      if (apresentacaoFile) {
        const fileExt = apresentacaoFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('formularios-empresas')
          .upload(`apresentacoes/${fileName}`, apresentacaoFile);
        if (uploadError) throw uploadError;
        apresentacaoPath = `apresentacoes/${fileName}`;
      }

      setUploadingFiles(false);

      const { error } = await supabase
        .from("formulario_empresas")
        .insert({
          nome_empresa: formData.nomeEmpresa,
          cnpj: formData.cnpj,
          site: formData.site || null,
          cidade: formData.cidade,
          estado: formData.estado,
          ano_fundacao: formData.anoFundacao,
          tamanho_empresa: formData.tamanhoEmpresa,
          nome_contato: formData.nomeContato,
          cargo_contato: formData.cargoContato,
          whatsapp_contato: formData.whatsappContato,
          email_contato: formData.emailContato,
          obras_andamento: formData.obrasAndamento,
          tipos_obras: formData.tiposObras,
          tipos_obras_outro: formData.tiposObrasOutro || null,
          ticket_medio: formData.ticketMedio,
          planejamento_curto_prazo: formData.planejamentoCurtoPrazo,
          ferramentas_gestao: formData.ferramentasGestao || null,
          principais_desafios: formData.principaisDesafios,
          desafios_outro: formData.desafiosOutro || null,
          logo_path: logoPath,
          apresentacao_path: apresentacaoPath,
        });

      if (error) throw error;

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Erro ao enviar formulário. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    
    // Reset form
    setFormData({
      nomeEmpresa: "",
      cnpj: "",
      site: "",
      cidade: "",
      estado: "",
      anoFundacao: "",
      tamanhoEmpresa: "",
      nomeContato: "",
      cargoContato: "",
      whatsappContato: "",
      emailContato: "",
      obrasAndamento: "",
      tiposObras: [],
      tiposObrasOutro: "",
      ticketMedio: "",
      planejamentoCurtoPrazo: "",
      ferramentasGestao: "",
      principaisDesafios: [],
      desafiosOutro: "",
    });
    setLogoFile(null);
    setApresentacaoFile(null);
    
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      (input as HTMLInputElement).value = '';
    });
  };

  return (
    <>
      <SuccessModal 
        open={showSuccessModal}
        onClose={handleCloseModal}
        title="Cadastro realizado com sucesso!"
        message="Obrigado por se cadastrar no GRIFOBOARD MARKETPLACE. Em breve entraremos em contato."
      />
      
      <FormTemplate 
        title="GRIFOBOARD MARKETPLACE" 
        subtitle="Formulário de cadastro para empresas construtoras"
      >
        <form className="space-y-8">
          {/* Section 1: Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">1. Informações da Empresa</h3>
            
            <div>
              <Label htmlFor="nomeEmpresa">Nome da empresa *</Label>
              <Input
                id="nomeEmpresa"
                value={formData.nomeEmpresa}
                onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="site">Site da empresa</Label>
              <Input
                id="site"
                type="url"
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado *</Label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="anoFundacao">Ano de fundação *</Label>
              <Input
                id="anoFundacao"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.anoFundacao}
                onChange={(e) => setFormData({ ...formData, anoFundacao: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Tamanho da empresa *</Label>
              <div className="space-y-2 mt-2">
                {[
                  { value: "Micro (1–9 colaboradores)", label: "Micro (1–9 colaboradores)" },
                  { value: "Pequena (10–49 colaboradores)", label: "Pequena (10–49 colaboradores)" },
                  { value: "Média (50–99 colaboradores)", label: "Média (50–99 colaboradores)" },
                  { value: "Grande (100+ colaboradores)", label: "Grande (100+ colaboradores)" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`tamanho-${option.value}`}
                      name="tamanhoEmpresa"
                      value={option.value}
                      checked={formData.tamanhoEmpresa === option.value}
                      onChange={(e) => setFormData({ ...formData, tamanhoEmpresa: e.target.value })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`tamanho-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Main Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">2. Contato Principal</h3>
            
            <div>
              <Label htmlFor="nomeContato">Nome completo *</Label>
              <Input
                id="nomeContato"
                value={formData.nomeContato}
                onChange={(e) => setFormData({ ...formData, nomeContato: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="cargoContato">Cargo *</Label>
              <Input
                id="cargoContato"
                value={formData.cargoContato}
                onChange={(e) => setFormData({ ...formData, cargoContato: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="whatsappContato">WhatsApp *</Label>
              <Input
                id="whatsappContato"
                type="tel"
                value={formData.whatsappContato}
                onChange={(e) => setFormData({ ...formData, whatsappContato: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="emailContato">E-mail *</Label>
              <div className="relative">
                <Input
                  id="emailContato"
                  type="email"
                  value={formData.emailContato}
                  onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
                  required
                  className={cn(emailError && "border-red-500 focus:border-red-500")}
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

          {/* Section 3: Operational Structure */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">3. Estrutura Operacional</h3>
            
            <div>
              <Label>Quantas obras estão em andamento atualmente? *</Label>
              <div className="space-y-2 mt-2">
                {["0–2", "3–5", "6–10", "11–20", "21+"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`obras-${option}`}
                      name="obrasAndamento"
                      value={option}
                      checked={formData.obrasAndamento === option}
                      onChange={(e) => setFormData({ ...formData, obrasAndamento: e.target.value })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`obras-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Tipos de obras que executam *</Label>
              <div className="space-y-2 mt-2">
                {[
                  "Residencial",
                  "Comercial",
                  "Industrial",
                  "Reformas",
                  "Obras públicas",
                  "Outras"
                ].map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tipo-${tipo}`}
                      checked={formData.tiposObras.includes(tipo)}
                      onCheckedChange={() => handleCheckboxChange('tiposObras', tipo)}
                    />
                    <Label htmlFor={`tipo-${tipo}`} className="font-normal cursor-pointer">{tipo}</Label>
                  </div>
                ))}
              </div>
              {formData.tiposObras.includes("Outras") && (
                <Input
                  className="mt-2"
                  placeholder="Especifique outras"
                  value={formData.tiposObrasOutro}
                  onChange={(e) => setFormData({ ...formData, tiposObrasOutro: e.target.value })}
                />
              )}
            </div>

            <div>
              <Label>Ticket médio das obras *</Label>
              <div className="space-y-2 mt-2">
                {[
                  "Até R$ 200 mil",
                  "R$ 200 mil – R$ 800 mil",
                  "R$ 800 mil – R$ 2 milhões",
                  "R$ 2 – 5 milhões",
                  "Acima de R$ 5 milhões"
                ].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`ticket-${option}`}
                      name="ticketMedio"
                      value={option}
                      checked={formData.ticketMedio === option}
                      onChange={(e) => setFormData({ ...formData, ticketMedio: e.target.value })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`ticket-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Current Planning Process */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">4. Processo Atual de Planejamento</h3>
            
            <div>
              <Label>Como vocês fazem o planejamento de curto prazo hoje? *</Label>
              <div className="space-y-2 mt-2">
                {[
                  "Planilhas",
                  "WhatsApp",
                  "Software de gestão",
                  "Não possuem processo definido"
                ].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`planejamento-${option}`}
                      name="planejamentoCurtoPrazo"
                      value={option}
                      checked={formData.planejamentoCurtoPrazo === option}
                      onChange={(e) => setFormData({ ...formData, planejamentoCurtoPrazo: e.target.value })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`planejamento-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="ferramentasGestao">Quais ferramentas de gestão vocês utilizam atualmente?</Label>
              <Textarea
                id="ferramentasGestao"
                value={formData.ferramentasGestao}
                onChange={(e) => setFormData({ ...formData, ferramentasGestao: e.target.value })}
                placeholder="Descreva as ferramentas utilizadas"
              />
            </div>
          </div>

          {/* Section 5: Main Challenges */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">5. Principais desafios nas obras</h3>
            
            <div className="space-y-2">
              {[
                "Atraso de etapas",
                "Falta de alinhamento com equipes",
                "Problemas de comunicação",
                "Falta de controle de materiais",
                "Falta de controle de mão de obra",
                "Problemas com fornecedores",
                "Necessidade de replanejamento constante",
                "Outro"
              ].map((desafio) => (
                <div key={desafio} className="flex items-center space-x-2">
                  <Checkbox
                    id={`desafio-${desafio}`}
                    checked={formData.principaisDesafios.includes(desafio)}
                    onCheckedChange={() => handleCheckboxChange('principaisDesafios', desafio)}
                  />
                  <Label htmlFor={`desafio-${desafio}`} className="font-normal cursor-pointer">{desafio}</Label>
                </div>
              ))}
            </div>
            {formData.principaisDesafios.includes("Outro") && (
              <Input
                className="mt-2"
                placeholder="Especifique outro desafio"
                value={formData.desafiosOutro}
                onChange={(e) => setFormData({ ...formData, desafiosOutro: e.target.value })}
              />
            )}
          </div>

          {/* Section 6: Complementary Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">6. Documentos / Informações Complementares (opcional)</h3>
            
            <div>
              <Label htmlFor="logo">Enviar logo da empresa</Label>
              <p className="text-xs text-muted-foreground mb-2">Formatos aceitos: JPG, PNG (máx. 5MB)</p>
              <FileUploadButton
                id="logo"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
                      e.target.value = '';
                      return;
                    }
                    setLogoFile(file);
                  }
                }}
                selectedFiles={logoFile?.name || null}
              />
            </div>

            <div>
              <Label htmlFor="apresentacao">Enviar apresentação institucional (PDF)</Label>
              <p className="text-xs text-muted-foreground mb-2">Formato aceito: PDF, DOCX (máx. 5MB)</p>
              <FileUploadButton
                id="apresentacao"
                accept=".pdf,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
                      e.target.value = '';
                      return;
                    }
                    setApresentacaoFile(file);
                  }
                }}
                selectedFiles={apresentacaoFile?.name || null}
              />
              {apresentacaoFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Arquivo selecionado: {apresentacaoFile.name} ({(apresentacaoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting || uploadingFiles} 
            className="w-full"
          >
            {uploadingFiles ? "Fazendo upload de arquivos..." : isSubmitting ? "Enviando..." : "Enviar Cadastro"}
          </Button>
        </form>
      </FormTemplate>
    </>
  );
};

export default Empresas;