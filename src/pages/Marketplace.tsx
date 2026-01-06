import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Loader2,
  Building2,
  User,
  Truck,
  Sparkles,
  Users,
  TrendingUp,
  Shield,
  Award,
  Briefcase, // Importado para o ícone do novo filtro
  Check,
} from "lucide-react";
import seloGrifoImg from "@/assets/selo-grifo-strike.png";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { MarketplaceDetailModal } from "@/components/marketplace/MarketplaceDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Definição unificada do Item
interface MarketplaceItem {
  id: string;
  type: "empresa" | "profissional" | "fornecedor";
  name: string;
  location: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  data: any;
}

export default function Marketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");

  // Filtros
  const [filterSeloGrifo, setFilterSeloGrifo] = useState(false);
  const [filterJaTrabalhou, setFilterJaTrabalhou] = useState(false); // Novo Estado

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    setLoading(true);
    try {
      // Usar views seguras que não expõem dados sensíveis (CPF, email, telefone)
      const { data: profs, error: errProfs } = await supabase.from("marketplace_profissionais").select("*");
      const { data: empresas, error: errEmp } = await supabase.from("marketplace_empresas").select("*");
      const { data: fornecedores, error: errForn } = await supabase.from("marketplace_fornecedores").select("*");

      if (errProfs || errEmp || errForn) {
        console.error("Erro ao buscar dados:", errProfs, errEmp, errForn);
        toast.error("Erro ao carregar o marketplace.");
        return;
      }

      const allItems: MarketplaceItem[] = [];

      profs?.forEach((p) => {
        let cats: string[] = [];
        if (Array.isArray(p.especialidades)) cats = p.especialidades;
        else if (typeof p.especialidades === "string") {
          try {
            cats = JSON.parse(p.especialidades);
          } catch {
            cats = [p.especialidades];
          }
        } else {
          cats = [p.funcao_principal];
        }

        allItems.push({
          id: p.id,
          type: "profissional",
          name: p.nome_completo || "Sem Nome",
          location: p.cidade && p.estado ? `${p.cidade} - ${p.estado}` : "Localização não inf.",
          categories: cats,
          rating: 5.0,
          reviewCount: 0,
          data: p,
        });
      });

      empresas?.forEach((e) => {
        let cats: string[] = [];
        if (Array.isArray(e.tipos_obras)) cats = e.tipos_obras;
        else if (typeof e.tipos_obras === "string") {
          try {
            cats = JSON.parse(e.tipos_obras);
          } catch {
            cats = [e.tipos_obras];
          }
        }

        allItems.push({
          id: e.id,
          type: "empresa",
          name: e.nome_empresa || "Empresa Sem Nome",
          location: e.cidade && e.estado ? `${e.cidade} - ${e.estado}` : "Localização não inf.",
          categories: cats,
          rating: 5.0,
          reviewCount: 0,
          data: e,
        });
      });

      fornecedores?.forEach((f) => {
        let cats: string[] = [];
        if (Array.isArray(f.categorias_atendidas)) cats = f.categorias_atendidas;
        else if (typeof f.categorias_atendidas === "string") {
          try {
            cats = JSON.parse(f.categorias_atendidas);
          } catch {
            cats = [f.categorias_atendidas];
          }
        }

        allItems.push({
          id: f.id,
          type: "fornecedor",
          name: f.nome_empresa || "Fornecedor Sem Nome",
          location: f.cidade && f.estado ? `${f.cidade} - ${f.estado}` : "Localização não inf.",
          categories: cats,
          rating: 5.0,
          reviewCount: 0,
          data: f,
        });
      });

      setItems(allItems);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categories.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "profissionais" && item.type === "profissional") ||
      (activeTab === "empresas" && item.type === "empresa") ||
      (activeTab === "fornecedores" && item.type === "fornecedor");

    const matchesSelo = !filterSeloGrifo || item.data.selo_grifo === true;

    // Novo Filtro
    const matchesJaTrabalhou = !filterJaTrabalhou || item.data.ja_trabalhou_com_grifo === true;

    return matchesSearch && matchesTab && matchesSelo && matchesJaTrabalhou;
  });

  const stats = {
    profissionais: items.filter((i) => i.type === "profissional").length,
    empresas: items.filter((i) => i.type === "empresa").length,
    fornecedores: items.filter((i) => i.type === "fornecedor").length,
    seloGrifo: items.filter((i) => i.data.selo_grifo === true).length,
    // Estatística opcional para o novo filtro
    jaTrabalhou: items.filter((i) => i.data.ja_trabalhou_com_grifo === true).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#112131] via-[#1a3045] to-[#112131]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A47528]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-[#A47528]/20 text-[#A47528] border-[#A47528]/30 hover:bg-[#A47528]/30 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Parceiros Homologados
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Marketplace
              <span className="text-[#A47528]"> Grifo</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Encontre os melhores profissionais, empresas e fornecedores verificados para sua obra.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#A47528] via-amber-500 to-[#A47528] rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                <div className="relative flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome, cidade ou especialidade..."
                      className="pl-12 h-14 bg-white/95 backdrop-blur border-0 shadow-xl text-base rounded-xl focus-visible:ring-2 focus-visible:ring-[#A47528]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button className="h-14 px-6 bg-[#A47528] hover:bg-[#8B6420] text-white rounded-xl shadow-xl gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtros</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="flex items-center gap-3 text-white/80">
                <div className="p-2.5 bg-emerald-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white">{stats.profissionais}</p>
                  <p className="text-xs text-slate-400">Profissionais</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="p-2.5 bg-blue-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white">{stats.empresas}</p>
                  <p className="text-xs text-slate-400">Empresas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="p-2.5 bg-amber-500/20 rounded-lg">
                  <Truck className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white">{stats.fornecedores}</p>
                  <p className="text-xs text-slate-400">Fornecedores</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Tabs */}
        <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="bg-white p-1.5 border border-slate-200 shadow-sm rounded-xl h-auto flex-wrap">
                <TabsTrigger
                  value="todos"
                  className="h-10 px-5 rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all"
                >
                  Todos
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-slate-100 text-slate-600 data-[state=active]:bg-white/20 data-[state=active]:text-white"
                  >
                    {items.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="profissionais"
                  className="h-10 px-5 rounded-lg gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all"
                >
                  <User className="h-4 w-4" />
                  Profissionais
                </TabsTrigger>
                <TabsTrigger
                  value="empresas"
                  className="h-10 px-5 rounded-lg gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all"
                >
                  <Building2 className="h-4 w-4" />
                  Empresas
                </TabsTrigger>
                <TabsTrigger
                  value="fornecedores"
                  className="h-10 px-5 rounded-lg gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all"
                >
                  <Truck className="h-4 w-4" />
                  Fornecedores
                </TabsTrigger>
              </TabsList>

              <p className="text-sm text-slate-500">
                {filteredItems.length} {filteredItems.length === 1 ? "resultado" : "resultados"} encontrados
              </p>
            </div>

            {/* FILTROS ADICIONAIS */}
            <div className="flex flex-wrap items-center gap-3">
              {/* FILTRO 1: Selo Grifo */}
              <button
                onClick={() => setFilterSeloGrifo(!filterSeloGrifo)}
                className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ${
                  filterSeloGrifo
                    ? "bg-gradient-to-r from-[#1a3045]/10 to-[#2d4a63]/10 border-[#1a3045] shadow-[0_0_20px_-5px_rgba(26,48,69,0.5)]"
                    : "bg-white border-slate-200 hover:border-[#1a3045]/50 hover:shadow-md"
                }`}
              >
                {filterSeloGrifo && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1a3045]/20 to-[#2d4a63]/20 blur-xl rounded-xl -z-10" />
                )}

                <div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 overflow-hidden ${
                    filterSeloGrifo
                      ? "bg-gradient-to-br from-[#1a3045]/20 to-[#2d4a63]/20 shadow-lg"
                      : "bg-slate-100 group-hover:bg-[#1a3045]/10"
                  }`}
                >
                  <img
                    src={seloGrifoImg}
                    alt="Selo Grifo"
                    className={`w-11 h-11 object-contain transition-all duration-300 ${
                      filterSeloGrifo ? "drop-shadow-md scale-105" : "opacity-80 group-hover:opacity-100"
                    }`}
                  />
                </div>

                <div className="flex flex-col items-start text-left">
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      filterSeloGrifo ? "text-[#1a3045]" : "text-slate-700"
                    }`}
                  >
                    Selo de Aprovação Grifo
                  </span>
                  <span className="text-[10px] text-slate-500">{stats.seloGrifo} parceiros certificados</span>
                </div>

                {filterSeloGrifo && (
                  <div className="ml-2 flex items-center justify-center w-5 h-5 rounded-full bg-[#1a3045] text-white">
                    <Award className="h-3 w-3" />
                  </div>
                )}
              </button>

              {/* FILTRO 2: Já Trabalhou com a Grifo */}
              <button
                onClick={() => setFilterJaTrabalhou(!filterJaTrabalhou)}
                className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ${
                  filterJaTrabalhou
                    ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-600 shadow-md"
                    : "bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-md"
                }`}
              >
                {filterJaTrabalhou && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-xl rounded-xl -z-10" />
                )}

                <div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                    filterJaTrabalhou
                      ? "bg-emerald-100 text-emerald-700 shadow-lg"
                      : "bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                </div>

                <div className="flex flex-col items-start text-left">
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      filterJaTrabalhou ? "text-emerald-700" : "text-slate-700"
                    }`}
                  >
                    Já Trabalhou Conosco
                  </span>
                  <span className="text-[10px] text-slate-500">{stats.jaTrabalhou} parceiros verificados</span>
                </div>

                {filterJaTrabalhou && (
                  <div className="ml-2 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-32">
                <Loader2 className="h-12 w-12 animate-spin text-[#A47528] mb-4" />
                <p className="text-slate-500">Carregando parceiros...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Não encontramos parceiros com os filtros selecionados. Tente ajustar sua busca.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveTab("todos");
                    setFilterSeloGrifo(false);
                    setFilterJaTrabalhou(false); // Reseta também o novo filtro
                  }}
                  className="rounded-full px-6"
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <MarketplaceCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Trust Badges */}
        <div className="mt-16 pt-12 border-t border-slate-100">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Parceiros Verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Avaliações Reais</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Qualidade Garantida</span>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Detalhes */}
      <MarketplaceDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReviewSubmitted={fetchMarketplaceData}
      />
    </div>
  );
}
