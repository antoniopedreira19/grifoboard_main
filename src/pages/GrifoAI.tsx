import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import grifoLogo from "@/assets/grifo-logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const GrifoAI = () => {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Carregar Histórico ao Iniciar
  useEffect(() => {
    const loadHistory = async () => {
      if (!userSession?.user?.id) return;
      try {
        const { data, error } = await supabase
          .from("grifo_chat_messages" as any)
          .select("*")
          .eq("user_id", userSession.user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(data as unknown as Message[]);
        } else {
          setMessages([
            {
              role: "assistant",
              content: `Olá, ${userSession?.user?.user_metadata?.full_name?.split(" ")[0] || "Engenheiro"}! Sou o GrifoAI, seu mentor de alta performance. Como posso ajudar a acelerar sua obra hoje?`,
            },
          ]);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadHistory();
  }, [userSession]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || !userSession?.user?.id) return;

    const userMessageContent = input.trim();
    setInput("");
    setLoading(true);

    const tempUserMsg: Message = { role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      await supabase.from("grifo_chat_messages" as any).insert({
        user_id: userSession.user.id,
        role: "user",
        content: userMessageContent,
      });

      const { data, error } = await supabase.functions.invoke("grifo-ai", {
        body: {
          query: userMessageContent,
          user_id: userSession.user.id,
          chat_id: userSession.user.id,
        },
      });

      let aiResponse = "";

      if (error) {
        console.warn("Edge Function erro:", error);
        aiResponse = "⚠️ Erro de conexão com o GrifoMind. Verifique se o n8n está ativo.";
      } else {
        if (data?.error) {
          console.error("Erro Edge:", data.error);
          aiResponse = "Ocorreu um erro no processamento da sua pergunta. Tente novamente.";
        } else {
          aiResponse = data?.answer || "Não encontrei essa informação.";
        }
      }

      await supabase.from("grifo_chat_messages" as any).insert({
        user_id: userSession.user.id,
        role: "assistant",
        content: aiResponse,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      console.error("Erro fluxo:", error);
      toast({
        title: "Erro",
        description: "Falha na comunicação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!userSession?.user?.id) return;
    try {
      const { error } = await supabase
        .from("grifo_chat_messages" as any)
        .delete()
        .eq("user_id", userSession.user.id);

      if (error) throw error;

      setMessages([
        {
          role: "assistant",
          content: "Histórico limpo. Como posso ajudar agora?",
        },
      ]);
      toast({ title: "Histórico apagado." });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao limpar", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto gap-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <img src={grifoLogo} alt="Grifo Logo" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-[#112131]">GrifoAI</h1>
            <p className="text-xs text-slate-500">Histórico salvo automaticamente</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Conversa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar histórico?</AlertDialogTitle>
              <AlertDialogDescription>Isso removerá permanentemente todas as mensagens.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory} className="bg-red-500 hover:bg-red-600">
                Apagar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-md bg-slate-50/50">
        <ScrollArea className="flex-1 p-4 sm:p-6">
          {initialLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[#C7A347]" />
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {/* Avatar do Robô (Esquerda) */}
                  {msg.role === "assistant" && (
                    <Avatar className="h-8 w-8 border border-slate-200 mt-1 flex-shrink-0">
                      <AvatarFallback className="bg-[#112131] text-[#C7A347]">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Balão de Mensagem */}
                  {msg.role === "assistant" ? (
                    // --- ASSISTENTE (Markdown Renderizado) ---
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
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    // --- USUÁRIO (Texto Simples) ---
                    <div className="max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl rounded-tr-none bg-[#112131] text-white shadow-sm text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}

                  {/* Avatar do Usuário (Direita) */}
                  {msg.role === "user" && (
                    <Avatar className="h-8 w-8 border border-slate-200 mt-1 flex-shrink-0">
                      <AvatarImage src={userSession?.user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-slate-200 text-slate-600">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start animate-pulse">
                  <Avatar className="h-8 w-8 border border-slate-200 mt-1">
                    <AvatarFallback className="bg-[#112131] text-[#C7A347]">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[#C7A347]" />
                    <span className="text-xs">Consultando...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2 relative max-w-4xl mx-auto">
            <Input
              placeholder="Digite sua dúvida aqui..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-12 py-6 bg-slate-50 border-slate-200 focus-visible:ring-[#112131] shadow-inner"
              disabled={loading}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1 h-10 w-10 bg-[#C7A347] hover:bg-[#b08d3b] text-white rounded-md transition-all shadow-sm"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            GrifoAI pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default GrifoAI;
