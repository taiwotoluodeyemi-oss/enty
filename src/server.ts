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
    await prisma.$queryRaw\`SELECT 1\`;
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

const updateDraftEventSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(10000).optional(),
  venueName: z.string().trim().min(1).max(200).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one event field to update"
});

const eventListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
}).refine((value) => !value.from || !value.to || new Date(value.to) >= new Date(value.from), {
  message: "The end of the date range must not be before its start",
  path: ["to"]
});

const eventIdSchema = z.string().trim().min(1).max(64);

const createTicketTypeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  priceMinor: z.number().int().min(0).max(2_000_000_000),
  capacity: z.number().int().min(1).max(10_000_000),
  currency: z.string().length(3).transform((value) => value.toUpperCase()).optional(),
  salesStart: z.string().datetime().optional(),
  salesEnd: z.string().datetime().optional()
}).refine((value) => !value.salesStart || !value.salesEnd || new Date(value.salesEnd) > new Date(value.salesStart), {
  message: "Ticket sales must end after they start",
  path: ["salesEnd"]
});

app.get("/api/v1/events", async (req, res, next) => {
  try {
    const parsed = eventListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }
    const { q, city, from, to, page, limit } = parsed.data;
    const where = {
      status: "PUBLISHED" as const,
      ...(city ? { city: { contains: city } } : {}),
      ...(from || to ? { startsAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { venueName: { contains: q } },
          { city: { contains: q } }
        ]
      } : {})
    };
    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        orderBy: [{ startsAt: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, description: true, venueName: true, city: true,
          startsAt: true, endsAt: true, currency: true, status: true,
          ticketTypes: {
            where: {
              AND: [
                { OR: [{ salesStart: null }, { salesStart: { lte: new Date() } }] },
                { OR: [{ salesEnd: null }, { salesEnd: { gt: new Date() } }] }
              ]
            },
            orderBy: [{ priceMinor: "asc" }, { id: "asc" }],
            take: 1,
            select: { id: true, priceMinor: true, currency: true, capacity: true, soldCount: true }
          }
        }
      }),
      prisma.event.count({ where })
    ]);
    res.json({
      data: events,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/events/:eventId", async (req, res, next) => {
  try {
    const eventId = eventIdSchema.safeParse(req.params.eventId);
    if (!eventId.success) {
      res.status(400).json({ error: { code: "INVALID_EVENT_ID", message: "The event identifier is invalid" } });
      return;
    }
    const event = await prisma.event.findFirst({
      where: { id: eventId.data, status: "PUBLISHED" },
      select: {
        id: true, title: true, description: true, venueName: true, city: true,
        startsAt: true, endsAt: true, currency: true, status: true,
        ticketTypes: {
          where: {
            AND: [
              { OR: [{ salesStart: null }, { salesStart: { lte: new Date() } }] },
              { OR: [{ salesEnd: null }, { salesEnd: { gt: new Date() } }] }
            ]
          },
          orderBy: [{ priceMinor: "asc" }, { id: "asc" }],
          select: {
            id: true, name: true, description: true, priceMinor: true, currency: true,
            capacity: true, soldCount: true, salesStart: true, salesEnd: true
          }
        }
      }
    });
    if (!event) {
      res.status(404).json({ error: { code: "EVENT_NOT_FOUND", message: "This event is not available" } });
      return;
    }
    res.json({
      data: {
        ...event,
        ticketTypes: event.ticketTypes.map((ticketType) => ({
          ...ticketType,
          available: Math.max(0, ticketType.capacity - ticketType.soldCount)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/v1/organizer/events", authenticate, requireRole("ORGANIZER"), async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.auth!.userId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true, title: true, venueName: true, city: true, startsAt: true, endsAt: true,
        currency: true, status: true, createdAt: true, updatedAt: true,
        ticketTypes: {
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, priceMinor: true, currency: true, capacity: true, soldCount: true }
        }
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

app.patch("/api/v1/events/:eventId", authenticate, requireRole("ORGANIZER"), async (req, res, next) => {
  try {
    const eventId = eventIdSchema.safeParse(req.params.eventId);
    const parsed = updateDraftEventSchema.safeParse(req.body);
    if (!eventId.success) {
      res.status(400).json({ error: { code: "INVALID_EVENT_ID", message: "The event identifier is invalid" } });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }
    const existing = await prisma.event.findFirst({
      where: { id: eventId.data, organizerId: req.auth!.userId, status: "DRAFT" },
      select: { id: true, startsAt: true, endsAt: true, currency: true, _count: { select: { ticketTypes: true } } }
    });
    if (!existing) {
      res.status(404).json({ error: { code: "DRAFT_EVENT_NOT_FOUND", message: "A draft event owned by your account was not found" } });
      return;
    }
    const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : existing.startsAt;
    const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : existing.endsAt;
    if (endsAt <= startsAt) {
      res.status(400).json({ error: { code: "INVALID_EVENT_DATES", message: "Event end must be after event start" } });
      return;
    }
    if (parsed.data.currency && parsed.data.currency !== existing.currency && existing._count.ticketTypes > 0) {
      res.status(409).json({ error: { code: "CURRENCY_LOCKED", message: "Event currency cannot change after ticket types have been created" } });
      return;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.event.updateMany({
        where: { id: existing.id, organizerId: req.auth!.userId, status: "DRAFT" },
        data: {
          ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
          ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
          ...(parsed.data.venueName !== undefined ? { venueName: parsed.data.venueName } : {}),
          ...(parsed.data.city !== undefined ? { city: parsed.data.city } : {}),
          ...(parsed.data.startsAt !== undefined ? { startsAt } : {}),
          ...(parsed.data.endsAt !== undefined ? { endsAt } : {}),
          ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {})
        }
      });
      if (result.count !== 1) throw new Error("DRAFT_EVENT_UPDATE_CONFLICT");
      await tx.auditLog.create({
        data: {
          actorId: req.auth!.userId,
          action: "DRAFT_EVENT_UPDATED",
          resourceType: "Event",
          resourceId: existing.id,
          metadata: JSON.stringify({ fields: Object.keys(parsed.data) })
        }
      });
      return tx.event.findUnique({
        where: { id: existing.id },
        select: {
          id: true, organizerId: true, title: true, description: true, venueName: true,
          city: true, startsAt: true, endsAt: true, currency: true, status: true, updatedAt: true
        }
      });
    });
    res.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "DRAFT_EVENT_UPDATE_CONFLICT") {
      res.status(409).json({ error: { code: "DRAFT_EVENT_UPDATE_CONFLICT", message: "The event changed while it was being updated. Refresh and try again." } });
      return;
    }
    next(error);
  }
});

app.post("/api/v1/events/:eventId/ticket-types", authenticate, requireRole("ORGANIZER"), async (req, res, next) => {
  try {
    const eventId = eventIdSchema.safeParse(req.params.eventId);
    const parsed = createTicketTypeSchema.safeParse(req.body);
    if (!eventId.success) {
      res.status(400).json({ error: { code: "INVALID_EVENT_ID", message: "The event identifier is invalid" } });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }
    const event = await prisma.event.findFirst({
      where: { id: eventId.data, organizerId: req.auth!.userId, status: "DRAFT" },
      select: { id: true, currency: true }
    });
    if (!event) {
      res.status(404).json({ error: { code: "DRAFT_EVENT_NOT_FOUND", message: "A draft event owned by your account was not found" } });
      return;
    }
    if (parsed.data.currency && parsed.data.currency !== event.currency) {
      res.status(400).json({ error: { code: "CURRENCY_MISMATCH", message: "Ticket currency must match the event currency" } });
      return;
    }
    const ticketType = await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: parsed.data.name,
        description: parsed.data.description,
        priceMinor: parsed.data.priceMinor,
        capacity: parsed.data.capacity,
        currency: event.currency,
        salesStart: parsed.data.salesStart ? new Date(parsed.data.salesStart) : null,
        salesEnd: parsed.data.salesEnd ? new Date(parsed.data.salesEnd) : null
      },
      select: {
        id: true, eventId: true, name: true, description: true, priceMinor: true,
        currency: true, capacity: true, soldCount: true, salesStart: true, salesEnd: true
      }
    });
    res.status(201).json({ data: ticketType });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/events/:eventId/submit", authenticate, requireRole("ORGANIZER"), async (req, res, next) => {
  try {
    const eventId = eventIdSchema.safeParse(req.params.eventId);
    if (!eventId.success) {
      res.status(400).json({ error: { code: "INVALID_EVENT_ID", message: "The event identifier is invalid" } });
      return;
    }
    const event = await prisma.event.findFirst({
      where: { id: eventId.data, organizerId: req.auth!.userId },
      select: { id: true, status: true, title: true, _count: { select: { ticketTypes: true } } }
    });
    if (!event) {
      res.status(404).json({ error: { code: "EVENT_NOT_FOUND", message: "The event was not found in your organiser account" } });
      return;
    }
    if (event.status !== "DRAFT") {
      res.status(409).json({ error: { code: "EVENT_NOT_DRAFT", message: "Only draft events can be submitted for review" } });
      return;
    }
    if (event._count.ticketTypes < 1) {
      res.status(409).json({ error: { code: "TICKET_TYPES_REQUIRED", message: "Add at least one ticket type before submitting this event for review" } });
      return;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.event.updateMany({
        where: { id: event.id, organizerId: req.auth!.userId, status: "DRAFT" },
        data: { status: "PENDING_REVIEW" }
      });
      if (result.count !== 1) {
        throw new Error("EVENT_SUBMISSION_CONFLICT");
      }
      await tx.auditLog.create({
        data: {
          actorId: req.auth!.userId,
          action: "EVENT_SUBMITTED_FOR_REVIEW",
          resourceType: "Event",
          resourceId: event.id,
          metadata: JSON.stringify({ title: event.title })
        }
      });
      return tx.event.findUnique({
        where: { id: event.id },
        select: { id: true, title: true, status: true, updatedAt: true }
      });
    });
    res.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_SUBMISSION_CONFLICT") {
      res.status(409).json({ error: { code: "EVENT_SUBMISSION_CONFLICT", message: "The event changed while it was being submitted. Refresh and try again." } });
      return;
    }
    next(error);
  }
});

const reviewEventSchema = z.object({
  decision: z.enum(["APPROVE", "RETURN_TO_DRAFT"]),
  reason: z.string().trim().min(5).max(1000).optional()
}).refine((value) => value.decision === "APPROVE" || Boolean(value.reason), {
  message: "A reason is required when returning an event to draft",
  path: ["reason"]
});

app.patch("/api/v1/admin/events/:eventId/review", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const eventId = eventIdSchema.safeParse(req.params.eventId);
    const parsed = reviewEventSchema.safeParse(req.body);
    if (!eventId.success) {
      res.status(400).json({ error: { code: "INVALID_EVENT_ID", message: "The event identifier is invalid" } });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
      return;
    }
    const event = await prisma.event.findFirst({
      where: { id: eventId.data, status: "PENDING_REVIEW" },
      select: {
        id: true, title: true, startsAt: true, status: true,
        _count: { select: { ticketTypes: true } }
      }
    });
    if (!event) {
      res.status(404).json({ error: { code: "REVIEW_EVENT_NOT_FOUND", message: "A pending event was not found" } });
      return;
    }
    if (parsed.data.decision === "APPROVE" && event._count.ticketTypes < 1) {
      res.status(409).json({ error: { code: "TICKET_TYPES_REQUIRED", message: "An event needs at least one ticket type before publication" } });
      return;
    }
    if (parsed.data.decision === "APPROVE" && event.startsAt <= new Date()) {
      res.status(409).json({ error: { code: "EVENT_ALREADY_STARTED", message: "An event that has already started cannot be published" } });
      return;
    }
    const nextStatus = parsed.data.decision === "APPROVE" ? "PUBLISHED" : "DRAFT";
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.event.updateMany({
        where: { id: event.id, status: "PENDING_REVIEW" },
        data: { status: nextStatus }
      });
      if (result.count !== 1) throw new Error("EVENT_REVIEW_CONFLICT");
      await tx.auditLog.create({
        data: {
          actorId: req.auth!.userId,
          action: parsed.data.decision === "APPROVE" ? "EVENT_APPROVED" : "EVENT_RETURNED_TO_DRAFT",
          resourceType: "Event",
          resourceId: event.id,
          metadata: JSON.stringify({ reason: parsed.data.reason ?? null })
        }
      });
      return tx.event.findUnique({
        where: { id: event.id },
        select: { id: true, title: true, status: true, updatedAt: true }
      });
    });
    res.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_REVIEW_CONFLICT") {
      res.status(409).json({ error: { code: "EVENT_REVIEW_CONFLICT", message: "The event changed while it was being reviewed. Refresh and try again." } });
      return;
    }
    next(error);
  }
});

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
