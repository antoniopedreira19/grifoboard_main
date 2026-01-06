import LoginForm from './LoginForm';
import { motion } from 'framer-motion';

const AuthForm = () => {
  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoginForm />
      </motion.div>
    </div>
  );
};

export default AuthForm;