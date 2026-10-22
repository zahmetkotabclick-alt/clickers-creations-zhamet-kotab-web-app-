import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import uploadRouter from "./routes/upload";
import { logger } from "./lib/logger";

const app: Express = express();

// ── REVERSE PROXY: Trust loopback proxy (Hostinger local reverse proxy)
// Express will only trust X-Forwarded-* headers when coming from local loopback (127.0.0.1, ::1).
// This allows express-rate-limit to accurately identify client IPs while preventing external header spoofing.
app.set("trust proxy", "loopback");

// ── SECURITY: Basic HTTP headers hardening
app.use(helmet({
  contentSecurityPolicy: false, // Configured separately if needed
  crossOriginEmbedderPolicy: false,
}));

// ── PERFORMANCE: GZIP compress all API responses
// Reduces bandwidth on JSON payloads by 70-80%
app.use(compression());

// ── SECURITY: Global rate limiting — prevents abuse & DDoS
// Allows up to 200 requests per IP per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ── SECURITY: Strict rate limit on payment endpoint specifically
// Prevents bots from hammering Paymob webhook URL (max 30/15min per IP)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Payment rate limit exceeded." },
});
app.use("/api/paymob", paymentLimiter);

// ── PERFORMANCE: Limit request body size (prevents memory exhaustion attacks)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// ── CORS: Allow only your actual domain in production
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
}));

// ── LOGGING
// Note: pino v9 Logger<never,boolean> is structurally incompatible with
// pino-http v9's Options.logger?: pino.Logger<string> constraint at the type level.
// We configure pino-http with the same options (level, serializers) and let it
// create its own internal logger; our `logger` singleton is still used in routes.
app.use(
  pinoHttp({
    level: process.env.LOG_LEVEL ?? "info",
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/upload", uploadRouter);
app.use("/api", router);

// ── PRODUCTION: Serve static frontend files
// On Hostinger, we serve the built React files from the 'client' directory
const clientPath = path.resolve(__dirname, "../artifacts/clickers/dist");
app.use(express.static(clientPath));

// ── PRODUCTION: Catch-all route for React SPA
// This ensures that refreshing the page on /books or /profile works correctly
app.get(/.*/, (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(clientPath, "index.html"));
  }
});

export default app;
