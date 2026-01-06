import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthLayout from '@/components/auth/AuthLayout';

const ResetPassword = () => {
  const { userSession, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && userSession.user) {
      navigate('/obras', { replace: true });
    }
  }, [isLoading, userSession.user, navigate]);

  const handleBackToLogin = () => {
    navigate('/auth', { replace: true });
  };

  return (
    <AuthLayout title="Nova senha">
      <ResetPasswordForm onBackToLogin={handleBackToLogin} />
    </AuthLayout>
  );
};

export default ResetPassword;