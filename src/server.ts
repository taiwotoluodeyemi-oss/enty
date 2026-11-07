import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 4000);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? false }));
app.use(express.json({ limit: "256kb" }));

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

const createEventSchema = z.object({
  organizerId: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(10000).optional(),
  venueName: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  currency: z.string().length(3).default("NGN")
}).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
  message: "Event end must be after event start",
  path: ["endsAt"]
});

app.get("/api/v1/events", async (_req, res) => {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    take: 50
  });
  res.json({ data: events });
});

app.post("/api/v1/events", async (req, res) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", details: parsed.error.flatten() } });
    return;
  }
  // Authentication/organizer authorization is required before this route is exposed publicly.
  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      status: "DRAFT"
    }
  });
  res.status(201).json({ data: event });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Do not return internal exception details or secrets to clients.
  console.error("request_error", error instanceof Error ? error.name : "unknown");
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
