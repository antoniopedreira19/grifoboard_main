import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import grifoLogo from "@/assets/grifo-logo.png";
import MessageBubble from "@/components/grifo-ai/MessageBubble";
import TypingIndicator from "@/components/grifo-ai/TypingIndicator";
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

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

const TIMEOUT_MS = 60000; // 60 seconds

const GrifoAI = () => {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load history on mount
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

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save message to DB in background (fire-and-forget)
  const saveMessageBackground = useCallback((userId: string, role: string, content: string) => {
    supabase
      .from("grifo_chat_messages" as any)
      .insert({ user_id: userId, role, content })
      .then(({ error }) => {
        if (error) console.error("Erro ao salvar mensagem:", error);
      });
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !userSession?.user?.id) return;

    const userMessageContent = input.trim();
    const userId = userSession.user.id;
    
    // Clear input immediately
    setInput("");
    
    // OPTIMISTIC UI: Add user message instantly
    const tempUserMsg: Message = { role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, tempUserMsg]);
    
    // Start loading
    setLoading(true);

    // Save user message in background (no await)
    saveMessageBackground(userId, "user", userMessageContent);

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    try {
      const { data, error } = await supabase.functions.invoke("grifo-ai", {
        body: {
          query: userMessageContent,
          user_id: userId,
          chat_id: userId,
        },
      });

      clearTimeout(timeoutId);

      let aiResponse = "";

      if (error) {
        console.warn("Edge Function erro:", error);
        aiResponse = "⚠️ Erro de conexão com o GrifoMind. Verifique se o n8n está ativo.";
      } else if (data?.error) {
        console.error("Erro Edge:", data.error);
        aiResponse = "Ocorreu um erro no processamento da sua pergunta. Tente novamente.";
      } else {
        aiResponse = data?.answer || "Não encontrei essa informação.";
      }

      // Save AI response in background
      saveMessageBackground(userId, "assistant", aiResponse);

      // Update UI with AI response
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      let errorMessage = "Falha na comunicação.";
      
      if (error.name === "AbortError" || error.message?.includes("abort")) {
        errorMessage = "⏱️ A consulta demorou muito. O servidor pode estar sobrecarregado. Tente novamente em alguns instantes.";
      }

      console.error("Erro fluxo:", error);
      
      // Add error message to chat
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
      
      toast({
        title: "Erro",
        description: "Falha na comunicação com o GrifoAI.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, loading, userSession, saveMessageBackground, toast]);

  const handleClearHistory = useCallback(async () => {
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
  }, [userSession, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const userAvatarUrl = userSession?.user?.user_metadata?.avatar_url;

  return (
    <div className="flex flex-col h-[calc(100dvh-theme(spacing.14)-theme(spacing.14)-theme(spacing.6))] md:h-[calc(100vh-2rem)] max-w-5xl mx-auto gap-2 md:gap-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-2.5 md:p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 md:gap-3">
          <img src={grifoLogo} alt="Grifo Logo" className="h-7 md:h-10 w-auto" />
          <div>
            <h1 className="text-base md:text-xl font-bold text-[#112131]">GrifoAI</h1>
            <p className="text-[10px] md:text-xs text-slate-500 hidden md:block">Histórico salvo automaticamente</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 px-2 md:px-3">
              <Trash2 className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Limpar Conversa</span>
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
                <MessageBubble 
                  key={msg.id || index} 
                  message={msg} 
                  userAvatarUrl={userAvatarUrl} 
                />
              ))}

              {loading && <TypingIndicator />}
              
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
