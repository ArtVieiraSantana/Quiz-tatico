/**
 * Script para popular o banco com quizzes de exemplo
 * Execute com: pnpm seed
 */
import "dotenv/config";
import { getDb } from "../server/db";
import { quizzes } from "../drizzle/schema";

const SAMPLE_QUIZZES = [
  {
    quizDate: new Date().toISOString().split("T")[0]!,
    formation: [
      { position: "GK", x: 50, y: 90 },
      { position: "RB", x: 82, y: 72 }, { position: "CB", x: 62, y: 75 },
      { position: "CB", x: 38, y: 75 }, { position: "LB", x: 18, y: 72 },
      { position: "RM", x: 78, y: 52 }, { position: "CM", x: 58, y: 48 },
      { position: "CM", x: 42, y: 48 }, { position: "LM", x: 22, y: 52 },
      { position: "SS", x: 62, y: 28 }, { position: "ST", x: 38, y: 22 },
    ],
    players: [
      { position: "GK", x: 50, y: 90, playerName: "Alisson", isHidden: false },
      { position: "RB", x: 82, y: 72, playerName: "Danilo", isHidden: false },
      { position: "CB", x: 62, y: 75, playerName: "Marquinhos", isHidden: false },
      { position: "CB", x: 38, y: 75, playerName: "Militão", isHidden: false },
      { position: "LB", x: 18, y: 72, playerName: "Alex Sandro", isHidden: false },
      { position: "RM", x: 78, y: 52, playerName: "Raphinha", isHidden: false },
      { position: "CM", x: 58, y: 48, playerName: "Casemiro", isHidden: false },
      { position: "CM", x: 42, y: 48, playerName: "Paquetá", isHidden: false },
      { position: "LM", x: 22, y: 52, playerName: "Vinícius Jr", isHidden: false },
      { position: "SS", x: 62, y: 28, playerName: "Rodrygo", isHidden: false },
      { position: "ST", x: 38, y: 22, playerName: "Richarlison", isHidden: false },
    ],
    correctAnswer: "Brasil",
    answerType: "team",
    difficulty: "easy",
    hint: "Pentacampeã mundial 🏆 — a amarelinha",
    isPublished: true,
  },
  {
    quizDate: (() => {
      const d = new Date(); d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0]!;
    })(),
    formation: [
      { position: "GK", x: 50, y: 90 },
      { position: "RB", x: 80, y: 72 }, { position: "CB", x: 60, y: 76 },
      { position: "CB", x: 40, y: 76 }, { position: "LB", x: 20, y: 72 },
      { position: "CM", x: 65, y: 52 }, { position: "CM", x: 50, y: 48 }, { position: "CM", x: 35, y: 52 },
      { position: "RW", x: 80, y: 28 }, { position: "ST", x: 50, y: 20 }, { position: "LW", x: 20, y: 28 },
    ],
    players: [
      { position: "GK", x: 50, y: 90, playerName: "Ederson", isHidden: false },
      { position: "RB", x: 80, y: 72, playerName: "Walker", isHidden: false },
      { position: "CB", x: 60, y: 76, playerName: "Rúben Dias", isHidden: false },
      { position: "CB", x: 40, y: 76, playerName: "Akanji", isHidden: false },
      { position: "LB", x: 20, y: 72, playerName: "Gvardiol", isHidden: false },
      { position: "CM", x: 65, y: 52, playerName: "Rodri", isHidden: false },
      { position: "CM", x: 50, y: 48, playerName: "De Bruyne", isHidden: false },
      { position: "CM", x: 35, y: 52, playerName: "Bernardo", isHidden: false },
      { position: "RW", x: 80, y: 28, playerName: "Doku", isHidden: false },
      { position: "ST", x: 50, y: 20, playerName: "Haaland", isHidden: false },
      { position: "LW", x: 20, y: 28, playerName: "Foden", isHidden: false },
    ],
    correctAnswer: "Manchester City",
    answerType: "team",
    difficulty: "medium",
    hint: "Azul celeste — dominador da Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    isPublished: true,
  },
];

async function seed() {
  console.log("🌱 Populando banco de dados com quizzes de exemplo...\n");
  const db = getDb();

  for (const quiz of SAMPLE_QUIZZES) {
    try {
      await db.insert(quizzes).values(quiz as any);
      console.log(`✅ Quiz criado: ${quiz.correctAnswer} (${quiz.quizDate})`);
    } catch (e: any) {
      if (e.message?.includes("UNIQUE")) {
        console.log(`⚠️  Quiz já existe para ${quiz.quizDate}, pulando...`);
      } else {
        console.error(`❌ Erro:`, e.message);
      }
    }
  }

  console.log("\n✨ Seed concluído!");
  process.exit(0);
}

seed();
