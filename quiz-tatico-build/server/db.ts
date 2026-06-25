import { eq, and, asc, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import {
  InsertUser,
  users,
  quizzes,
  attempts,
  userStats,
  dailyRankings,
  rateLimits,
  InsertQuiz,
  InsertAttempt,
  InsertDailyRanking,
} from "../drizzle/schema";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "quiz-tatico.db");

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite);
    runMigrations(sqlite);
  }
  return _db;
}

function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      lastSignedIn TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizDate TEXT NOT NULL UNIQUE,
      formation TEXT NOT NULL,
      players TEXT,
      correctAnswer TEXT NOT NULL,
      answerType TEXT NOT NULL CHECK(answerType IN ('team','coach','formation','player')),
      difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
      hint TEXT,
      isPublished INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS quizDate_idx ON quizzes(quizDate);
    CREATE INDEX IF NOT EXISTS published_idx ON quizzes(isPublished);

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      quizId INTEGER NOT NULL,
      guess TEXT NOT NULL,
      feedback TEXT NOT NULL CHECK(feedback IN ('correct','partial','wrong')),
      attemptNumber INTEGER NOT NULL,
      timeSeconds INTEGER NOT NULL,
      isWinning INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS user_quiz_idx ON attempts(userId, quizId);
    CREATE INDEX IF NOT EXISTS userId_idx ON attempts(userId);
    CREATE INDEX IF NOT EXISTS quizId_idx ON attempts(quizId);

    CREATE TABLE IF NOT EXISTS userStats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      totalGamesPlayed INTEGER NOT NULL DEFAULT 0,
      totalWins INTEGER NOT NULL DEFAULT 0,
      currentWinStreak INTEGER NOT NULL DEFAULT 0,
      bestWinStreak INTEGER NOT NULL DEFAULT 0,
      guessDistribution TEXT NOT NULL DEFAULT '{}',
      averageGuesses REAL DEFAULT 0,
      bestTime INTEGER,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS userStats_userId_idx ON userStats(userId);

    CREATE TABLE IF NOT EXISTS dailyRankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      userName TEXT,
      rank INTEGER NOT NULL,
      totalAttempts INTEGER NOT NULL,
      completionTime INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS quiz_user_idx ON dailyRankings(quizId, userId);
    CREATE INDEX IF NOT EXISTS ranking_quizId_idx ON dailyRankings(quizId);

    CREATE TABLE IF NOT EXISTS rateLimits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      windowStart TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS identifier_action_idx ON rateLimits(identifier, action);
  `);
  seedDefaultQuizIfNeeded();
}

async function seedDefaultQuizIfNeeded() {
  try {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0]!;
    const existing = await db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.quizDate, today), eq(quizzes.isPublished, true)))
      .limit(1);

    if (existing.length > 0) return;

    await db.insert(quizzes).values({
      quizDate: today,
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
      answerType: "team",
      difficulty: "easy",
      hint: "Pentacampeã mundial 🏆",
      isPublished: true,
    } as any);
  } catch (error) {
    console.warn("[DB] Failed to seed default quiz", error);
  }
}

// ============ Rate Limiting ============
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const db = getDb();
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Clean old entries
  await db.delete(rateLimits).where(
    sql`${rateLimits.identifier} = ${identifier} AND ${rateLimits.action} = ${action} AND ${rateLimits.windowStart} < ${windowStart}`
  );

  const existing = await db
    .select()
    .from(rateLimits)
    .where(and(eq(rateLimits.identifier, identifier), eq(rateLimits.action, action)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(rateLimits).values({ identifier, action, count: 1, windowStart: new Date().toISOString() });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const current = existing[0]!;
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await db.update(rateLimits)
    .set({ count: current.count + 1 })
    .where(eq(rateLimits.id, current.id));

  return { allowed: true, remaining: maxRequests - current.count - 1 };
}

// ============ Users ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = getDb();

  const now = new Date().toISOString();
  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({
      ...user,
      role: user.openId === process.env.OWNER_OPEN_ID ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
  } else {
    await db.update(users).set({
      name: user.name ?? existing[0]!.name,
      email: user.email ?? existing[0]!.email,
      loginMethod: user.loginMethod ?? existing[0]!.loginMethod,
      lastSignedIn: now,
      updatedAt: now,
    }).where(eq(users.openId, user.openId));
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Quizzes ============
export async function getTodayQuiz() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0]!;
  const result = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.quizDate, today), eq(quizzes.isPublished, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getQuizByDate(date: string) {
  const db = getDb();
  const result = await db.select().from(quizzes).where(eq(quizzes.quizDate, date)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllQuizzes() {
  const db = getDb();
  return db.select().from(quizzes).orderBy(desc(quizzes.quizDate));
}

export async function createQuiz(data: InsertQuiz) {
  const db = getDb();
  return db.insert(quizzes).values(data);
}

export async function updateQuiz(id: number, data: Partial<InsertQuiz>) {
  const db = getDb();
  await db.update(quizzes).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(quizzes.id, id));
}

export async function deleteQuiz(id: number) {
  const db = getDb();
  await db.delete(quizzes).where(eq(quizzes.id, id));
}

// ============ Attempts ============
export async function getUserQuizAttempts(userId: number, quizId: number) {
  const db = getDb();
  return db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.quizId, quizId)))
    .orderBy(asc(attempts.attemptNumber));
}

export async function recordAttempt(data: InsertAttempt) {
  const db = getDb();
  return db.insert(attempts).values(data);
}

// ============ User Stats ============
export async function getOrCreateUserStats(userId: number) {
  const db = getDb();
  let stats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);

  if (stats.length === 0) {
    await db.insert(userStats).values({
      userId,
      totalGamesPlayed: 0,
      totalWins: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
      guessDistribution: {},
    });
    stats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  }

  return stats[0]!;
}

export async function updateUserStats(
  userId: number,
  won: boolean,
  guessCount: number,
  completionTime: number
) {
  const db = getDb();
  const stats = await getOrCreateUserStats(userId);
  const distribution = (stats.guessDistribution as Record<string, number>) || {};
  const guessKey = String(guessCount);
  distribution[guessKey] = (distribution[guessKey] || 0) + 1;

  const newWinStreak = won ? (stats.currentWinStreak || 0) + 1 : 0;
  const newBestStreak = Math.max(stats.bestWinStreak || 0, newWinStreak);
  const bestTime = won
    ? (stats.bestTime ? Math.min(stats.bestTime, completionTime) : completionTime)
    : stats.bestTime;
  const newTotal = (stats.totalGamesPlayed || 0) + 1;
  const currentAvg = stats.averageGuesses || 0;
  const newAvg = ((stats.totalGamesPlayed || 0) * currentAvg + guessCount) / newTotal;

  await db.update(userStats).set({
    totalGamesPlayed: newTotal,
    totalWins: won ? (stats.totalWins || 0) + 1 : stats.totalWins,
    currentWinStreak: newWinStreak,
    bestWinStreak: newBestStreak,
    guessDistribution: distribution,
    bestTime: bestTime ?? null,
    averageGuesses: newAvg,
    updatedAt: new Date().toISOString(),
  }).where(eq(userStats.userId, userId));
}

export async function getGlobalRanking() {
  const db = getDb();
  const result = await db
    .select({
      userId: userStats.userId,
      name: users.name,
      totalWins: userStats.totalWins,
      totalGamesPlayed: userStats.totalGamesPlayed,
      currentWinStreak: userStats.currentWinStreak,
      bestWinStreak: userStats.bestWinStreak,
      averageGuesses: userStats.averageGuesses,
      bestTime: userStats.bestTime,
    })
    .from(userStats)
    .innerJoin(users, eq(userStats.userId, users.id))
    .orderBy(desc(userStats.totalWins), userStats.averageGuesses)
    .limit(50);
  return result;
}

// ============ Daily Rankings ============
export async function getDailyRanking(quizId: number) {
  const db = getDb();
  return db
    .select()
    .from(dailyRankings)
    .where(eq(dailyRankings.quizId, quizId))
    .orderBy(asc(dailyRankings.rank))
    .limit(20);
}

export async function recordRankingEntry(data: InsertDailyRanking) {
  const db = getDb();
  return db.insert(dailyRankings).values(data);
}

export async function calculateAndUpdateRankings(quizId: number) {
  const db = getDb();

  // Get all winning attempts for this quiz, join with user name
  const winningAttempts = await db
    .select({
      userId: attempts.userId,
      attemptNumber: attempts.attemptNumber,
      timeSeconds: attempts.timeSeconds,
      name: users.name,
    })
    .from(attempts)
    .innerJoin(users, eq(attempts.userId, users.id))
    .where(and(eq(attempts.quizId, quizId), eq(attempts.isWinning, true)))
    .orderBy(asc(attempts.attemptNumber), asc(attempts.timeSeconds));

  await db.delete(dailyRankings).where(eq(dailyRankings.quizId, quizId));

  let rank = 1;
  for (const attempt of winningAttempts) {
    await recordRankingEntry({
      quizId,
      userId: attempt.userId,
      userName: attempt.name || "Anonymous",
      rank,
      totalAttempts: attempt.attemptNumber,
      completionTime: attempt.timeSeconds,
    });
    rank++;
  }
}
