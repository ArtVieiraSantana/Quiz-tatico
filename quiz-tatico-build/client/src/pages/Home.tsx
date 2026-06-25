import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FootballPitch } from "@/components/FootballPitch";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import {
  Loader2, Trophy, Share2, Target, Clock, Zap,
  ChevronRight, Star, TrendingUp, Medal, LogOut, BarChart2
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAuth as useAuthHook } from "@/_core/hooks/useAuth";

const MAX_ATTEMPTS = 6;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function AttemptRow({
  attempt,
  index,
}: {
  attempt: { guess: string; feedback: string; attemptNumber: number };
  index: number;
}) {
  const colors = {
    correct: "border-green-500 bg-green-500/20 text-green-300",
    partial: "border-yellow-500 bg-yellow-500/20 text-yellow-300",
    wrong: "border-zinc-600 bg-zinc-800/50 text-zinc-400",
  };
  const icons = { correct: "🟩", partial: "🟨", wrong: "⬛" };
  const color = colors[attempt.feedback as keyof typeof colors] || colors.wrong;
  const icon = icons[attempt.feedback as keyof typeof icons] || "⬛";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${color} animate-fadeInUp`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono opacity-60 w-4">{attempt.attemptNumber}</span>
        <span className="font-semibold">{attempt.guess}</span>
      </div>
      <span className="text-lg">{icon}</span>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">Próximo desafio em</p>
      <p className="text-2xl font-mono font-bold text-primary">{timeLeft}</p>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [guess, setGuess] = useState("");
  const [timeStart, setTimeStart] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: todayQuiz, isLoading: quizLoading } = trpc.quiz.getToday.useQuery();
  const { data: attempts, refetch: refetchAttempts } = trpc.quiz.getTodayAttempts.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: dailyRanking } = trpc.quiz.getDailyRanking.useQuery();
  const { data: shareData } = trpc.quiz.generateShareText.useQuery(
    undefined,
    { enabled: isAuthenticated && !!(attempts?.some((a) => a.isWinning)) }
  );
  const submitGuessMutation = trpc.quiz.submitGuess.useMutation();

  useEffect(() => {
    if (isAuthenticated && !timeStart) {
      setTimeStart(Date.now());
    }
  }, [isAuthenticated, timeStart]);

  useEffect(() => {
    if (!timeStart) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - timeStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeStart]);

  const hasWon = attempts?.some((a) => a.isWinning);
  const isGameOver = hasWon || (attempts?.length || 0) >= MAX_ATTEMPTS;
  const attemptsLeft = MAX_ATTEMPTS - (attempts?.length || 0);

  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !isAuthenticated || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const timeSeconds = Math.floor((Date.now() - timeStart) / 1000);
      const result = await submitGuessMutation.mutateAsync({ guess: guess.trim(), timeSeconds });
      setGuess("");
      await refetchAttempts();

      if (result.isWinning) {
        toast.success("🎉 Correto! Você é um ótimo técnico!", { duration: 4000 });
      } else if (result.feedback === "partial") {
        toast.warning("🟨 Quase lá! Tente novamente.", { duration: 2500 });
      } else {
        const msgs = ["❌ Não foi dessa vez!", "⬛ Errado. Continue tentando!", "🤔 Quase... mas não!"];
        toast.error(msgs[Math.floor(Math.random() * msgs.length)], { duration: 2000 });
      }

      if (result.attemptsRemaining === 0 && !result.isWinning) {
        toast.info(`A resposta era: ${result.correctAnswer}`, { duration: 8000 });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar resposta");
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleShare = async () => {
    if (!shareData) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareData.title, text: shareData.shareText });
      } else {
        await navigator.clipboard.writeText(shareData.shareText);
        toast.success("Resultado copiado! Cole onde quiser 📋");
      }
    } catch {
      toast.error("Não foi possível compartilhar");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background pitch effect */}
        <div className="absolute inset-0 opacity-5">
          <FootballPitch
            formation={[
              { position: "GK", x: 50, y: 90 },
              { position: "CB", x: 35, y: 75 }, { position: "CB", x: 65, y: 75 },
              { position: "LB", x: 18, y: 72 }, { position: "RB", x: 82, y: 72 },
              { position: "CM", x: 30, y: 52 }, { position: "CM", x: 50, y: 48 }, { position: "CM", x: 70, y: 52 },
              { position: "LW", x: 20, y: 28 }, { position: "ST", x: 50, y: 20 }, { position: "RW", x: 80, y: 28 },
            ]}
            showNames={false}
          />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center space-y-8">
          <div>
            <div className="text-7xl mb-4">🏟️</div>
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-2">
              Quiz<span className="text-primary">Tático</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Adivinhe o time pela escalação
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4">
            {[
              { icon: "🏆", label: "Ranking Global" },
              { icon: "📊", label: "Seu Histórico" },
              { icon: "🔥", label: "Streak Diário" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full text-base font-bold py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl glow-green transition-all"
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
          >
            Entrar para Jogar
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="text-xs text-muted-foreground">Um novo desafio todo dia às 00:00</p>
        </div>
      </div>
    );
  }

  if (quizLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando desafio de hoje...</p>
        </div>
      </div>
    );
  }

  if (!todayQuiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-6xl">😴</div>
          <h2 className="text-2xl font-bold">Sem Desafio Hoje</h2>
          <p className="text-muted-foreground">Volte amanhã para um novo desafio!</p>
          <CountdownTimer />
          {user?.role === "admin" && (
            <Button asChild className="w-full">
              <Link to="/admin">Criar Quiz como Admin</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const difficultyColors = {
    easy: "text-green-400 bg-green-400/10 border-green-400/30",
    medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    hard: "text-red-400 bg-red-400/10 border-red-400/30",
  };
  const difficultyLabels = { easy: "Fácil", medium: "Médio", hard: "Difícil" };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight">
            Quiz<span className="text-primary">Tático</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/ranking">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Trophy className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Ranking</span>
              </Button>
            </Link>
            <Link to="/stats">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <BarChart2 className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Stats</span>
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Star className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={async () => {
                await fetch("/api/trpc/auth.logout", { method: "POST" });
                window.location.href = "/";
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Header info */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Desafio do Dia</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{todayQuiz.quizDate}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${difficultyColors[todayQuiz.difficulty as keyof typeof difficultyColors]}`}>
                {difficultyLabels[todayQuiz.difficulty as keyof typeof difficultyLabels]}
              </span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border bg-secondary">
                {todayQuiz.answerType === "team" ? "⚽ Time" : todayQuiz.answerType === "coach" ? "👨‍💼 Técnico" : todayQuiz.answerType === "formation" ? "📋 Formação" : "⭐ Jogador"}
              </span>
            </div>
          </div>
          <div className="text-right">
            {!isGameOver && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {attemptsLeft > 0 && !isGameOver
                ? `${attemptsLeft} tentativa${attemptsLeft !== 1 ? "s" : ""} restante${attemptsLeft !== 1 ? "s" : ""}`
                : isGameOver
                ? `Usado: ${attempts?.length || 0}/6`
                : ""}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Pitch */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Escalação</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Quem jogava assim?
                </span>
              </div>
              <div className="p-4">
                <FootballPitch
                  formation={(todayQuiz.players as any[] || todayQuiz.formation as any[])}
                  showNames={isGameOver}
                />
              </div>
            </div>
          </div>

          {/* Right: Game */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hint */}
            {todayQuiz.hint && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex gap-3">
                <Zap className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-accent mb-0.5">DICA</p>
                  <p className="text-sm text-foreground/80">{todayQuiz.hint}</p>
                </div>
              </div>
            )}

            {/* Attempts */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Tentativas</span>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i < (attempts?.length || 0)
                          ? attempts?.[i]?.isWinning
                            ? "bg-green-500"
                            : attempts?.[i]?.feedback === "partial"
                            ? "bg-yellow-500"
                            : "bg-zinc-600"
                          : "bg-zinc-800 border border-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {attempts && attempts.length > 0 ? (
                <div className="space-y-2">
                  {attempts.map((attempt, idx) => (
                    <AttemptRow key={attempt.id} attempt={attempt} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  Ainda não há tentativas. Faça sua primeira!
                </div>
              )}

              {/* Input */}
              {!isGameOver && (
                <form onSubmit={handleSubmitGuess} className="flex gap-2 mt-4">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder={`Digite o ${todayQuiz.answerType === "team" ? "time" : todayQuiz.answerType === "coach" ? "técnico" : todayQuiz.answerType === "formation" ? "formação" : "jogador"}...`}
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1 bg-input border-border focus:border-primary"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !guess.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "→"}
                  </Button>
                </form>
              )}

              {/* Game Over State */}
              {isGameOver && (
                <div className={`mt-4 p-4 rounded-xl text-center ${
                  hasWon
                    ? "bg-green-500/20 border border-green-500/40"
                    : "bg-red-500/10 border border-red-500/30"
                }`}>
                  {hasWon ? (
                    <>
                      <p className="text-lg font-black text-green-400 mb-1">🎉 Você acertou!</p>
                      <p className="text-sm text-muted-foreground">
                        Em {attempts?.length} tentativa{attempts?.length !== 1 ? "s" : ""} · {formatTime(elapsedSeconds)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-black text-red-400 mb-1">😔 Fim de Jogo</p>
                      <p className="text-sm text-muted-foreground">
                        A resposta era: <span className="font-bold text-foreground">{shareData?.title?.split(" ").slice(2).join(" ")}</span>
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Share & Countdown */}
              {isGameOver && (
                <div className="mt-3 space-y-3">
                  {shareData && (
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="w-full border-border hover:border-primary hover:text-primary"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar Resultado
                    </Button>
                  )}
                  <CountdownTimer />
                </div>
              )}
            </div>

            {/* Daily ranking sidebar */}
            {dailyRanking && dailyRanking.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold">Top Hoje</span>
                </div>
                <div className="space-y-2">
                  {dailyRanking.slice(0, 5).map((entry, idx) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? "bg-yellow-500 text-black" :
                          idx === 1 ? "bg-zinc-400 text-black" :
                          idx === 2 ? "bg-amber-700 text-white" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-foreground truncate max-w-24">
                          {entry.userName || "Anônimo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span>{entry.totalAttempts}x</span>
                        <span>{formatTime(entry.completionTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/ranking">
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground">
                    Ver ranking completo →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
