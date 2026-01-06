
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { masterAdminService } from '@/services/masterAdminService';
import { supabase } from '@/integrations/supabase/client';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Limpa dados de sessão anterior antes do login para evitar conflitos de rota
    sessionStorage.removeItem("lastRoute");
    localStorage.removeItem("logging_out");
    
    try {
      // Faz o login
      await signIn(email, password);
      
      // Depois do login, verifica a role e redireciona
      let targetPath = '/obras';
      try {
        // Verifica se é master admin
        const isMasterAdmin = await masterAdminService.isMasterAdmin();
        if (isMasterAdmin) {
          targetPath = '/master-admin';
        } else {
          // Verifica se é parceiro
          const { data: userData } = await supabase
            .from("usuarios")
            .select("role")
            .eq("id", (await supabase.auth.getUser()).data.user?.id)
            .single();
          
          if (userData?.role === "parceiro") {
            targetPath = '/portal-parceiro';
          }
        }
      } catch (roleError) {
        console.error('Erro ao verificar role do usuário:', roleError);
        // Em caso de erro, mantém /obras como padrão
      }
      
      navigate(targetPath, { replace: true });
    } catch (error: any) {
      // O signIn já exibe toast de erro, aqui apenas garantimos que não quebre o fluxo
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#1E2836' }}>
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="pl-11 h-10 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300 text-sm"
              required
            />
          </div>
        </div>
        
        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#1E2836' }}>
            Senha
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="pl-11 pr-11 h-10 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300 text-sm"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C7A347] focus:outline-none transition-colors duration-200 p-1 rounded-lg hover:bg-gray-50"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Remember me */}
      <div className="flex items-center">
        <div className="flex items-center space-x-3">
          <Checkbox 
            id="remember-me" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(checked === true)} 
            className="rounded border-gray-300 data-[state=checked]:bg-[#C7A347] data-[state=checked]:border-[#C7A347] h-4 w-4"
          />
          <Label 
            htmlFor="remember-me" 
            className="text-sm cursor-pointer select-none font-medium"
            style={{ color: '#1E2836' }}
          >
            Manter-me conectado
          </Label>
        </div>
      </div>
      
      {/* Login button */}
      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] border-0"
        style={{ 
          height: '40px',
          backgroundColor: '#C7A347'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B7943F'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C7A347'}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Entrando...
          </div>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
