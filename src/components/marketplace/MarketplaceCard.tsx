import { MapPin, Star, Building2, User, Truck, Phone, Mail, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/utils/formatPhone";
import { supabase } from "@/integrations/supabase/client";
import seloGrifoImg from "@/assets/selo-grifo-strike.png";
import { motion } from "framer-motion";

type TargetType = "empresa" | "profissional" | "fornecedor";

interface MarketplaceItem {
  id: string;
  type: TargetType;
  name: string;
  location: string;
  categories?: string[];
  rating: number;
  reviewCount: number;
  data: any;
}

interface MarketplaceCardProps {
  item: MarketplaceItem;
  onClick: () => void;
}

export const MarketplaceCard = ({ item, onClick }: MarketplaceCardProps) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case "empresa":
        return <Building2 className="h-5 w-5" />;
      case "profissional":
        return <User className="h-5 w-5" />;
      case "fornecedor":
        return <Truck className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case "empresa":
        return "bg-blue-500/10 text-blue-600";
      case "profissional":
        return "bg-emerald-500/10 text-emerald-600";
      case "fornecedor":
        return "bg-amber-500/10 text-amber-600";
    }
  };

  // Info específico por tipo
  const getExtraInfo = () => {
    if (item.type === "profissional") {
      const funcao = item.data.funcao_principal;
      const outro = item.data.funcao_principal_outro;
      return funcao === "Outro" && outro ? outro : funcao;
    }
    if (item.type === "fornecedor") {
      // Tipos de atuação
      let tipos: string[] = [];
      if (Array.isArray(item.data.tipos_atuacao)) {
        tipos = item.data.tipos_atuacao;
      }
      if (item.data.tipo_atuacao_outro) {
        tipos = tipos.filter(t => t !== "Outro");
        tipos.push(item.data.tipo_atuacao_outro);
      }
      return tipos.length > 0 ? tipos.slice(0, 2).join(", ") + (tipos.length > 2 ? "..." : "") : null;
    }
    if (item.type === "empresa") {
      return item.data.tamanho_empresa ? `${item.data.tamanho_empresa}` : null;
    }
    return null;
  };

  const getPhone = () => {
    if (item.type === "empresa") {
      return formatPhoneNumber(item.data.whatsapp_contato);
    }
    return formatPhoneNumber(item.data.telefone);
  };

  const getEmail = () => {
    if (item.type === "empresa") {
      return item.data.email_contato;
    }
    return item.data.email;
  };

  // Categorias com "outro"
  const getCategories = () => {
    let cats: string[] = item.categories || [];
    
    if (item.type === "fornecedor" && item.data.categorias_outro) {
      cats = cats.filter(c => c !== "Outro");
      cats.push(item.data.categorias_outro);
    }
    if (item.type === "profissional" && item.data.especialidades_outro) {
      cats = cats.filter(c => c !== "Outro");
      cats.push(item.data.especialidades_outro);
    }
    if (item.type === "empresa" && item.data.tipos_obras_outro) {
      cats = cats.filter(c => c !== "Outro");
      cats.push(item.data.tipos_obras_outro);
    }
    
    return cats;
  };

  const getLogoUrl = () => {
    const path = item.data.logo_path;
    if (!path) return null;
    if (path.startsWith("http")) return path;

    const bucketName = item.type === "empresa" 
      ? "formularios-empresas" 
      : item.type === "profissional" 
        ? "formularios-profissionais" 
        : "formularios-fornecedores";

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  };

  const hasSelo = item.data.selo_grifo === true;
  const extraInfo = getExtraInfo();
  const phone = getPhone();
  const email = getEmail();
  const logoUrl = getLogoUrl();
  const categories = getCategories();

  return (
    <Card
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-border/50 relative ${
        hasSelo ? "ring-2 ring-[#1a3045]/40 shadow-[0_0_20px_-5px_rgba(26,48,69,0.4)]" : ""
      }`}
      onClick={onClick}
    >
      {/* Selo Grifo Badge - Enhanced UI with dark blue theme */}
      {hasSelo && (
        <motion.div 
          className="absolute top-1 left-1 z-20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Glow effect - dark blue */}
          <div className="absolute inset-2 bg-gradient-to-br from-[#1a3045] to-[#2d4a63] blur-md opacity-50 rounded-full" />
          
          {/* Animated ring - dark blue */}
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-[#1a3045]/40"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 0, 0.4]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Main badge - larger and more visible */}
          <img 
            src={seloGrifoImg} 
            alt="Selo Grifo de Aprovação" 
            className="relative w-16 h-16 drop-shadow-xl object-contain"
          />
          
          {/* Tooltip on hover */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
            <div className="bg-gradient-to-r from-[#112131] to-[#1a3045] text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg flex items-center gap-1">
              <Award className="h-3 w-3 text-[#4a90b8]" />
              Selo de Aprovação Grifo
            </div>
          </div>
        </motion.div>
      )}

      {/* Header with gradient */}
      <div
        className={`h-24 relative ${
          item.type === "empresa"
            ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10"
            : item.type === "profissional"
              ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10"
              : "bg-gradient-to-br from-amber-500/20 to-amber-600/10"
        }`}
      >
        <div className="absolute top-3 right-3">
          {logoUrl ? (
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
              <img
                src={logoUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className={`p-2 rounded-full ${getTypeColor()}`}>{getTypeIcon()}</div>
          )}
        </div>

        {/* Rating badge */}
        {item.reviewCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({item.reviewCount})</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{item.location}</span>
        </div>

        {/* Phone */}
        {phone && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{phone}</span>
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1 text-xs">{email}</span>
          </div>
        )}

        {/* Extra info (Tipos de Atuação / Função / Tamanho) */}
        {extraInfo && (
          <p className="text-xs text-muted-foreground mb-2 font-medium px-2 py-1 bg-muted/50 rounded-md inline-block line-clamp-1">
            {extraInfo}
          </p>
        )}

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {categories.slice(0, 2).map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] font-normal px-1.5 h-5">
                {cat}
              </Badge>
            ))}
            {categories.length > 2 && (
              <Badge variant="outline" className="text-[10px] font-normal px-1.5 h-5">
                +{categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* No reviews indicator */}
        {item.reviewCount === 0 && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-3">
            <Star className="h-3 w-3 opacity-50" />
            <span className="opacity-70">Novo no Grifo</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
