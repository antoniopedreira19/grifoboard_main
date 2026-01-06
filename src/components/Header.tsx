import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
const Header = () => {
  const {
    userSession,
    signOut,
    setObraAtiva
  } = useAuth();
  const navigate = useNavigate();
  const handleMudarObra = () => {
    setObraAtiva(null);
    navigate("/obras");
  };
  const getInitials = (name?: string) => {
    if (!name) return "GR";
    return name.substring(0, 2).toUpperCase();
  };
  return <header className="bg-primary border-b border-white/10 sticky top-0 z-50 shadow-md">
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate("/dashboard")}>
            <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 group-hover:bg-white/10 transition-colors p-1">
              <img src="/lovable-uploads/grifo-logo-header.png" alt="Grifo" className="w-full h-full object-contain"
            // OTIMIZAÇÃO DE PERFORMANCE:
            loading="eager" fetchPriority="high" decoding="sync" onError={e => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML = '<span class="text-secondary font-bold text-xl">G</span>';
            }} />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-white tracking-wide">GrifoBoard</h1>
              
            </div>
          </div>

          {/* Área do Usuário e Obra Ativa */}
          {userSession.user && <div className="flex items-center gap-3 md:gap-4">
              {userSession.obraAtiva && <div className="hidden md:flex items-center bg-black/20 rounded-lg px-4 py-2 border border-white/5 backdrop-blur-sm">
                  <div className="w-8 h-8 bg-secondary/20 rounded-md flex items-center justify-center mr-3">
                    <Building2 className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider leading-none mb-1">
                      Obra Ativa
                    </span>
                    <span className="font-semibold text-sm text-white max-w-[150px] truncate leading-none">
                      {userSession.obraAtiva.nome_obra}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-4" />
                  <button onClick={handleMudarObra} className="text-xs text-accent hover:text-white transition-colors font-medium hover:underline">
                    Trocar
                  </button>
                </div>}

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={async () => {
              await signOut();
              navigate("/auth");
            }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>

                <Avatar className="h-9 w-9 border-2 border-secondary cursor-pointer hover:scale-105 transition-transform">
                  <AvatarImage src={userSession?.user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-secondary text-white font-bold text-xs">
                    {getInitials(userSession?.user?.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>}
        </div>
      </div>
    </header>;
};
export default Header;