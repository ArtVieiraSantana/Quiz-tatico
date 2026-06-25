import type { Request, Response, NextFunction } from "express";

/**
 * Middleware de segurança global
 * - Headers de segurança HTTP
 * - Proteção básica contra ataques comuns
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Previne clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Previne MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Controla informações do referrer
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Básico CSP
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
  // Força HTTPS em produção
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

/**
 * Middleware de rate limiting por IP para rotas públicas
 * Limita requisições brutas de um mesmo IP
 */
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

export function globalRateLimit(maxReq: number = 200, windowMs: number = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = ipRequestCounts.get(ip);

    if (!entry || entry.resetAt < now) {
      ipRequestCounts.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > maxReq) {
      res.status(429).json({ error: "Muitas requisições. Tente novamente em breve." });
      return;
    }

    next();
  };
}

// Limpa entradas antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of Array.from(ipRequestCounts.entries())) {
    if (entry.resetAt < now) ipRequestCounts.delete(ip);
  }
}, 5 * 60_000);
