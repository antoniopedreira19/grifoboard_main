
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { signUp } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Senhas diferentes",
        description: "As senhas informadas não coincidem",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password);
      // Clear form after successful signup
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    } catch (error: any) {
      // Error toast handled by AuthContext.signUp
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-sm font-medium" style={{ color: '#1E2836' }}>
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
            <Input 
              id="signup-email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="pl-12 h-12 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300" 
              required
            />
          </div>
        </div>
        
        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-sm font-medium" style={{ color: '#1E2836' }}>
            Senha
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
            <Input 
              id="signup-password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="pl-12 pr-12 h-12 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300" 
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
        
        {/* Confirm Password field */}
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium" style={{ color: '#1E2836' }}>
            Confirmar Senha
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
            <Input 
              id="confirm-password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="pl-12 h-12 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300" 
              required
            />
          </div>
        </div>
      </div>
      
      {/* Password strength indicator */}
      <div className="text-sm bg-gray-50 p-3 rounded-xl border border-gray-200" style={{ color: '#1E2836' }}>
        A senha deve ter pelo menos 6 caracteres
      </div>
      
      {/* Signup button */}
      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] border-0"
        style={{ 
          height: '48px',
          backgroundColor: '#C7A347'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B7943F'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C7A347'}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cadastrando...
          </div>
        ) : (
          'Criar conta'
        )}
      </Button>
    </form>
  );
};

export default SignupForm;
