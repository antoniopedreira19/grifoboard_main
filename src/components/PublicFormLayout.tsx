import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PublicFormLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

export function PublicFormLayout({ title, description, icon, children }: PublicFormLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 relative">
      {/* Decoração de Fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/lovable-uploads/grifo-logo-header.png"
            alt="Grifo Engenharia"
            className="h-14 w-auto object-contain drop-shadow-sm"
          />
        </div>

        <Card className="border-t-4 border-t-primary shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2 border-b border-slate-100/50">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4 text-primary shadow-inner">{icon}</div>
            <CardTitle className="text-2xl font-bold text-slate-800 tracking-tight">{title}</CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2 max-w-md mx-auto">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-6 sm:px-8">{children}</CardContent>
        </Card>

        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-slate-400 font-medium">&copy; {new Date().getFullYear()} Grifoboard Marketplace</p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-300">
            <span>Privacidade</span>
            <span>•</span>
            <span>Termos de Uso</span>
          </div>
        </div>
      </div>
    </div>
  );
}
