import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  onBackToLogin: () => void;
}

const ResetPasswordForm = ({ onBackToLogin }: ResetPasswordFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [passwordChanged, setPasswordChanged] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Captura os parâmetros da URL (hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        // Se há erro na URL, mostra a mensagem de erro
        if (error || errorCode) {
          setIsValidToken(false);
          let errorMessage = "O link de recuperação de senha não é válido ou já expirou.";
          
          if (errorCode === 'otp_expired') {
            errorMessage = "O link de recuperação de senha expirou. Solicite um novo link.";
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
          }
          
          toast({
            title: "Link inválido ou expirado",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Remove os parâmetros da URL
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        // Verifica se é um link de recuperação válido
        if (type === 'recovery' && accessToken && refreshToken) {
          // Estabelece a sessão usando os tokens da URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Erro ao estabelecer sessão:', error);
            setIsValidToken(false);
            toast({
              title: "Link inválido ou expirado",
              description: "O link de recuperação de senha não é válido ou já expirou.",
              variant: "destructive",
            });
            return;
          }

          // Remove os parâmetros da URL para maior segurança
          window.history.replaceState({}, document.title, window.location.pathname);
          
        } else {
          // Verifica se já existe uma sessão válida
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setIsValidToken(false);
            toast({
              title: "Link inválido ou expirado",
              description: "O link de recuperação de senha não é válido ou já expirou.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Erro ao processar reset de senha:', error);
        setIsValidToken(false);
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao processar o link de recuperação.",
          variant: "destructive",
        });
      }
    };

    handlePasswordReset();
  }, [toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
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
    
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setPasswordChanged(true);
      toast({
        title: "Senha atualizada com sucesso",
        description: "Sua nova senha foi salva. Você pode fazer login agora.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar sua senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold" style={{ color: '#0A1D33' }}>Link inválido</h2>
          <p className="text-sm" style={{ color: '#1E2836' }}>
            O link de recuperação de senha não é válido ou já expirou.
          </p>
        </div>
        
        <Button 
          type="button" 
          onClick={onBackToLogin}
          className="w-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          style={{ 
            height: '48px',
            backgroundColor: '#C7A347'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B7943F'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C7A347'}
        >
          Voltar ao login
        </Button>
      </div>
    );
  }

  if (passwordChanged) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold" style={{ color: '#0A1D33' }}>Senha alterada!</h2>
          <p className="text-sm" style={{ color: '#1E2836' }}>
            Sua senha foi alterada com sucesso. Você pode fazer login com sua nova senha.
          </p>
        </div>
        
        <Button 
          type="button" 
          onClick={onBackToLogin}
          className="w-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          style={{ 
            height: '48px',
            backgroundColor: '#C7A347'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B7943F'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C7A347'}
        >
          Fazer login
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3 text-center">
        <h2 className="text-xl font-semibold" style={{ color: '#0A1D33' }}>Nova senha</h2>
        <p className="text-sm" style={{ color: '#1E2836' }}>
          Digite sua nova senha abaixo
        </p>
      </div>
      
      <div className="space-y-4">
        {/* New Password field */}
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-sm font-medium" style={{ color: '#1E2836' }}>
            Nova senha
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
            <Input 
              id="new-password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="pl-12 pr-12 h-12 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300" 
              required
              minLength={6}
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
            Confirmar nova senha
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
            <Input 
              id="confirm-password" 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="pl-12 pr-12 h-12 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300" 
              required
              minLength={6}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C7A347] focus:outline-none transition-colors duration-200 p-1 rounded-lg hover:bg-gray-50"
              aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
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
              Alterando senha...
            </div>
          ) : (
            'Alterar senha'
          )}
        </Button>
        
        <Button 
          type="button" 
          variant="ghost"
          onClick={onBackToLogin}
          className="w-full font-medium transition-all duration-300"
          style={{ 
            height: '48px',
            color: '#1E2836'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#C7A347'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#1E2836'}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;