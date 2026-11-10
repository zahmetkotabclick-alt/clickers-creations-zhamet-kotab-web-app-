import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getActiveCampaign } from "./campaign";
import { notifyNewOrder } from "../lib/telegramService";
import { logger } from "../lib/logger";

const router: Router = Router();

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

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      bookId: z.string().uuid("Invalid book ID"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  ).min(1, "Order must contain at least one item"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  shippingAddress: z.string().optional().default(""),
  transactionId: z.string().optional(),
  notes: z.string().optional().default(""),
});

/**
 * Calculates the trusted effective unit price for a book,
 * applying campaign rules without double-stacking and ensuring free items stay free.
 */
export function calculateTrustedBookPrice(
  dbPrice: number,
  dbOriginalPrice: number | null | undefined,
  campaignDiscountPercent: number | null
): number {
  if (dbPrice <= 0) return 0; // Free remains free

  if (!campaignDiscountPercent || campaignDiscountPercent <= 0) {
    return Number(dbPrice.toFixed(2));
  }

  // Base reference price: if the book already had an original price, calculate campaign off original price
  const basePrice = (dbOriginalPrice && Number(dbOriginalPrice) > dbPrice)
    ? Number(dbOriginalPrice)
    : dbPrice;

  const campaignPrice = Math.round(basePrice * (1 - campaignDiscountPercent / 100) * 100) / 100;

  // Best deal rule: Apply the better customer price between current selling price and campaign price
  const finalPrice = Math.min(dbPrice, campaignPrice);
  return Math.max(0, Number(finalPrice.toFixed(2)));
}

/**
 * POST /api/orders/create
 * Secure backend order creation with trusted server-side price validation.
 */
router.post("/create", async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required to place an order" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { user, error: authErr } = await verifySupabaseToken(token);
    if (!user || authErr) {
      return res.status(401).json({ error: "Invalid or expired session. Please log in." });
    }

    const parseResult = CreateOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message || "Invalid order payload" });
    }

    const { items, paymentMethod, shippingAddress, transactionId, notes } = parseResult.data;

    // 1. Fetch official book data from Supabase
    const { url, anonKey, serviceKey } = getSupabaseConfig();
    const keyToUse = serviceKey || anonKey;
    const authToUse = serviceKey ? `Bearer ${serviceKey}` : `Bearer ${token}`;

    const bookIds = Array.from(new Set(items.map((i) => i.bookId)));
    const booksQueryUrl = `${url}/rest/v1/books?id=in.(${bookIds.join(",")})&select=id,price,original_price,title_ar,title_en`;

    const booksRes = await fetch(booksQueryUrl, {
      method: "GET",
      headers: {
        apikey: keyToUse,
        Authorization: authToUse,
      },
    });

    if (!booksRes.ok) {
      logger.error({ status: booksRes.status }, "[Order Route] Failed to fetch books from Supabase");
      return res.status(500).json({ error: "Failed to verify book pricing" });
    }

    const booksData: any[] = await booksRes.json();
    const booksMap = new Map<string, { id: string; price: number; original_price: number | null }>();
    booksData.forEach((b) => booksMap.set(b.id, { id: b.id, price: Number(b.price), original_price: b.original_price ? Number(b.original_price) : null }));

    // 2. Fetch Active Campaign (if any)
    const activeCampaign = getActiveCampaign();
    const campaignDiscount = activeCampaign ? activeCampaign.discountPercent : null;

    // 3. Compute trusted order line items and total
    let validatedTotal = 0;
    const validatedItems: { book_id: string; quantity: number; unit_price: number }[] = [];

    for (const item of items) {
      const book = booksMap.get(item.bookId);
      if (!book) {
        return res.status(400).json({ error: `Book not found: ${item.bookId}` });
      }

      const unitPrice = calculateTrustedBookPrice(book.price, book.original_price, campaignDiscount);
      validatedTotal += unitPrice * item.quantity;

      validatedItems.push({
        book_id: item.bookId,
        quantity: item.quantity,
        unit_price: unitPrice,
      });
    }

    validatedTotal = Number(validatedTotal.toFixed(2));

    // 4. Insert Order into Supabase
    const orderPayload = {
      user_id: user.id,
      total_amount: validatedTotal,
      payment_method: paymentMethod,
      shipping_address: shippingAddress || null,
      transaction_id: transactionId || null,
      notes: notes || null,
      status: "pending",
    };

    const insertOrderRes = await fetch(`${url}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: keyToUse,
        Authorization: authToUse,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!insertOrderRes.ok) {
      const errText = await insertOrderRes.text().catch(() => "");
      logger.error({ status: insertOrderRes.status, errText }, "[Order Route] Failed to insert order");
      return res.status(500).json({ error: "Failed to create order record" });
    }

    const createdOrderRows: any[] = await insertOrderRes.json();
    const createdOrder = createdOrderRows[0];

    if (!createdOrder?.id) {
      return res.status(500).json({ error: "Order record creation did not return ID" });
    }

    // 5. Insert Order Items into Supabase
    const orderItemsPayload = validatedItems.map((vi) => ({
      order_id: createdOrder.id,
      book_id: vi.book_id,
      quantity: vi.quantity,
      unit_price: vi.unit_price,
    }));

    const insertItemsRes = await fetch(`${url}/rest/v1/order_items`, {
      method: "POST",
      headers: {
        apikey: keyToUse,
        Authorization: authToUse,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderItemsPayload),
    });

    if (!insertItemsRes.ok) {
      const errText = await insertItemsRes.text().catch(() => "");
      logger.error({ status: insertItemsRes.status, errText }, "[Order Route] Failed to insert order items");
      // Order created, return it anyway so customer has their reference
    }

    // 6. Asynchronously trigger Telegram notification
    setImmediate(async () => {
      try {
        await notifyNewOrder(createdOrder.id, {
          authHeader,
          callerUserId: user.id,
          source: "checkout",
        });
      } catch (err: any) {
        logger.warn({ orderId: createdOrder.id, err: err?.message }, "[Order Route] Non-blocking Telegram notification failed");
      }
    });

    logger.info(
      { orderId: createdOrder.id, userId: user.id, total: validatedTotal, campaignApplied: !!activeCampaign },
      "[Order Route] Order successfully created with trusted backend pricing"
    );

    return res.status(200).json({
      success: true,
      order: createdOrder,
    });
  } catch (err: any) {
    logger.error({ err: err?.message, stack: err?.stack }, "[Order Route] Unexpected server error creating order");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

