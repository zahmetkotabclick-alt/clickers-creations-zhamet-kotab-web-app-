import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db, profiles } from "@workspace/db";
import { eq } from "drizzle-orm";
import { notifyNewOrder, testTelegramConnection } from "../lib/telegramService";
import { logger } from "../lib/logger";

const router: Router = Router();

const NewOrderNotificationSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
});

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://biugvsoxsvyfuouekomd.supabase.co").replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdWd2c294c3Z5ZnVvdWVrb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTc1MzYsImV4cCI6MjA5MTUzMzUzNn0.VibSfRoaC--40buZA5BL_kr910E07Lys2_0_9jsz88Q";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey };
}

/**
 * Validates a Supabase JWT token via direct HTTPS call to the Supabase Auth REST API.
 * Avoids initializing the Supabase JS client or WebSocket / Realtime client, which is
 * completely incompatible with Node.js 20 and caused runtime crashes in production.
 */
async function verifySupabaseToken(token: string): Promise<{
  user: { id: string; [key: string]: any } | null;
  error?: string;
  isServiceError?: boolean;
}> {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/user`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data: any = await res.json().catch(() => null);
      if (data && data.id) {
        return { user: data };
      }
      return { user: null, error: "Invalid user payload from auth service" };
    }

    if (res.status === 401 || res.status === 403) {
      return { user: null, error: "Invalid or expired token" };
    }

    return { user: null, error: `Auth service returned status ${res.status}`, isServiceError: true };
  } catch (err: any) {
    return { user: null, error: err?.message || "Auth verification network failure", isServiceError: true };
  }
}

/**
 * Checks if a user has the 'admin' role using Drizzle DB or PostgREST fetch.
 */
async function isUserAdmin(userId: string, authHeader?: string): Promise<boolean> {
  if (db) {
    try {
      const rows = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, userId)).limit(1);
      if (rows.length > 0 && rows[0].role === "admin") {
        return true;
      }
    } catch {
      logger.warn({ userId }, "[Order Notification Route] Drizzle profile lookup failed, falling back to PostgREST.");
    }
  }

  const { url, anonKey, serviceKey } = getSupabaseConfig();
  const keyToUse = serviceKey || anonKey;
  const authToUse = serviceKey ? `Bearer ${serviceKey}` : (authHeader || `Bearer ${anonKey}`);

  try {
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=role`, {
      method: "GET",
      headers: {
        "apikey": keyToUse,
        "Authorization": authToUse,
      },
    });

    if (res.ok) {
      const data: any = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0 && data[0].role === "admin") {
        return true;
      }
    }
  } catch {
    // Treat as non-admin on failure
  }

  return false;
}

/**
 * POST /api/notifications/new-order
 * Triggered after an order is inserted into the database.
 * 
 * Security:
 * - Validates orderId format.
 * - Extracts and verifies caller's Bearer JWT via Supabase Auth REST API.
 * - Verifies that the caller owns the order before dispatching a notification.
 * - Non-blocking: Telegram failure will never fail or delay the customer checkout.
 */
router.post("/new-order", async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Validate Payload Schema
    const parseResult = NewOrderNotificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const { orderId } = parseResult.data;
    const authHeader = req.headers.authorization;

    // 2. Security Check: Authenticate caller
    let callerUserId: string | undefined = undefined;
    let authFailureReason: "missing_header" | "invalid_token" | "auth_service_error" = "missing_header";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (!token) {
        authFailureReason = "invalid_token";
      } else {
        const { user, error, isServiceError } = await verifySupabaseToken(token);

        if (user && user.id) {
          callerUserId = user.id;
        } else if (isServiceError) {
          authFailureReason = "auth_service_error";
          logger.error(
            { orderId, error },
            "[Order Notification Route] Exception during Supabase auth verification."
          );
        } else {
          authFailureReason = "invalid_token";
          logger.warn(
            { orderId, error },
            "[Order Notification Route] Supabase auth rejected token."
          );
        }
      }
    }

    if (!callerUserId) {
      logger.warn(
        { orderId, ip: req.ip, reason: authFailureReason },
        "[Order Notification Route] Unauthenticated request rejected."
      );
      if (authFailureReason === "auth_service_error") {
        return res.status(503).json({ error: "Authentication service temporarily unavailable" });
      }
      return res.status(401).json({ error: "Authentication required to notify order" });
    }

    // 3. Dispatch Notification Asynchronously (Non-blocking response to frontend)
    setImmediate(async () => {
      try {
        await notifyNewOrder(orderId, {
          authHeader,
          callerUserId,
          source: "checkout",
        });
      } catch (err: any) {
        logger.error({ orderId, err: err?.message }, "[Order Notification Route] Unexpected error during async Telegram dispatch.");
      }
    });

    // 4. Immediate clean response to frontend
    return res.status(200).json({ success: true, message: "Notification queued" });
  } catch (error: any) {
    logger.error(
      {
        message: error?.message || "Unknown error",
        stack: error?.stack,
      },
      "[Order Notification Route] Unexpected server error."
    );
    return res.status(500).json({ error: "Failed to process notification" });
  }
});

/**
 * POST /api/notifications/test-telegram
 * Admin endpoint to verify Telegram credentials and bot permissions.
 */
router.post("/test-telegram", async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    const { user, isServiceError } = await verifySupabaseToken(token);

    if (isServiceError) {
      return res.status(503).json({ error: "Authentication service temporarily unavailable" });
    }

    if (!user || !user.id) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    // Check admin role
    const admin = await isUserAdmin(user.id, authHeader);
    if (!admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const testResult = await testTelegramConnection();
    if (testResult.ok) {
      return res.status(200).json({ success: true, message: testResult.message });
    } else {
      return res.status(502).json({ success: false, error: testResult.error });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

export default router;
