import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/utils/formatPhone";
import {
  MapPin,
  Star,
  Building2,
  User,
  Truck,
  Phone,
  Briefcase,
  Send,
  Edit2,
  Trash2,
  FileText,
  Image,
  Download,
  ArrowLeft,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_email?: string;
}

interface MarketplaceDetailModalProps {
  item: MarketplaceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

// Função auxiliar para selecionar o bucket correto
const getBucketName = (type: string) => {
  switch (type) {
    case "empresa":
      return "formularios-empresas";
    case "profissional":
      return "formularios-profissionais";
    case "fornecedor":
      return "formularios-fornecedores";
    default:
      return "public-uploads";
  }
};

export const MarketplaceDetailModal = ({ item, isOpen, onClose, onReviewSubmitted }: MarketplaceDetailModalProps) => {
  const { userSession } = useAuth();
  const user = userSession?.user;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      fetchReviews();
    }
  }, [item, isOpen]);

  const fetchReviews = async () => {
    if (!item) return;

    const { data, error } = await supabase
      .from("marketplace_reviews")
      .select("*")
      .eq("target_type", item.type)
      .eq("target_id", item.id)
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data);
      const myReview = data.find((r) => r.user_id === user?.id);
      if (myReview) {
        setExistingReview(myReview);
        setMyRating(myReview.rating);
        setMyComment(myReview.comment || "");
      } else {
        setExistingReview(null);
        setMyRating(0);
        setMyComment("");
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!item || !user || myRating === 0) {
      toast.error("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        const { error } = await supabase
          .from("marketplace_reviews")
          .update({
            rating: myRating,
            comment: myComment || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id);

        if (error) throw error;
        toast.success("Avaliação atualizada!");
      } else {
        const { error } = await supabase.from("marketplace_reviews").insert({
          user_id: user.id,
          target_type: item.type,
          target_id: item.id,
          rating: myRating,
          comment: myComment || null,
        });

        if (error) throw error;
        toast.success("Avaliação enviada!");
      }

      setIsEditing(false);
      fetchReviews();
      onReviewSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("Erro ao enviar avaliação");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;

    try {
      const { error } = await supabase.from("marketplace_reviews").delete().eq("id", existingReview.id);

      if (error) throw error;

      toast.success("Avaliação removida");
      setExistingReview(null);
      setMyRating(0);
      setMyComment("");
      fetchReviews();
      onReviewSubmitted();
    } catch (error) {
      toast.error("Erro ao remover avaliação");
    }
  };

  if (!item) return null;

  // Lógica de URL da imagem com Bucket Correto
  const getLogoUrl = () => {
    const path = item.data.logo_path;
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const bucket = getBucketName(item.type);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const logoUrl = getLogoUrl();

  const getTypeLabel = () => {
    switch (item.type) {
      case "empresa":
        return "Empresa";
      case "profissional":
        return "Profissional";
      case "fornecedor":
        return "Fornecedor";
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case "empresa":
        return <Building2 className="h-10 w-10" />;
      case "profissional":
        return <User className="h-10 w-10" />;
      case "fornecedor":
        return <Truck className="h-10 w-10" />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case "empresa":
        return "from-blue-500 to-blue-600";
      case "profissional":
        return "from-emerald-500 to-emerald-600";
      case "fornecedor":
        return "from-amber-500 to-amber-600";
    }
  };

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden border-0 rounded-2xl shadow-2xl bg-white flex flex-col">
        {/* Header with gradient */}
        <div className={`relative bg-gradient-to-r ${getTypeColor()} p-6 pb-24`}>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute top-4 right-16 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
            <span className="text-white font-semibold">{avgRating}</span>
            <span className="text-white/70 text-sm">({reviews.length})</span>
          </div>
        </div>

        <div className="relative -mt-20 mx-6 mb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar / Logo with Selo */}
            <div className="relative">
              <div className="rounded-2xl p-1 bg-white shadow-xl">
                {logoUrl ? (
                  <img src={logoUrl} alt={item.name} className="w-32 h-32 rounded-xl object-cover bg-slate-100" />
                ) : (
                  <div
                    className={`w-32 h-32 rounded-xl bg-gradient-to-br ${getTypeColor()} flex items-center justify-center text-white`}
                  >
                    {getTypeIcon()}
                  </div>
                )}
              </div>
              
              {/* Selo Grifo Badge */}
              {item.data.selo_grifo === true && (
                <motion.div 
                  className="absolute -top-3 -left-3 z-10"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-2 bg-gradient-to-br from-[#1a3045] to-[#2d4a63] blur-md opacity-50 rounded-full" />
                  
                  {/* Animated ring */}
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
                  
                  <img 
                    src={seloGrifoImg} 
                    alt="Selo Grifo de Aprovação" 
                    className="relative w-16 h-16 drop-shadow-xl object-contain"
                  />
                </motion.div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary">
                  {getTypeLabel()}
                </Badge>
                {item.data.selo_grifo === true && (
                  <Badge className="bg-gradient-to-r from-[#1a3045] to-[#2d4a63] text-white border-0 gap-1">
                    <Award className="h-3 w-3" />
                    Selo de Aprovação
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-bold text-slate-900 truncate max-w-lg">{item.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-slate-500">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{item.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="flex-1 flex flex-col px-6 mt-4 min-h-0 overflow-hidden">
          <TabsList className="w-full justify-start gap-2 bg-transparent p-0 h-auto border-b border-slate-100 pb-1 mb-4 overflow-x-auto flex-shrink-0">
            <TabsTrigger
              value="info"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none"
            >
              Informações
            </TabsTrigger>
            <TabsTrigger
              value="fotos"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none"
            >
              Fotos
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none"
            >
              Documentos
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 bg-transparent shadow-none"
            >
              Avaliações ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-auto -mx-6 px-6 pb-6">
            <TabsContent value="info" className="mt-0 space-y-0">
              <DetailInfo item={item} />
            </TabsContent>

            <TabsContent value="fotos" className="mt-0">
              <PhotosSection item={item} />
            </TabsContent>

            <TabsContent value="docs" className="mt-0">
              <DocumentsSection item={item} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              {/* Review content */}
              <div className="bg-muted/30 rounded-2xl p-5 mb-6 border">
                <h4 className="font-semibold mb-4">
                  {existingReview && !isEditing ? "Sua avaliação" : "Deixe sua avaliação"}
                </h4>

                {existingReview && !isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${star <= existingReview.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                    {existingReview.comment && (
                      <p className="text-sm text-muted-foreground">{existingReview.comment}</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteReview}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMyRating(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="p-1 transition-transform hover:scale-125"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${star <= (hoveredStar || myRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-muted-foreground/50"}`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Escreva um comentário (opcional)"
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      rows={3}
                      className="resize-none rounded-xl"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={myRating === 0 || isSubmitting}
                        className="rounded-full"
                      >
                        <Send className="h-4 w-4 mr-2" /> {existingReview ? "Atualizar" : "Enviar Avaliação"}
                      </Button>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            setMyRating(existingReview?.rating || 0);
                            setMyComment(existingReview?.comment || "");
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Other Reviews List */}
              <div className="space-y-4">
                <h4 className="font-semibold">Todas as avaliações</h4>
                {reviews.filter((r) => r.user_id !== user?.id).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma outra avaliação ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews
                      .filter((r) => r.user_id !== user?.id)
                      .map((review) => (
                        <div key={review.id} className="bg-muted/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(review.created_at), "dd MMM yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const PhotosSection = ({ item }: { item: MarketplaceItem }) => {
  const { data } = item;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Mapeamento corrigido para incluir fotos_trabalhos_path para fornecedores
  const fields =
    item.type === "profissional"
      ? ["fotos_trabalhos_path"]
      : item.type === "fornecedor"
        ? ["portfolio_path", "fotos_trabalhos_path"] // AGORA LÊ A COLUNA NOVA
        : [];

  // Função auxiliar com bucket dinâmico
  const getPublicUrl = (path: string) => {
    const bucket = getBucketName(item.type);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData?.publicUrl || "";
  };

  const isImageFile = (path: string) => {
    const ext = path.toLowerCase().split(".").pop();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  const images: { label: string; url: string }[] = [];

  // Parse JSON strings
  fields.forEach((field) => {
    const rawValue = data[field];
    if (!rawValue) return;

    let paths: string[] = [];
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) paths = parsed;
      else paths = [rawValue];
    } catch {
      paths = rawValue.split(",").map((p: string) => p.trim());
    }

    paths.forEach((path) => {
      const url = path.startsWith("http") ? path : getPublicUrl(path);
      if (isImageFile(path) || path.startsWith("http")) {
        images.push({ label: "Galeria", url });
      }
    });
  });

  if (images.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-2xl">
        <Image className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <p className="font-medium">Nenhuma foto na galeria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-[400px] pr-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square bg-black/5 rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => {
                setCurrentImageIndex(idx);
                setIsLightboxOpen(true);
              }}
            >
              <img
                src={img.url}
                alt="Gallery"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" && currentImageIndex > 0) {
              setCurrentImageIndex(prev => prev - 1);
            } else if (e.key === "ArrowRight" && currentImageIndex < images.length - 1) {
              setCurrentImageIndex(prev => prev + 1);
            } else if (e.key === "Escape") {
              setIsLightboxOpen(false);
            }
          }}
          tabIndex={0}
          ref={(el) => el?.focus()}
        >
          {/* Botão Fechar */}
          <button 
            className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors z-10"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>
          
          {/* Navegação Anterior */}
          {currentImageIndex > 0 && (
            <button 
              className="absolute left-4 text-white bg-black/50 p-3 rounded-full hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev - 1); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          
          {/* Imagem */}
          <img 
            src={images[currentImageIndex].url} 
            alt={`Foto ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Navegação Próximo */}
          {currentImageIndex < images.length - 1 && (
            <button 
              className="absolute right-4 text-white bg-black/50 p-3 rounded-full hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev + 1); }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
          
          {/* Contador de fotos */}
          {images.length > 1 && (
            <div className="absolute bottom-6 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DocumentsSection = ({ item }: { item: MarketplaceItem }) => {
  const { data } = item;

  const getPublicUrl = (path: string) => {
    const bucket = getBucketName(item.type);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData?.publicUrl || "";
  };

  const docs: { label: string; url: string }[] = [];

  const fields =
    item.type === "profissional"
      ? ["curriculo_path", "certificacoes_path"]
      : item.type === "empresa"
        ? ["apresentacao_path"]
        : [];

  fields.forEach((field) => {
    const rawValue = data[field];
    if (!rawValue) return;

    let paths: string[] = [];
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) paths = parsed;
      else paths = [rawValue];
    } catch {
      paths = rawValue.split(",").map((p: string) => p.trim());
    }

    paths.forEach((path, idx) => {
      const url = path.startsWith("http") ? path : getPublicUrl(path);
      const label = field.includes("curriculo") ? "Currículo" : field.includes("cert") ? "Certificado" : "Apresentação";
      docs.push({ label: `${label} ${idx + 1}`, url });
    });
  });

  if (docs.length === 0) return <div className="text-center py-10 text-muted-foreground">Nenhum documento</div>;

  return (
    <div className="grid gap-3">
      {docs.map((doc, idx) => (
        <a
          key={idx}
          href={doc.url}
          target="_blank"
          className="flex items-center gap-4 p-4 rounded-xl border hover:bg-slate-50 transition-colors"
        >
          <FileText className="h-8 w-8 text-primary/50" />
          <div className="flex-1">
            <p className="font-medium">{doc.label}</p>
            <p className="text-xs text-muted-foreground">Clique para abrir</p>
          </div>
          <Download className="h-4 w-4 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
};

// Função para formatar valores técnicos em texto legível
const formatValue = (value: string | null | undefined): string => {
  if (!value) return "-";
  const mappings: Record<string, string> = {
    // Ticket médio
    "ate-50000": "Até R$ 50.000",
    "50000-200000": "R$ 50.000 - R$ 200.000",
    "200000-500000": "R$ 200.000 - R$ 500.000",
    "500000-1000000": "R$ 500.000 - R$ 1.000.000",
    "acima-1000000": "Acima de R$ 1.000.000",
    "ate-200k": "Até R$ 200.000",
    "200k-800k": "R$ 200.000 - R$ 800.000",
    "800k-2m": "R$ 800.000 - R$ 2.000.000",
    "2m-5m": "R$ 2.000.000 - R$ 5.000.000",
    "acima-5m": "Acima de R$ 5.000.000",
    // Capacidade/Obras
    "1-2": "1 a 2 obras",
    "3-5": "3 a 5 obras",
    "6-10": "6 a 10 obras",
    "11-20": "11 a 20 obras",
    "acima-20": "Mais de 20 obras",
    "0-2": "0 a 2 obras",
    "21-mais": "Mais de 21 obras",
    // Tempo de atuação/experiência
    "menos-1-ano": "Menos de 1 ano",
    "1-3-anos": "1 a 3 anos",
    "3-5-anos": "3 a 5 anos",
    "5-10-anos": "5 a 10 anos",
    "mais-10-anos": "Mais de 10 anos",
    "5-mais-anos": "Mais de 5 anos",
    // Disponibilidade
    "imediata": "Imediata",
    "15-dias": "15 dias",
    "30-dias": "30 dias",
    "apenas-contrato": "Apenas por contrato",
    // Modalidade
    "clt": "CLT",
    "pj": "PJ",
    "autonomo-diaria": "Autônomo/Diária",
    "freelance-projeto": "Freelance por projeto",
    // Equipamentos
    "sim": "Sim",
    "nao": "Não",
    "parcialmente": "Parcialmente",
    // Tamanho empresa
    "micro-1-9": "Micro (1-9 funcionários)",
    "pequena-10-49": "Pequena (10-49 funcionários)",
    "media-50-99": "Média (50-99 funcionários)",
    "grande-100-mais": "Grande (100+ funcionários)",
    // Planejamento
    "planilhas": "Planilhas",
    "whatsapp": "WhatsApp",
    "software-gestao": "Software de gestão",
    "sem-processo": "Sem processo definido",
  };
  return mappings[value] || value;
};

// Função para formatar arrays com campo "Outro"
const formatArrayWithOutro = (arr: string[] | null | undefined, outro: string | null | undefined): string => {
  if (!arr || arr.length === 0) return "-";
  const items = [...arr.filter(i => i && i !== "Outro" && i !== "outro")];
  if (outro) items.push(outro);
  return items.length > 0 ? items.join(", ") : "-";
};

const DetailInfo = ({ item }: { item: MarketplaceItem }) => {
  const { data } = item;

  // Seção de informação reutilizável
  const InfoSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-slate-50 rounded-2xl p-5 border">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        {icon} {title}
      </h4>
      {children}
    </div>
  );

  const InfoItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );

  // ========== FORNECEDOR ==========
  if (item.type === "fornecedor") {
    return (
      <div className="grid gap-6">
        {/* Contatos */}
        <InfoSection title="Contatos" icon={<Phone className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Telefone" value={data.telefone ? formatPhoneNumber(data.telefone) : null} />
            <InfoItem label="Email" value={data.email} />
            <InfoItem label="Site" value={data.site} />
            <InfoItem label="Responsável" value={data.nome_responsavel} />
          </div>
        </InfoSection>

        {/* Dados da Empresa */}
        <InfoSection title="Dados da Empresa" icon={<Building2 className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Nome" value={data.nome_empresa} />
            <InfoItem label="CNPJ/CPF" value={data.cnpj_cpf} />
            <InfoItem label="Localização" value={`${data.cidade}, ${data.estado}`} />
            <InfoItem label="Tempo de Atuação" value={formatValue(data.tempo_atuacao)} />
          </div>
        </InfoSection>

        {/* Tipo de Atuação */}
        <InfoSection title="Tipo de Atuação" icon={<Briefcase className="h-4 w-4" />}>
          <div className="space-y-3">
            <InfoItem label="Tipos" value={formatArrayWithOutro(data.tipos_atuacao, data.tipo_atuacao_outro)} />
            <InfoItem label="Categorias Atendidas" value={formatArrayWithOutro(data.categorias_atendidas, data.categorias_outro)} />
          </div>
        </InfoSection>

        {/* Preços e Capacidade */}
        <InfoSection title="Preços e Capacidade" icon={<Truck className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Ticket Médio" value={formatValue(data.ticket_medio)} />
            <InfoItem label="Capacidade de Atendimento" value={formatValue(data.capacidade_atendimento)} />
          </div>
        </InfoSection>

        {/* Regiões */}
        <InfoSection title="Regiões Atendidas" icon={<MapPin className="h-4 w-4" />}>
          <div className="space-y-3">
            <InfoItem label="Regiões" value={data.regioes_atendidas?.join(", ")} />
            <InfoItem label="Cidades Frequentes" value={data.cidades_frequentes} />
          </div>
        </InfoSection>

        {/* Diferenciais */}
        <InfoSection title="Diferenciais" icon={<Star className="h-4 w-4" />}>
          <p className="font-medium">{formatArrayWithOutro(data.diferenciais, data.diferenciais_outro)}</p>
        </InfoSection>
      </div>
    );
  }

  // ========== PROFISSIONAL ==========
  if (item.type === "profissional") {
    return (
      <div className="grid gap-6">
        {/* Contatos */}
        <InfoSection title="Contatos" icon={<Phone className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Telefone" value={data.telefone ? formatPhoneNumber(data.telefone) : null} />
            <InfoItem label="Email" value={data.email} />
          </div>
        </InfoSection>

        {/* Dados Pessoais */}
        <InfoSection title="Dados Pessoais" icon={<User className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Nome" value={data.nome_completo} />
            <InfoItem label="CPF" value={data.cpf} />
            <InfoItem label="Data de Nascimento" value={data.data_nascimento} />
            <InfoItem label="Localização" value={`${data.cidade}, ${data.estado}`} />
          </div>
        </InfoSection>

        {/* Área de Atuação */}
        <InfoSection title="Área de Atuação" icon={<Briefcase className="h-4 w-4" />}>
          <div className="space-y-3">
            <InfoItem label="Função Principal" value={formatArrayWithOutro([data.funcao_principal], data.funcao_principal_outro)} />
            <InfoItem label="Especialidades" value={formatArrayWithOutro(data.especialidades, data.especialidades_outro)} />
          </div>
        </InfoSection>

        {/* Experiência */}
        <InfoSection title="Experiência" icon={<Star className="h-4 w-4" />}>
          <div className="space-y-3">
            <InfoItem label="Tempo de Experiência" value={formatValue(data.tempo_experiencia)} />
            <InfoItem label="Obras Relevantes" value={data.obras_relevantes} />
          </div>
        </InfoSection>

        {/* Disponibilidade */}
        <InfoSection title="Disponibilidade" icon={<MapPin className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Disponibilidade Atual" value={formatValue(data.disponibilidade_atual)} />
            <InfoItem label="Modalidade de Trabalho" value={formatValue(data.modalidade_trabalho)} />
          </div>
        </InfoSection>

        {/* Regiões */}
        <InfoSection title="Regiões Atendidas" icon={<MapPin className="h-4 w-4" />}>
          <div className="space-y-3">
            <InfoItem label="Regiões" value={data.regioes_atendidas?.join(", ")} />
            <InfoItem label="Cidades Frequentes" value={data.cidades_frequentes} />
          </div>
        </InfoSection>

        {/* Condições */}
        <InfoSection title="Condições e Preços" icon={<Truck className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Pretensão de Valor" value={data.pretensao_valor} />
            <InfoItem label="Equipamentos Próprios" value={formatValue(data.equipamentos_proprios)} />
          </div>
        </InfoSection>

        {/* Diferenciais */}
        <InfoSection title="Diferenciais" icon={<Star className="h-4 w-4" />}>
          <p className="font-medium">{formatArrayWithOutro(data.diferenciais, data.diferenciais_outro)}</p>
        </InfoSection>
      </div>
    );
  }

  // ========== EMPRESA ==========
  if (item.type === "empresa") {
    return (
      <div className="grid gap-6">
        {/* Contatos */}
        <InfoSection title="Contato Principal" icon={<Phone className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Nome" value={data.nome_contato} />
            <InfoItem label="Cargo" value={data.cargo_contato} />
            <InfoItem label="WhatsApp" value={data.whatsapp_contato ? formatPhoneNumber(data.whatsapp_contato) : null} />
            <InfoItem label="Email" value={data.email_contato} />
          </div>
        </InfoSection>

        {/* Dados da Empresa */}
        <InfoSection title="Dados da Empresa" icon={<Building2 className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoItem label="Nome" value={data.nome_empresa} />
            <InfoItem label="CNPJ" value={data.cnpj} />
            <InfoItem label="Site" value={data.site} />
            <InfoItem label="Localização" value={`${data.cidade}, ${data.estado}`} />
            <InfoItem label="Ano de Fundação" value={data.ano_fundacao} />
            <InfoItem label="Tamanho" value={formatValue(data.tamanho_empresa)} />
          </div>
        </InfoSection>

        {/* Estrutura Operacional */}
        <InfoSection title="Estrutura Operacional" icon={<Briefcase className="h-4 w-4" />}>
          <div className="space-y-3">
            <InfoItem label="Obras em Andamento" value={formatValue(data.obras_andamento)} />
            <InfoItem label="Tipos de Obras" value={formatArrayWithOutro(data.tipos_obras, data.tipos_obras_outro)} />
            <InfoItem label="Ticket Médio" value={formatValue(data.ticket_medio)} />
          </div>
        </InfoSection>

        {/* Planejamento */}
        <InfoSection title="Planejamento e Gestão" icon={<Star className="h-4 w-4" />}>
          <div className="space-y-3">
            <InfoItem label="Planejamento Curto Prazo" value={formatValue(data.planejamento_curto_prazo)} />
            <InfoItem label="Ferramentas de Gestão" value={data.ferramentas_gestao} />
          </div>
        </InfoSection>

        {/* Desafios */}
        <InfoSection title="Principais Desafios" icon={<Truck className="h-4 w-4" />}>
          <p className="font-medium">{formatArrayWithOutro(data.principais_desafios, data.desafios_outro)}</p>
        </InfoSection>
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center py-10 text-muted-foreground">
      Nenhuma informação disponível
    </div>
  );
};
