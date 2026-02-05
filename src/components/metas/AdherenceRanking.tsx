import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  BookOpen,
  ListTodo,
  Target,
  Handshake,
  Trophy,
  Medal,
  Users,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Feature config - mapping action_types to features
const FEATURE_CONFIG = {
  PCP: {
    label: "PCP",
    actions: ["TAREFA_CONCLUIDA"],
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-600/30",
    icon: ListTodo,
  },
  DIARIO: {
    label: "Diário",
    actions: ["DIARIO_CRIADO"],
    color: "bg-blue-500/20 text-blue-400 border-blue-600/30",
    icon: BookOpen,
  },
  PMP: {
    label: "PMP",
    actions: ["PMP_ATIVIDADE_CONCLUIDA", "PMP_RESTRICAO_CONCLUIDA"],
    color: "bg-purple-500/20 text-purple-400 border-purple-600/30",
    icon: Target,
  },
  PLAYBOOK: {
    label: "Playbook",
    actions: ["CONTRATACAO_FAST", "ECONOMIA_PLAYBOOK"],
    color: "bg-[#C7A347]/20 text-[#C7A347] border-[#C7A347]/30",
    icon: Handshake,
  },
};

interface UserAdherenceData {
  id: string;
  nome: string;
  xp_total: number;
  level: number;
  features: {
    PCP: number;
    DIARIO: number;
    PMP: number;
    PLAYBOOK: number;
  };
}

interface AdherenceRankingProps {
  data: UserAdherenceData[];
  isLoading: boolean;
}

export const AdherenceRanking = ({ data, isLoading }: AdherenceRankingProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-[#C7A347] border-t-transparent rounded-full" />
      </div>
    );
  }

  // KPI Calculations
  const totalUsers = data.length;
  const activeUsers = data.filter((u) => u.xp_total > 0).length;
  const avgXP = totalUsers > 0 ? data.reduce((acc, u) => acc + u.xp_total, 0) / totalUsers : 0;
  const topUser = data.length > 0 ? data[0] : null;

  // Feature usage stats
  const featureStats = {
    PCP: data.filter((u) => u.features.PCP > 0).length,
    DIARIO: data.filter((u) => u.features.DIARIO > 0).length,
    PMP: data.filter((u) => u.features.PMP > 0).length,
    PLAYBOOK: data.filter((u) => u.features.PLAYBOOK > 0).length,
  };

  const mostUsedFeature = Object.entries(featureStats).sort((a, b) => b[1] - a[1])[0];

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-[#C7A347]" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-slate-500 font-mono text-sm">#{index + 1}</span>;
  };

  const getFeatureBadge = (feature: keyof typeof FEATURE_CONFIG, count: number) => {
    const config = FEATURE_CONFIG[feature];
    const Icon = config.icon;
    if (count === 0) return null;

    return (
      <Badge
        key={feature}
        variant="outline"
        className={`text-[10px] px-2 py-0.5 border ${config.color} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
        <span className="font-mono ml-1 opacity-70">({count})</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Usuários Ativos */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4 text-[#C7A347]" /> Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold text-white">
              {activeUsers}
              <span className="text-sm text-slate-500 ml-1">/ {totalUsers}</span>
            </div>
            <Progress
              value={totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0}
              className="h-1.5 mt-2 bg-slate-800 [&>*]:bg-[#C7A347]"
            />
          </CardContent>
        </Card>

        {/* Média de XP */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Média de XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold text-white">{Math.round(avgXP)}</div>
            <p className="text-xs text-slate-500 mt-1">XP médio por usuário</p>
          </CardContent>
        </Card>

        {/* Feature Mais Usada */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Feature Top
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostUsedFeature && (
              <>
                <div className="text-2xl font-bold text-white">
                  {FEATURE_CONFIG[mostUsedFeature[0] as keyof typeof FEATURE_CONFIG].label}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {mostUsedFeature[1]} usuários ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top User */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-[#C7A347]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-[#C7A347] uppercase tracking-widest flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Mais Engajado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topUser ? (
              <>
                <div className="text-lg font-bold text-white truncate">{topUser.nome}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#C7A347] font-mono font-bold">{topUser.xp_total} XP</span>
                  <Badge className="bg-[#C7A347]/20 text-[#C7A347] text-[10px]">
                    Nível {topUser.level}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage Overview */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#C7A347]" /> Uso por Feature
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(FEATURE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const count = featureStats[key as keyof typeof featureStats];
              const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color.split(" ")[1]}`} />
                    <span className="text-sm text-slate-300 font-medium">{config.label}</span>
                  </div>
                  <Progress value={percentage} className="h-2 bg-slate-800 [&>*]:bg-current" />
                  <p className="text-xs text-slate-500">
                    {count} usuários ({percentage.toFixed(0)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#C7A347]" /> Ranking de Aderência
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950">
              <TableRow className="border-slate-800 hover:bg-slate-950">
                <TableHead className="w-[60px] text-center text-slate-400">#</TableHead>
                <TableHead className="text-slate-400">Usuário</TableHead>
                <TableHead className="w-[100px] text-center text-slate-400">XP Total</TableHead>
                <TableHead className="w-[80px] text-center text-slate-400">Nível</TableHead>
                <TableHead className="text-slate-400">Features Utilizadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    Nenhum dado de aderência encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className={`border-slate-800 hover:bg-slate-800/50 ${index < 3 ? "bg-slate-900/50" : ""}`}
                  >
                    <TableCell className="text-center">{getRankIcon(index)}</TableCell>
                    <TableCell className="font-medium text-white">{user.nome}</TableCell>
                    <TableCell className="text-center font-mono text-[#C7A347] font-bold">
                      {user.xp_total}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-slate-700 text-slate-300 font-mono"
                      >
                        {user.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {getFeatureBadge("PCP", user.features.PCP)}
                        {getFeatureBadge("DIARIO", user.features.DIARIO)}
                        {getFeatureBadge("PMP", user.features.PMP)}
                        {getFeatureBadge("PLAYBOOK", user.features.PLAYBOOK)}
                        {Object.values(user.features).every((v) => v === 0) && (
                          <span className="text-xs text-slate-600 italic">Sem atividade</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
