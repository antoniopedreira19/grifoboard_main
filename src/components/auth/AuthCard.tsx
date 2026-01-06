
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Hammer, HardHat } from 'lucide-react';

const AuthCard = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      {/* Header with construction theme */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
          className="relative w-20 h-20 mx-auto mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center">
            <Hammer className="w-3 h-3 text-white" />
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2"
        >
          GrifoBoard
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-slate-300 text-sm flex items-center justify-center gap-2"
        >
          <HardHat className="w-4 h-4" />
          Controle total das suas obras
        </motion.p>
      </div>
      
      {/* Auth Form with glass morphism - NO WHITE BACKGROUND */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <Tabs 
          defaultValue="login" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="p-1.5">
            <TabsList className="grid grid-cols-2 w-full bg-black/20 rounded-xl p-1 border border-white/10">
              <TabsTrigger 
                value="login" 
                className="py-3 px-4 rounded-lg text-sm font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-slate-300 data-[state=active]:border data-[state=active]:border-white/30"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="py-3 px-4 rounded-lg text-sm font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-slate-300 data-[state=active]:border data-[state=active]:border-white/30"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6">
            <AnimatePresence mode="wait">
              <TabsContent value="login" asChild>
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="signup" asChild>
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SignupForm />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
      
      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-6 text-slate-400 text-xs"
      >
        © {new Date().getFullYear()} GrifoBoard • Gestão Inteligente de Obras
      </motion.div>
    </motion.div>
  );
};

export default AuthCard;
