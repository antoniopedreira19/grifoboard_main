import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Calendar, BarChart3, Users } from "lucide-react";
import grifoLogo from "@/assets/grifo-logo.png";
interface AuthLayoutProps {
  children: ReactNode;
  title: string;
}
const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  return (
    <div className="h-screen w-full fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-diskette">
      {/* Construction grid pattern background - NO SHAPES */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 10c0-1.1.9-2 2-2s2 .9 2 2-2 2-2 2-2-.9-2-2zm0 20c0-1.1.9-2 2-2s2 .9 2 2-2 2-2 2-2-.9-2-2zm0 20c0-1.1.9-2 2-2s2 .9 2 2-2 2-2 2-2-.9-2-2zM10 36c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm20 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm20 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Desktop Layout - Side by Side 60/40 */}
      <div className="hidden lg:flex h-full">
        {/* Left Side - Hero Content (60%) */}
        <div className="w-3/5 relative flex items-center">
          <div className="max-w-2xl ml-16 space-y-8">
            {/* Logo */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
              className="flex items-center space-x-3"
            >
              <div className="w-14 h-14 flex items-center justify-center">
                <img src={grifoLogo} alt="Grifo Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[#C7A347] text-lg font-semibold">GRIFO ENGENHARIA</span>
            </motion.div>

            {/* Headlines */}
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.2,
              }}
              className="space-y-4"
            >
              <h1 className="text-5xl font-bold text-white leading-tight">GrifoBoard</h1>
              <h3 className="text-2xl text-slate-300 font-medium">Gestão Inteligente de Obras</h3>
            </motion.div>

            {/* Feature Bullets */}
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.4,
              }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#C7A347]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#C7A347]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">Planejamento semanal</h4>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#C7A347]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-[#C7A347]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">PCP em tempo real</h4>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#C7A347]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#C7A347]" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">Fast Construction</h4>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Form Card (40%) */}
        <div className="w-2/5 flex items-center justify-center p-4">
          <motion.div
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
          >
            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
              }}
              className="text-2xl font-bold mb-4 text-center"
              style={{
                color: "#0A1D33",
              }}
            >
              {title}
            </motion.h1>

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.3,
              }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="lg:hidden h-full flex flex-col">
        {/* Top - Hero Content */}
        <div className="flex-1 relative flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src={grifoLogo} alt="Grifo Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[#C7A347] text-lg font-semibold">GRIFO ENGENHARIA</span>
            </div>

            {/* Headlines */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">GrifoBoard</h1>
              <h3 className="text-lg text-slate-300">Gestão Inteligente de Obras</h3>
            </div>
          </div>
        </div>

        {/* Bottom - Form Card */}
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{
              opacity: 0,
              y: 50,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
          >
            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
              }}
              className="text-2xl font-bold mb-6 text-center"
              style={{
                color: "#0A1D33",
              }}
            >
              {title}
            </motion.h1>

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.3,
              }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
