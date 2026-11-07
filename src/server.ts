import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { PrismaClient, type UserRole } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production");
}
if (!jwtSecret) {
  console.warn("JWT_SECRET is missing; authentication routes are disabled until configured.");
}

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole };
    }
  }
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? false }));
app.use(express.json({ limit: "256kb" }));

function issueToken(user: { id: string; role: UserRole }): string {
  if (!jwtSecret) throw new Error("Authentication is not configured");
  return jwt.sign({ role: user.role }, jwtSecret, {
    subject: user.id,
    expiresIn: "15m",
    issuer: "evty-api",
    audience: "evty-client"
  });
}

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue" } });
    return;
  }
  if (!jwtSecret) {
    res.status(503).json({ error: { code: "AUTH_UNAVAILABLE", message: "Authentication is not configured" } });
    return;
  }
  try {
    const decoded = jwt.verify(header.slice(7), jwtSecret, {
      issuer: "evty-api",
      audience: "evty-client",
      algorithms: ["HS256"]
    }) as JwtPayload & { role?: UserRole };
    if (!decoded.sub || !decoded.role) {
      res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid access token" } });
      return;
    }
    req.auth = { userId: decoded.sub, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid or expired access token" } });
  }
}

function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" } });
      return;
    }
    next();
  };
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "evty-api" });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "unavailable", database: "disconnected" });
  }
});

const registerSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(128),
  role: z.enum(["ATTENDEE", "ORGANIZER"]).default("ATTENDEE")
});

app.post("/api/v1/auth/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (existing) {
      res.status(409).json({ error: { code: "ACCOUNT_EXISTS", message: "An account with this email already exists" } });
      return;
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        passwordHash,
        role: parsed.data.role
      },
      select: { id: true, email: true, displayName: true, role: true }
    });
    res.status(201).json({ data: { user, accessToken: issueToken(user) } });
  } catch (error) {
    next(error);
  }
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
});

app.post("/api/v1/auth/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" } });
      return;
    }
    const safeUser = { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
    res.status(200).json({ data: { user: safeUser, accessToken: issueToken(user) } });
  } catch (error) {
    next(error);
  }
});

const createEventSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(10000).optional(),
  venueName: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()).default("NGN")
}).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
  message: "Event end must be after event start",
  path: ["endsAt"]
});

app.get("/api/v1/events", async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { startsAt: "asc" },
      take: 50,
      select: {
        id: true, title: true, description: true, venueName: true, city: true,
        startsAt: true, endsAt: true, currency: true, status: true
      }
    });
    res.json({ data: events });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/v1/events",
  authenticate,
  requireRole("ORGANIZER"),
  async (req, res, next) => {
    try {
      const parsed = createEventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
        return;
      }
      const event = await prisma.event.create({
        data: {
          ...parsed.data,
          organizerId: req.auth!.userId,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: new Date(parsed.data.endsAt),
          status: "DRAFT"
        },
        select: {
          id: true, organizerId: true, title: true, description: true, venueName: true,
          city: true, startsAt: true, endsAt: true, currency: true, status: true, createdAt: true
        }
      });
      res.status(201).json({ data: event });
    } catch (error) {
      next(error);
    }
  }
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Never send internal exception details or secrets to clients.
  console.error(JSON.stringify({ level: "error", event: "request_error", errorName: error instanceof Error ? error.name : "unknown" }));
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
});

const server = app.listen(port, () => {
  console.log(JSON.stringify({ level: "info", event: "server_started", port }));
});

async function shutdown(signal: string) {
  console.log(JSON.stringify({ level: "info", event: "shutdown", signal }));
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
