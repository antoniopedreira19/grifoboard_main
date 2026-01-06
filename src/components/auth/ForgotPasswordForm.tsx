import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Digite seu email para recuperar a senha",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de recuperação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-[#C7A347]/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-[#C7A347]" />
          </div>
          <h2 className="text-xl font-semibold" style={{ color: '#0A1D33' }}>Email enviado!</h2>
          <p className="text-sm" style={{ color: '#1E2836' }}>
            Enviamos um link para redefinir sua senha para <strong>{email}</strong>
          </p>
        </div>
        
        <div className="space-y-4">
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
          
          <p className="text-sm" style={{ color: '#1E2836' }}>
            Não recebeu o email? Verifique sua pasta de spam ou{' '}
            <button 
              type="button"
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="font-medium hover:underline"
              style={{ color: '#C7A347' }}
            >
              tente novamente
            </button>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3 text-center">
        <h2 className="text-xl font-semibold" style={{ color: '#0A1D33' }}>Esqueceu sua senha?</h2>
        <p className="text-sm" style={{ color: '#1E2836' }}>
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="forgot-email" className="text-sm font-medium" style={{ color: '#1E2836' }}>
          Email
        </Label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C7A347] transition-colors duration-200" />
          <Input 
            id="forgot-email" 
            type="email" 
            placeholder="seu@email.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="pl-12 h-12 rounded-xl border-gray-300 focus:border-[#C7A347] focus:ring-2 focus:ring-[#C7A347]/20 transition-all duration-300" 
            required
          />
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
              Enviando...
            </div>
          ) : (
            'Enviar link de recuperação'
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
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao login
        </Button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;