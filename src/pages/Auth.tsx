import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import { motion } from "framer-motion";
import { Building2, Ruler, HardHat, Store, Zap } from "lucide-react";

const Auth = () => {
  const { userSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Se já está logado e não está em processo de logout, apenas renderiza null
    // O redirecionamento baseado em role é feito pelo LoginForm após login
    // Isso evita conflitos de redirect com roles diferentes
    if (userSession?.user && localStorage.getItem("logging_out") !== "true") {
      // Não redireciona automaticamente - deixa o LoginForm controlar baseado na role
      return;
    }
  }, [userSession]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMousePosition({ x, y });
  };

  if (userSession?.user) return null;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background" onMouseMove={handleMouseMove}>
      {/* --- PAINEL ESQUERDO: Visual e Marca (Canteiro de Obras Digital) --- */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-primary overflow-hidden flex-col justify-between p-12 text-white z-10">
        {/* Background Animado "Living Construction" */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <motion.svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
            animate={{
              x: mousePosition.x * -20,
              y: mousePosition.y * -20,
            }}
            transition={{ type: "tween", ease: "linear", duration: 0.2 }}
          >
            <defs>
              {/* Grid de Engenharia (Papel Milimetrado) */}
              <pattern id="eng-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-secondary/30"
                />
              </pattern>
            </defs>

            {/* Fundo Grid */}
            <rect width="100%" height="100%" fill="url(#eng-grid)" />

            {/* ELEMENTO 1: Guindaste Esquemático (Crane) - Animado */}
            <motion.g
              className="text-secondary"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              initial={{ x: 600, y: 300 }}
            >
              {/* Torre */}
              <line x1="0" y1="0" x2="0" y2="500" strokeWidth="3" />
              {/* Lança (Jib) - Girando sutilmente */}
              <motion.line
                x1="-50"
                y1="0"
                x2="250"
                y2="0"
                strokeWidth="3"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Cabo e Carga - Movendo-se */}
              <motion.g
                animate={{ x: [50, 150, 50] }} // Move o carrinho do guindaste
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100"
                  animate={{ y2: [50, 150, 50] }} // Cabo sobe e desce
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.rect
                  x="-10"
                  y="100"
                  width="20"
                  height="15"
                  animate={{ y: [50, 150, 50] }} // Carga sobe e desce junto
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  fill="currentColor"
                  className="text-secondary/80"
                />
              </motion.g>
            </motion.g>

            {/* ELEMENTO 2: Edifícios em Construção (Blocos aparecendo) */}
            <g transform="translate(100, 600)">
              {/* Prédio 1 */}
              {[...Array(5)].map((_, i) => (
                <motion.rect
                  key={`b1-${i}`}
                  x="0"
                  y={-i * 40}
                  width="60"
                  height="35"
                  className="fill-secondary/20 stroke-secondary"
                  strokeWidth="1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1], scale: [0.8, 1, 1] }}
                  transition={{ duration: 4, delay: i * 1.5, repeat: Infinity, repeatDelay: 5 }}
                />
              ))}
              {/* Prédio 2 (Mais alto) */}
              {[...Array(8)].map((_, i) => (
                <motion.rect
                  key={`b2-${i}`}
                  x="80"
                  y={20 - i * 40}
                  width="60"
                  height="35"
                  className="fill-secondary/10 stroke-secondary/50"
                  strokeWidth="1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1] }}
                  transition={{ duration: 3, delay: i * 0.8 + 2, repeat: Infinity, repeatDelay: 2 }}
                />
              ))}
            </g>

            {/* ELEMENTO 3: Linhas de Dados/Conexões Tech */}
            <motion.g className="text-white/40" stroke="currentColor" strokeWidth="1">
              <motion.line
                x1="0"
                y1="800"
                x2="1000"
                y2="200"
                strokeDasharray="10 10"
                animate={{ strokeDashoffset: [0, -200] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.line
                x1="0"
                y1="200"
                x2="1000"
                y2="800"
                strokeDasharray="10 10"
                animate={{ strokeDashoffset: [0, 200] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
            </motion.g>
          </motion.svg>

          {/* Efeito de Luz Dourada (Glow) */}
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 blur-[100px] rounded-full mix-blend-overlay pointer-events-none" />
        </div>

        {/* Conteúdo Esquerda */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-secondary/20 rounded-lg backdrop-blur-sm border border-secondary/30 flex items-center justify-center">
              {/* Espaço para a Logo da Grifo (Icon Only) */}
              <img
                src="/lovable-uploads/grifo-logo-header.png"
                alt="Grifo Icon"
                className="grifo-logo-placeholder h-8 w-8 object-contain"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(43%) sepia(35%) saturate(1096%) hue-rotate(5deg) brightness(93%) contrast(90%)",
                }}
              />
            </div>
            <h2 className="text-2xl font-heading font-bold tracking-wide text-white">Grifo Engenharia</h2>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl font-heading font-bold leading-tight mb-6 text-white"
          >
            A união da precisão da engenharia com a <span className="text-secondary">inteligência dos dados.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg text-primary-foreground/90 font-light leading-relaxed"
          >
            Bem-vindo ao <strong>Grifoboard</strong>. Sua plataforma central para controle de PCP, diário de obra e
            gestão de recursos. Decisões baseadas em dados, do projeto à execução.
          </motion.p>

          {/* GRID DE FUNCIONALIDADES (4 ITENS) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-x-8 gap-y-4 mt-10 text-sm text-primary-foreground/80 font-medium"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
                <Ruler className="w-4 h-4 text-secondary" />
              </div>
              Gestão de PCP
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
                <Store className="w-4 h-4 text-secondary" />
              </div>
              Marketplace
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
                <Building2 className="w-4 h-4 text-secondary" />
              </div>
              Controle de Campo
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
                <Zap className="w-4 h-4 text-secondary" />
              </div>
              Cultura Fast
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/60 font-light"></div>
      </div>

      {/* --- PAINEL DIREITO: Login --- */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 lg:p-12 relative z-20 bg-accent/30 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-0 left-0 w-full bg-primary p-6 text-center shadow-md z-30">
          <img
            src="/lovable-uploads/grifo-logo-header.png"
            alt="Grifo Logo"
            className="grifo-logo-placeholder h-12 mx-auto mb-3 object-contain brightness-0 invert"
          />
          <h1 className="text-xl font-heading font-bold text-white">Grifoboard</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          // Ajustes de padding e espaçamento para caber na tela
          className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl shadow-2xl shadow-primary/10 border border-border/60 mt-24 lg:mt-0 relative"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-secondary rounded-b-full" />

          <div className="text-center space-y-1">
            <img
              src="/lovable-uploads/grifo-logo-header.png"
              alt="Grifo Logo"
              className="grifo-logo-placeholder h-20 mx-auto mb-4 object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(43%) sepia(35%) saturate(1096%) hue-rotate(5deg) brightness(93%) contrast(90%)",
              }}
            />
            <h2 className="text-2xl font-heading font-bold text-primary tracking-tight">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground">Entre com suas credenciais para continuar.</p>
          </div>

          <div className="pt-2">
            <AuthForm />
          </div>
        </motion.div>
        <p className="lg:hidden text-xs text-muted-foreground mt-8 text-center pb-4">
          © {new Date().getFullYear()} Grifo Engenharia.
        </p>
      </div>
    </div>
  );
};

export default Auth;
