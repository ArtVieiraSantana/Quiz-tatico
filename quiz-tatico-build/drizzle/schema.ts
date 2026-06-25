import { int, text, integer, sqliteTable, real, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`(datetime('now'))`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Daily quiz challenges
 */
export const quizzes = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizDate: text("quizDate").notNull().unique(),
  formation: text("formation", { mode: "json" }).notNull(),
  /** Players data: [{position, x, y, playerName?, isHidden}] */
  players: text("players", { mode: "json" }),
  correctAnswer: text("correctAnswer").notNull(),
  answerType: text("answerType", { enum: ["team", "coach", "formation", "player"] }).notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).default("medium").notNull(),
  hint: text("hint"),
  isPublished: integer("isPublished", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  quizDateIdx: index("quizDate_idx").on(table.quizDate),
  publishedIdx: index("published_idx").on(table.isPublished),
}));

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

/**
 * User attempts at daily quizzes
 */
export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  quizId: integer("quizId").notNull(),
  guess: text("guess").notNull(),
  feedback: text("feedback", { enum: ["correct", "partial", "wrong"] }).notNull(),
  attemptNumber: integer("attemptNumber").notNull(),
  timeSeconds: integer("timeSeconds").notNull(),
  isWinning: integer("isWinning", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  userQuizIdx: index("user_quiz_idx").on(table.userId, table.quizId),
  userIdIdx: index("userId_idx").on(table.userId),
  quizIdIdx: index("quizId_idx").on(table.quizId),
}));

export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = typeof attempts.$inferInsert;

/**
 * User statistics
 */
export const userStats = sqliteTable("userStats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  totalGamesPlayed: integer("totalGamesPlayed").default(0).notNull(),
  totalWins: integer("totalWins").default(0).notNull(),
  currentWinStreak: integer("currentWinStreak").default(0).notNull(),
  bestWinStreak: integer("bestWinStreak").default(0).notNull(),
  guessDistribution: text("guessDistribution", { mode: "json" }).notNull().default('{}'),
  averageGuesses: real("averageGuesses").default(0),
  bestTime: integer("bestTime"),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  userIdIdx: index("userStats_userId_idx").on(table.userId),
}));

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;

/**
 * Daily rankings snapshot
 */
export const dailyRankings = sqliteTable("dailyRankings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizId: integer("quizId").notNull(),
  userId: integer("userId").notNull(),
  userName: text("userName"),
  rank: integer("rank").notNull(),
  totalAttempts: integer("totalAttempts").notNull(),
  completionTime: integer("completionTime").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  quizUserIdx: index("quiz_user_idx").on(table.quizId, table.userId),
  quizIdIdx: index("ranking_quizId_idx").on(table.quizId),
}));

export type DailyRanking = typeof dailyRankings.$inferSelect;
export type InsertDailyRanking = typeof dailyRankings.$inferInsert;

/**
 * Rate limiting table
 */
export const rateLimits = sqliteTable("rateLimits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  identifier: text("identifier").notNull(),
  action: text("action").notNull(),
  count: integer("count").default(1).notNull(),
  windowStart: text("windowStart").default(sql`(datetime('now'))`).notNull(),
}, (table) => ({
  identifierActionIdx: index("identifier_action_idx").on(table.identifier, table.action),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(attempts),
  stats: many(userStats),
  rankings: many(dailyRankings),
}));

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  attempts: many(attempts),
  rankings: many(dailyRankings),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  user: one(users, { fields: [attempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [attempts.quizId], references: [quizzes.id] }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, { fields: [userStats.userId], references: [users.id] }),
}));

export const dailyRankingsRelations = relations(dailyRankings, ({ one }) => ({
  user: one(users, { fields: [dailyRankings.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [dailyRankings.quizId], references: [quizzes.id] }),
}));
