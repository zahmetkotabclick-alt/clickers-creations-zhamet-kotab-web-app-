import { Router, type Request, type Response } from "express";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger";

const router: Router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(process.cwd(), "artifacts/api-server/data");
const CAMPAIGN_FILE = path.join(DATA_DIR, "campaign.json");

export interface CampaignData {
  id: string;
  name: string;
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory cache for ultra-fast response
let activeCampaignCache: CampaignData | null = null;

// Ensure storage directory exists and load initial state
function initCampaignStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CAMPAIGN_FILE)) {
      const raw = fs.readFileSync(CAMPAIGN_FILE, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.isActive) {
          activeCampaignCache = parsed;
        } else {
          activeCampaignCache = null;
        }
      }
    }
  } catch (err: any) {
    logger.warn({ err: err?.message }, "[Campaign Store] Failed to load campaign from disk on startup");
  }
}

initCampaignStore();

function persistCampaign(campaign: CampaignData | null) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CAMPAIGN_FILE, JSON.stringify(campaign, null, 2), "utf-8");
    activeCampaignCache = campaign && campaign.isActive ? campaign : null;
  } catch (err: any) {
    logger.error({ err: err?.message }, "[Campaign Store] Failed to persist campaign to disk");
    throw err;
  }
}

export function getActiveCampaign(): CampaignData | null {
  try {
    if (fs.existsSync(CAMPAIGN_FILE)) {
      const raw = fs.readFileSync(CAMPAIGN_FILE, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.isActive) {
          activeCampaignCache = parsed;
          return parsed;
        }
      }
    }
  } catch (err: any) {
    logger.warn({ err: err?.message }, "[Campaign Store] Failed reading campaign from disk");
  }
  activeCampaignCache = null;
  return null;
}

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://biugvsoxsvyfuouekomd.supabase.co").replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdWd2c294c3Z5ZnVvdWVrb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTc1MzYsImV4cCI6MjA5MTUzMzUzNn0.VibSfRoaC--40buZA5BL_kr910E07Lys2_0_9jsz88Q";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey };
}

async function verifySupabaseToken(token: string): Promise<{ user: { id: string; [key: string]: any } | null; error?: string }> {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.id) return { user: data };
    }
    return { user: null, error: "Invalid token" };
  } catch (err: any) {
    return { user: null, error: err?.message };
  }
}

async function isUserAdmin(userId: string, authHeader?: string): Promise<boolean> {
  const { url, anonKey, serviceKey } = getSupabaseConfig();
  const keyToUse = serviceKey || anonKey;
  const authToUse = serviceKey ? `Bearer ${serviceKey}` : (authHeader || `Bearer ${anonKey}`);

  try {
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=role`, {
      method: "GET",
      headers: {
        apikey: keyToUse,
        Authorization: authToUse,
      },
    });

    if (res.ok) {
      const data: any = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0 && data[0].role === "admin") {
        return true;
      }
    }
  } catch {
    // Return false on error
  }
  return false;
}

/**
 * GET /api/campaign/active
 * Public endpoint to fetch currently active global promotional event.
 */
router.get("/active", (_req: Request, res: Response) => {
  const campaign = getActiveCampaign();
  return res.status(200).json({
    isActive: !!campaign,
    campaign: campaign || null,
  });
});

const ActivateSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100),
  discountPercent: z.number().min(1).max(99),
});

/**
 * POST /api/campaign/activate
 * Admin endpoint to create and activate a new global campaign.
 */
router.post("/activate", async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { user, error: authErr } = await verifySupabaseToken(token);
    if (!user || authErr) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = await isUserAdmin(user.id, authHeader);
    if (!admin) {
      return res.status(403).json({ error: "Admin authorization required" });
    }

    const parsed = ActivateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid payload" });
    }

    const newCampaign: CampaignData = {
      id: `camp_${Date.now()}`,
      name: parsed.data.name.trim(),
      discountPercent: Math.round(parsed.data.discountPercent),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistCampaign(newCampaign);

    logger.info({ campaign: newCampaign, adminId: user.id }, "[Campaign] Promotional event activated");

    return res.status(200).json({
      success: true,
      campaign: newCampaign,
    });
  } catch (err: any) {
    logger.error({ err: err?.message }, "[Campaign] Failed to activate campaign");
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/campaign/deactivate
 * Admin endpoint to immediately end the active promotional event.
 */
router.post("/deactivate", async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { user, error: authErr } = await verifySupabaseToken(token);
    if (!user || authErr) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = await isUserAdmin(user.id, authHeader);
    if (!admin) {
      return res.status(403).json({ error: "Admin authorization required" });
    }

    persistCampaign(null);

    logger.info({ adminId: user.id }, "[Campaign] Promotional event deactivated");

    return res.status(200).json({
      success: true,
      message: "Campaign deactivated",
    });
  } catch (err: any) {
    logger.error({ err: err?.message }, "[Campaign] Failed to deactivate campaign");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

