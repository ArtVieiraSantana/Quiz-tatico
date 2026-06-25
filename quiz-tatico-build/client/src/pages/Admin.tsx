import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Eye, EyeOff, Trash2, Edit3, ChevronRight, Check } from "lucide-react";
import { Link } from "wouter";
import { FootballPitch } from "@/components/FootballPitch";

const PRESET_FORMATIONS: Record<string, Array<{position: string; x: number; y: number}>> = {
  "4-3-3": [
    { position: "GK", x: 50, y: 90 },
    { position: "RB", x: 82, y: 72 }, { position: "CB", x: 62, y: 75 }, { position: "CB", x: 38, y: 75 }, { position: "LB", x: 18, y: 72 },
    { position: "CM", x: 70, y: 52 }, { position: "CM", x: 50, y: 48 }, { position: "CM", x: 30, y: 52 },
    { position: "RW", x: 80, y: 28 }, { position: "ST", x: 50, y: 20 }, { position: "LW", x: 20, y: 28 },
  ],
  "4-4-2": [
    { position: "GK", x: 50, y: 90 },
    { position: "RB", x: 82, y: 72 }, { position: "CB", x: 62, y: 75 }, { position: "CB", x: 38, y: 75 }, { position: "LB", x: 18, y: 72 },
    { position: "RM", x: 80, y: 52 }, { position: "CM", x: 60, y: 50 }, { position: "CM", x: 40, y: 50 }, { position: "LM", x: 20, y: 52 },
    { position: "ST", x: 62, y: 24 }, { position: "ST", x: 38, y: 24 },
  ],
  "3-5-2": [
    { position: "GK", x: 50, y: 90 },
    { position: "CB", x: 70, y: 76 }, { position: "CB", x: 50, y: 78 }, { position: "CB", x: 30, y: 76 },
    { position: "RWB", x: 85, y: 58 }, { position: "CM", x: 65, y: 52 }, { position: "CM", x: 50, y: 48 }, { position: "CM", x: 35, y: 52 }, { position: "LWB", x: 15, y: 58 },
    { position: "ST", x: 62, y: 24 }, { position: "ST", x: 38, y: 24 },
  ],
  "4-2-3-1": [
    { position: "GK", x: 50, y: 90 },
    { position: "RB", x: 82, y: 72 }, { position: "CB", x: 62, y: 75 }, { position: "CB", x: 38, y: 75 }, { position: "LB", x: 18, y: 72 },
    { position: "DM", x: 62, y: 57 }, { position: "DM", x: 38, y: 57 },
    { position: "RM", x: 78, y: 40 }, { position: "AM", x: 50, y: 38 }, { position: "LM", x: 22, y: 40 },
    { position: "ST", x: 50, y: 20 },
  ],
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [selectedFormationKey, setSelectedFormationKey] = useState("4-3-3");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [answerType, setAnswerType] = useState<"team" | "coach" | "formation" | "player">("team");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [hint, setHint] = useState("");
  const [quizDate, setQuizDate] = useState(new Date().toISOString().split("T")[0]!);
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: quizzes, refetch } = trpc.admin.getAllQuizzes.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createQuizMutation = trpc.admin.createQuiz.useMutation();
  const updateQuizMutation = trpc.admin.updateQuiz.useMutation();
  const deleteQuizMutation = trpc.admin.deleteQuiz.useMutation();
  const seedMutation = trpc.admin.seedSampleQuizzes.useMutation();

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
          <Button asChild><Link to="/">Ir para o início</Link></Button>
        </div>
      </div>
    );
  }

  const formation = PRESET_FORMATIONS[selectedFormationKey] || PRESET_FORMATIONS["4-3-3"]!;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctAnswer.trim()) return toast.error("Informe a resposta correta.");
    setIsSubmitting(true);
    try {
      await createQuizMutation.mutateAsync({
        quizDate,
        formation,
        correctAnswer: correctAnswer.trim(),
        answerType,
        difficulty,
        hint: hint.trim() || undefined,
        isPublished,
      });
      toast.success("Quiz criado com sucesso! 🎉");
      setCorrectAnswer("");
      setHint("");
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (id: number, current: boolean) => {
    try {
      await updateQuizMutation.mutateAsync({ id, isPublished: !current });
      await refetch();
      toast.success(current ? "Quiz despublicado" : "Quiz publicado!");
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que quer excluir este quiz?")) return;
    try {
      await deleteQuizMutation.mutateAsync({ id });
      await refetch();
      toast.success("Quiz excluído.");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">← Voltar</Button>
          </Link>
          <h1 className="text-lg font-black">
            Quiz<span className="text-primary">Tático</span>
            <span className="font-normal text-muted-foreground ml-2 text-sm">Admin</span>
          </h1>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await seedMutation.mutateAsync();
                  await refetch();
                  toast.success("Quizzes de exemplo criados!");
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
              disabled={seedMutation.isPending}
            >
              Seed Exemplos
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Quiz Form */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Criar Quiz
            </h2>
            <form onSubmit={handleCreate} className="space-y-5">
              {/* Formation selector */}
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">Formação</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(PRESET_FORMATIONS).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedFormationKey(key)}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                        selectedFormationKey === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {key}
                      {selectedFormationKey === key && <Check className="inline w-3.5 h-3.5 ml-1.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pitch preview */}
              <div className="bg-card border border-border rounded-xl overflow-hidden p-3">
                <FootballPitch formation={formation} showNames={false} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Data</label>
                  <Input
                    type="date"
                    value={quizDate}
                    onChange={(e) => setQuizDate(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Tipo de Resposta</label>
                  <select
                    value={answerType}
                    onChange={(e) => setAnswerType(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                  >
                    <option value="team">⚽ Time</option>
                    <option value="coach">👨‍💼 Técnico</option>
                    <option value="formation">📋 Formação</option>
                    <option value="player">⭐ Jogador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Resposta Correta</label>
                <Input
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="ex: Brasil, Guardiola, 4-3-3..."
                  className="bg-input border-border"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Dica (opcional)</label>
                <Input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Uma dica para os jogadores..."
                  className="bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Dificuldade</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground"
                  >
                    <option value="easy">🟢 Fácil</option>
                    <option value="medium">🟡 Médio</option>
                    <option value="hard">🔴 Difícil</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Status</label>
                  <button
                    type="button"
                    onClick={() => setIsPublished(!isPublished)}
                    className={`w-full h-10 rounded-md border text-sm font-semibold transition-all px-3 ${
                      isPublished
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {isPublished ? "✓ Publicado" : "○ Rascunho"}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Criar Quiz
              </Button>
            </form>
          </section>

          {/* Quiz List */}
          <section>
            <h2 className="text-xl font-bold mb-6">Quizzes Cadastrados</h2>
            {quizzes && quizzes.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{quiz.correctAnswer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{quiz.quizDate}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{quiz.answerType}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          quiz.isPublished ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"
                        }`}>
                          {quiz.isPublished ? "publicado" : "rascunho"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}
                        className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        {quiz.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quiz.id)}
                        className="w-8 h-8 p-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                <p>Nenhum quiz criado ainda.</p>
                <p className="text-sm mt-1">Crie seu primeiro quiz! →</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
