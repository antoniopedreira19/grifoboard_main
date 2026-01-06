import { ReactNode } from 'react';
import fundoGrifo from '@/assets/fundo-grifo.jpg';
import grifoIcon from '@/assets/grifo-icon-gold.png';

interface FormTemplateProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const FormTemplate = ({ children, title, subtitle }: FormTemplateProps) => {
  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ 
        backgroundImage: `url(${fundoGrifo})`,
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="w-full max-w-4xl">
        {/* Header com logo e título */}
        <div className="flex items-center gap-4 mb-8">
          <img 
            src={grifoIcon} 
            alt="Grifo" 
            className="w-16 h-16 object-contain"
          />
          <div>
            <h1 className="text-white text-3xl md:text-4xl font-bold tracking-wide">
              {title}
            </h1>
            <p className="text-white/80 text-sm md:text-base mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Card branco com conteúdo do formulário */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormTemplate;
