import AuthLayout from './AuthLayout';
import LoginForm from './LoginForm';

const LoginPage = () => {
  return (
    <AuthLayout title="Entrar">
      <div className="space-y-4">
        <LoginForm />
      </div>
    </AuthLayout>
  );
};

export default LoginPage;