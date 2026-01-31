import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import grifoLogo from "@/assets/grifo-logo.png";
// @ts-ignore
import ReactMarkdown from "react-markdown";
// @ts-ignore
import remarkGfm from "remark-gfm";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface MessageBubbleProps {
  message: Message;
  userAvatarUrl?: string;
}

const MessageBubble = memo(({ message, userAvatarUrl }: MessageBubbleProps) => {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {/* Avatar do Robô (Esquerda) */}
      {isAssistant && (
        <Avatar className="h-8 w-8 border border-slate-200 mt-1 flex-shrink-0">
          <AvatarImage src={grifoLogo} alt="Grifo AI" />
          <AvatarFallback className="bg-[#112131] text-[#C7A347]">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Balão de Mensagem */}
      {isAssistant ? (
        <div className="max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl rounded-tl-none bg-white text-slate-700 border border-slate-100 shadow-sm text-sm leading-relaxed overflow-hidden">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-sm prose-slate max-w-none break-words"
            components={{
              strong: ({ node, ...props }) => <span className="font-bold text-slate-900" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              a: ({ node, ...props }) => (
                <a
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              h1: ({ node, ...props }) => (
                <h1 className="text-lg font-bold text-[#112131] mt-4 mb-2" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-base font-bold text-[#112131] mt-3 mb-2" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-sm font-bold text-[#112131] mt-2 mb-1" {...props} />
              ),
              code: ({ node, ...props }) => (
                <code
                  className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-red-500"
                  {...props}
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl rounded-tr-none bg-[#112131] text-white shadow-sm text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      )}

      {/* Avatar do Usuário (Direita) */}
      {!isAssistant && (
        <Avatar className="h-8 w-8 border border-slate-200 mt-1 flex-shrink-0">
          <AvatarImage src={userAvatarUrl} />
          <AvatarFallback className="bg-slate-200 text-slate-600">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
