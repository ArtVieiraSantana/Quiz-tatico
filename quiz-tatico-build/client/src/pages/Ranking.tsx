import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Medal, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function Ranking() {
  const { data: globalRanking, isLoading } = trpc.quiz.getGlobalRanking.useQuery();
  const { data: dailyRanking, isLoading: dailyLoading } = trpc.quiz.getDailyRanking.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">← Voltar</Button>
          </Link>
          <h1 className="text-lg font-black">
            Quiz<span className="text-primary">Tático</span>
            <span className="font-normal text-muted-foreground ml-2 text-sm">Ranking</span>
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Daily Ranking */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold">Top Hoje</h2>
              <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("pt-BR")}</span>
            </div>

            {dailyLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : dailyRanking && dailyRanking.length > 0 ? (
              <div className="space-y-2">
                {dailyRanking.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      idx === 0 ? "bg-yellow-500 text-black" :
                      idx === 1 ? "bg-zinc-400 text-black" :
                      idx === 2 ? "bg-amber-700 text-white" :
                      "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{entry.userName || "Anônimo"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-foreground font-semibold">{entry.totalAttempts} tentativa{entry.totalAttempts !== 1 ? "s" : ""}</p>
                      <p className="text-muted-foreground text-xs">{formatTime(entry.completionTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ninguém completou o desafio ainda hoje.</p>
                <p className="text-sm mt-1">Seja o primeiro! 🏆</p>
              </div>
            )}
          </section>

          {/* Global Ranking */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Medal className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Ranking Global</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : globalRanking && globalRanking.length > 0 ? (
              <div className="space-y-2">
                {globalRanking.map((entry, idx) => {
                  const winRate = entry.totalGamesPlayed > 0
                    ? Math.round((entry.totalWins / entry.totalGamesPlayed) * 100)
                    : 0;
                  return (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        idx === 0 ? "bg-yellow-500 text-black" :
                        idx === 1 ? "bg-zinc-400 text-black" :
                        idx === 2 ? "bg-amber-700 text-white" :
                        "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{entry.name || "Anônimo"}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.bestWinStreak > 0 && `🔥 ${entry.bestWinStreak} streak`}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-primary font-bold">{entry.totalWins} vitórias</p>
                        <p className="text-muted-foreground text-xs">{winRate}% acerto</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ainda sem dados globais.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
