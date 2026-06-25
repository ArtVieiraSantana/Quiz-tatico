import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { createQuiz, updateQuiz, deleteQuiz, getAllQuizzes } from "../db";

const playerSchema = z.object({
  position: z.string().min(1).max(10),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  playerName: z.string().optional(),
  isHidden: z.boolean().optional().default(false),
});

const formationSchema = z.array(
  z.object({
    position: z.string().min(1).max(10),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })
);

export const adminRouter = router({
  getAllQuizzes: adminProcedure.query(async () => {
    return getAllQuizzes();
  }),

  createQuiz: adminProcedure
    .input(
      z.object({
        quizDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        formation: formationSchema,
        players: z.array(playerSchema).optional(),
        correctAnswer: z.string().min(1).max(255),
        answerType: z.enum(["team", "coach", "formation", "player"]),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        hint: z.string().max(500).optional(),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      await createQuiz({
        quizDate: input.quizDate,
        formation: input.formation,
        players: input.players || null,
        correctAnswer: input.correctAnswer,
        answerType: input.answerType,
        difficulty: input.difficulty,
        hint: input.hint,
        isPublished: input.isPublished,
      });
      return { success: true };
    }),

  updateQuiz: adminProcedure
    .input(
      z.object({
        id: z.number(),
        quizDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        formation: formationSchema.optional(),
        players: z.array(playerSchema).optional(),
        correctAnswer: z.string().min(1).max(255).optional(),
        answerType: z.enum(["team", "coach", "formation", "player"]).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        hint: z.string().max(500).optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateQuiz(id, data as any);
      return { success: true };
    }),

  deleteQuiz: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteQuiz(input.id);
      return { success: true };
    }),

  seedSampleQuizzes: adminProcedure.mutation(async () => {
    const samples = [
      {
        quizDate: new Date().toISOString().split("T")[0]!,
        formation: [
          { position: "GK", x: 50, y: 90 },
          { position: "RB", x: 80, y: 72 },
          { position: "CB", x: 62, y: 75 },
          { position: "CB", x: 38, y: 75 },
          { position: "LB", x: 20, y: 72 },
          { position: "RM", x: 78, y: 52 },
          { position: "CM", x: 58, y: 48 },
          { position: "CM", x: 42, y: 48 },
          { position: "LM", x: 22, y: 52 },
          { position: "SS", x: 62, y: 28 },
          { position: "ST", x: 38, y: 22 },
        ],
        players: [
          { position: "GK", x: 50, y: 90, playerName: "Alisson", isHidden: false },
          { position: "RB", x: 80, y: 72, playerName: "Danilo", isHidden: false },
          { position: "CB", x: 62, y: 75, playerName: "Marquinhos", isHidden: false },
          { position: "CB", x: 38, y: 75, playerName: "Éder Militão", isHidden: false },
          { position: "LB", x: 20, y: 72, playerName: "Alex Sandro", isHidden: false },
          { position: "RM", x: 78, y: 52, playerName: "Raphinha", isHidden: false },
          { position: "CM", x: 58, y: 48, playerName: "Casemiro", isHidden: false },
          { position: "CM", x: 42, y: 48, playerName: "Lucas Paquetá", isHidden: false },
          { position: "LM", x: 22, y: 52, playerName: "Vinícius Jr", isHidden: false },
          { position: "SS", x: 62, y: 28, playerName: "Rodrygo", isHidden: false },
          { position: "ST", x: 38, y: 22, playerName: "Richarlison", isHidden: false },
        ],
        correctAnswer: "Brasil",
        answerType: "team" as const,
        difficulty: "easy" as const,
        hint: "Pentacampeã mundial 🏆",
        isPublished: true,
      },
    ];

    for (const sample of samples) {
      try {
        await createQuiz(sample);
      } catch (e) {
        // Ignore duplicate date errors
      }
    }
    return { success: true };
  }),
});
