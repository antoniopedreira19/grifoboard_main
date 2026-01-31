import { useState, useEffect, memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";
import grifoLogo from "@/assets/grifo-logo.png";

const STATUS_MESSAGES = [
  "Analisando sua pergunta...",
  "Consultando base de conhecimento...",
  "Preparando resposta...",
  "Processando informações...",
];

const TypingIndicator = memo(() => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3 justify-start animate-fade-in">
      <Avatar className="h-8 w-8 border border-slate-200 mt-1 flex-shrink-0">
        <AvatarImage src={grifoLogo} alt="Grifo AI" />
        <AvatarFallback className="bg-[#112131] text-[#C7A347]">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-3">
        <div className="typing-dots flex gap-1">
          <span className="typing-dot w-2 h-2 bg-[#C7A347] rounded-full"></span>
          <span className="typing-dot w-2 h-2 bg-[#C7A347] rounded-full"></span>
          <span className="typing-dot w-2 h-2 bg-[#C7A347] rounded-full"></span>
        </div>
        <span className="text-xs text-slate-500 min-w-[180px] transition-opacity duration-300">
          {STATUS_MESSAGES[statusIndex]}
        </span>
      </div>
    </div>
  );
});

TypingIndicator.displayName = "TypingIndicator";

export default TypingIndicator;
