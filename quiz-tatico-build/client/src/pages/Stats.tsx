import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Target, Zap, Clock } from "lucide-react";
import { Link } from "wouter";

function StatCard({ label, value, sub, icon: Icon, color = "text-primary" }: {
  label: string; value: string | number; sub?: string; icon: any; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className={`w-4 h-4 ${color} opacity-70`} />
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function Stats() {
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading } = trpc.quiz.getUserStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Faça login para ver suas estatísticas.</p>
          <Button asChild><Link to="/">Ir para o início</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">← Voltar</Button>
          </Link>
          <h1 className="text-lg font-black">
            Quiz<span className="text-primary">Tático</span>
            <span className="font-normal text-muted-foreground ml-2 text-sm">Minhas Estatísticas</span>
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Partidas"
                value={stats.totalGamesPlayed}
                icon={Target}
              />
              <StatCard
                label="Vitórias"
                value={stats.totalWins}
                sub={`${stats.totalGamesPlayed > 0 ? Math.round((stats.totalWins / stats.totalGamesPlayed) * 100) : 0}% de acerto`}
                icon={TrendingUp}
                color="text-primary"
              />
              <StatCard
                label="Streak Atual"
                value={stats.currentWinStreak}
                sub={`Máx: ${stats.bestWinStreak}`}
                icon={Zap}
                color="text-accent"
              />
              <StatCard
                label="Melhor Tempo"
                value={stats.bestTime ? `${stats.bestTime}s` : "—"}
                sub={stats.averageGuesses ? `Média: ${Number(stats.averageGuesses).toFixed(1)} tent.` : undefined}
                icon={Clock}
                color="text-blue-400"
              />
            </div>

            {/* Guess Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-5 text-sm uppercase tracking-wide text-muted-foreground">
                Distribuição de Tentativas
              </h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const dist = stats.guessDistribution as Record<string, number> || {};
                  const count = dist[String(n)] || 0;
                  const maxCount = Math.max(...Object.values(dist).map(Number), 1);
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={n} className="flex items-center gap-3">
                      <span className="w-4 text-right text-sm text-muted-foreground font-mono">{n}</span>
                      <div className="flex-1 bg-secondary rounded-full h-7 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full flex items-center px-3 transition-all duration-700"
                          style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                        >
                          {count > 0 && (
                            <span className="text-xs font-bold text-primary-foreground">{count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhuma estatística ainda. Jogue seu primeiro desafio!</p>
            <Button asChild className="mt-4"><Link to="/">Jogar Agora</Link></Button>
          </div>
        )}
      </main>
    </div>
  );
}
