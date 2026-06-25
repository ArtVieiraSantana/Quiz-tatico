import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { securityHeaders, globalRateLimit } from "./security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`Nenhuma porta disponível a partir de ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middlewares de segurança (primeiro!)
  app.use(securityHeaders);
  app.use(globalRateLimit(300, 60_000)); // 300 req/min por IP

  // Body parser
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // Rotas do sistema
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // API tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        if (error.code !== "UNAUTHORIZED" && error.code !== "FORBIDDEN") {
          console.error(`[tRPC Error] ${path}:`, error.message);
        }
      },
    })
  );

  // Frontend
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Porta ${preferredPort} ocupada, usando porta ${port}`);
  }

  server.listen(port, () => {
    console.log(`\n🏟️  QuizTático rodando em http://localhost:${port}/`);
    console.log(`📊  Banco de dados: ${process.env.DATABASE_PATH || "./data/quiz-tatico.db"}`);
    console.log(`🌍  Ambiente: ${process.env.NODE_ENV || "development"}\n`);
  });
}

startServer().catch(console.error);
