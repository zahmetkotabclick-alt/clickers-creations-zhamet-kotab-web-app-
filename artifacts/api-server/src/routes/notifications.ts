import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { notifyNewOrder, testTelegramConnection } from "../lib/telegramService";
import { logger } from "../lib/logger";

const router: Router = Router();

const NewOrderNotificationSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
});

function getSupabaseClient(authHeader?: string) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://biugvsoxsvyfuouekomd.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdWd2c294c3Z5ZnVvdWVrb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTc1MzYsImV4cCI6MjA5MTUzMzUzNn0.VibSfRoaC--40buZA5BL_kr910E07Lys2_0_9jsz88Q";

  if (serviceKey) {
    return createClient(url, serviceKey);
  }

  const options: any = {};
  if (authHeader) {
    options.global = {
      headers: {
        Authorization: authHeader,
      },
    };
  }
  return createClient(url, anonKey, options);
}

/**
 * POST /api/notifications/new-order
 * Triggered after an order is inserted into the database.
 * 
 * Security:
 * - Validates orderId format.
 * - Extracts and verifies caller's Bearer JWT with Supabase Auth.
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
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const supabase = getSupabaseClient(authHeader);
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

      if (!authErr && user) {
        callerUserId = user.id;
      }
    }

    if (!callerUserId) {
      logger.warn({ orderId, ip: req.ip }, "[Order Notification Route] Unauthenticated request rejected.");
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
    logger.error({ error: error?.message || error }, "[Order Notification Route] Server error.");
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
    if (!authHeader) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const supabase = getSupabaseClient(authHeader);
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
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
