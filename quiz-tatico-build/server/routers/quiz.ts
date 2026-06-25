import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getTodayQuiz,
  getUserQuizAttempts,
  recordAttempt,
  updateUserStats,
  calculateAndUpdateRankings,
  getDailyRanking,
  getOrCreateUserStats,
  checkRateLimit,
  getGlobalRanking,
} from "../db";
import { TRPCError } from "@trpc/server";

const MAX_ATTEMPTS = 6;

// Normalize answer for comparison: lowercase, trim, remove accents
function normalizeAnswer(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function checkAnswer(guess: string, correct: string): "correct" | "partial" | "wrong" {
  const normalGuess = normalizeAnswer(guess);
  const normalCorrect = normalizeAnswer(correct);

  if (normalGuess === normalCorrect) return "correct";

  // Check if one contains the other (e.g., "Brasil" vs "Seleção Brasileira")
  if (normalGuess.includes(normalCorrect) || normalCorrect.includes(normalGuess)) {
    return "partial";
  }

  // Check word overlap (>= 60% of words match)
  const guessWords = normalGuess.split(" ").filter(Boolean);
  const correctWords = normalCorrect.split(" ").filter(Boolean);
  const matchingWords = guessWords.filter(w => correctWords.includes(w));
  if (correctWords.length > 0 && matchingWords.length / correctWords.length >= 0.6) {
    return "partial";
  }

  return "wrong";
}

export const quizRouter = router({
  getToday: publicProcedure.query(async () => {
    const quiz = await getTodayQuiz();
    if (!quiz) return null;
    return {
      id: quiz.id,
      quizDate: quiz.quizDate,
      formation: quiz.formation,
      players: quiz.players,
      answerType: quiz.answerType,
      difficulty: quiz.difficulty,
      hint: quiz.hint,
    };
  }),

  getTodayAttempts: protectedProcedure.query(async ({ ctx }) => {
    const quiz = await getTodayQuiz();
    if (!quiz) return [];
    const userAttempts = await getUserQuizAttempts(ctx.user.id, quiz.id);
    return userAttempts.map((attempt) => ({
      id: attempt.id,
      guess: attempt.guess,
      feedback: attempt.feedback,
      attemptNumber: attempt.attemptNumber,
      isWinning: attempt.isWinning,
      createdAt: attempt.createdAt,
    }));
  }),

  submitGuess: protectedProcedure
    .input(
      z.object({
        guess: z.string().min(1).max(255).trim(),
        timeSeconds: z.number().int().min(0).max(86400),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting: max 30 guesses per hour per user
      const rateCheck = await checkRateLimit(
        `user:${ctx.user.id}`,
        "submitGuess",
        30,
        3600
      );
      if (!rateCheck.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Muitas tentativas. Tente novamente mais tarde.",
        });
      }

      const quiz = await getTodayQuiz();
      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhum quiz disponível hoje.",
        });
      }

      const userAttempts = await getUserQuizAttempts(ctx.user.id, quiz.id);
      const alreadyWon = userAttempts.some((a) => a.isWinning);
      if (alreadyWon) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Você já completou o quiz de hoje!",
        });
      }

      if (userAttempts.length >= MAX_ATTEMPTS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Número máximo de tentativas atingido.",
        });
      }

      // Server-side answer validation
      const feedback = checkAnswer(input.guess, quiz.correctAnswer);
      const isWinning = feedback === "correct";

      await recordAttempt({
        userId: ctx.user.id,
        quizId: quiz.id,
        guess: input.guess.slice(0, 255),
        feedback,
        attemptNumber: userAttempts.length + 1,
        timeSeconds: Math.max(0, Math.min(input.timeSeconds, 86400)),
        isWinning,
      });

      const isLastAttempt = userAttempts.length + 1 === MAX_ATTEMPTS;

      if (isWinning) {
        await updateUserStats(ctx.user.id, true, userAttempts.length + 1, input.timeSeconds);
        await calculateAndUpdateRankings(quiz.id);
      } else if (isLastAttempt) {
        await updateUserStats(ctx.user.id, false, MAX_ATTEMPTS, input.timeSeconds);
      }

      return {
        feedback,
        isWinning,
        attemptNumber: userAttempts.length + 1,
        attemptsRemaining: MAX_ATTEMPTS - (userAttempts.length + 1),
        // Reveal answer only when game is over
        correctAnswer: (isWinning || isLastAttempt) ? quiz.correctAnswer : undefined,
      };
    }),

  getDailyRanking: publicProcedure.query(async () => {
    const quiz = await getTodayQuiz();
    if (!quiz) return [];
    return getDailyRanking(quiz.id);
  }),

  getGlobalRanking: publicProcedure.query(async () => {
    return getGlobalRanking();
  }),

  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreateUserStats(ctx.user.id);
  }),

  generateShareText: protectedProcedure.query(async ({ ctx }) => {
    const quiz = await getTodayQuiz();
    if (!quiz) return null;
    const userAttempts = await getUserQuizAttempts(ctx.user.id, quiz.id);
    if (userAttempts.length === 0) return null;

    const grid = userAttempts
      .map((attempt) => {
        if (attempt.feedback === "correct") return "🟩";
        if (attempt.feedback === "partial") return "🟨";
        return "⬛";
      })
      .join("");

    const won = userAttempts.some((a) => a.isWinning);
    const totalAttempts = userAttempts.length;
    const result = won ? `${totalAttempts}/${MAX_ATTEMPTS}` : "X/6";

    return {
      grid,
      title: `QuizTático ${quiz.quizDate}`,
      result,
      shareText: `🏟️ QuizTático ${quiz.quizDate}\n${result}\n\n${grid}\n\nJogue em: https://quiz-tatico.app`,
    };
  }),
});
