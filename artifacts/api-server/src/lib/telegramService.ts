import { db, orders, orderItems, books, profiles } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

export function getTelegramConfig(): { token: string; chatId: string } {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();
  return { token, chatId };
}

export interface OrderNotificationData {
  orderId: string;
  userId?: string;
  createdAt?: string;
  status?: string;
  paymentMethod?: string;
  transactionId?: string;
  totalAmount: number | string;
  shippingAddress?: string;
  notes?: string;
  customer: {
    fullName?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    titleAr: string;
    titleEn?: string;
    quantity: number;
    unitPrice: number | string;
  }>;
}

export interface NotifyOrderOptions {
  authHeader?: string;
  callerUserId?: string;
  source?: "checkout" | "paymob" | "manual" | "recovery";
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number | string;
  reason?: "NOT_CONFIGURED" | "ALREADY_SENT" | "ALREADY_PROCESSING" | "ORDER_NOT_FOUND" | "UNAUTHORIZED" | "SEND_FAILED";
  error?: string;
}

// In-memory active claim set to prevent immediate concurrent duplicate sends within this Node process
const processingClaims = new Set<string>();

// Cache of recently sent order notifications (orderId -> timestamp) to prevent duplicate delivery
// Retained for 15 minutes in-memory
const recentlySentCache = new Map<string, number>();

// Clean up stale cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  for (const [id, time] of recentlySentCache.entries()) {
    if (now - time > fifteenMinutes) {
      recentlySentCache.delete(id);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * Escapes characters for Telegram HTML parse mode.
 * Allowed tags: <b>, <i>, <code>, <s>, <u>, <pre>, <a>
 * All dynamic text MUST be escaped to prevent parse errors or injection.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Strips bot tokens and secrets from strings to prevent accidental leakage in logs or error traces.
 */
export function sanitizeError(err: unknown): string {
  if (!err) return "Unknown error";
  const msg = typeof err === "string" ? err : (err as any).message || JSON.stringify(err);
  return msg.replace(/bot[0-9]+:[a-zA-Z0-9_-]+/gi, "bot[REDACTED]");
}

/**
 * Translates payment method values to clear Arabic labels.
 */
export function formatPaymentMethod(method?: string): string {
  if (!method) return "غير محدد";
  const m = method.toLowerCase();
  if (m === "instapay") return "انستا باي (InstaPay)";
  if (m === "etisalat_cash") return "اتصالات كاش (Etisalat Cash)";
  if (m === "vodafone_cash") return "فودافون كاش (Vodafone Cash)";
  if (m === "cod" || m === "cash") return "الدفع عند الاستلام (COD)";
  if (m === "paymob" || m === "card") return "بطاقة بنكية (Paymob)";
  return method;
}

/**
 * Translates order status values to readable Arabic labels.
 */
export function formatOrderStatus(status?: string): string {
  if (!status) return "قيد الانتظار";
  const s = status.toLowerCase();
  if (s === "pending") return "قيد الانتظار (Pending)";
  if (s === "paid") return "تم الدفع بنجاح (Paid)";
  if (s === "delivered") return "تم التوصيل (Delivered)";
  if (s === "cancelled") return "ملغي (Cancelled)";
  return status;
}

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://biugvsoxsvyfuouekomd.supabase.co").replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdWd2c294c3Z5ZnVvdWVrb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTc1MzYsImV4cCI6MjA5MTUzMzUzNn0.VibSfRoaC--40buZA5BL_kr910E07Lys2_0_9jsz88Q";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey };
}

/**
 * Builds the structured Arabic Telegram HTML message for an order.
 * Ensures the output is strictly within Telegram's 4096 character limit.
 */
export function buildOrderTelegramMessage(order: OrderNotificationData): string {
  const shortId = order.orderId.slice(0, 8).toUpperCase();
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString("ar-EG", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });

  const totalVal = Number(order.totalAmount || 0).toFixed(2);

  let message = `📚 <b>طلب جديد من زحمة كتاب</b>\n\n`;
  message += `📦 <b>رقم الطلب:</b> <code>#${escapeHtml(shortId)}</code>\n`;
  message += `🆔 <b>المعرّف الكامل:</b> <code>${escapeHtml(order.orderId)}</code>\n`;
  message += `📅 <b>تاريخ الطلب:</b> ${escapeHtml(formattedDate)}\n`;
  message += `📊 <b>حالة الطلب:</b> ${escapeHtml(formatOrderStatus(order.status))}\n`;
  message += `💳 <b>طريقة الدفع:</b> ${escapeHtml(formatPaymentMethod(order.paymentMethod))}\n`;

  if (order.transactionId) {
    message += `🔖 <b>رقم التحويل / العملية:</b> <code>${escapeHtml(order.transactionId)}</code>\n`;
  }

  message += `\n👤 <b>بيانات العميل:</b>\n`;
  message += `• <b>الاسم:</b> ${escapeHtml(order.customer.fullName || "غير محدد")}\n`;
  if (order.customer.phone) {
    message += `• <b>الهاتف:</b> <code>${escapeHtml(order.customer.phone)}</code>\n`;
  }
  if (order.customer.email) {
    message += `• <b>البريد:</b> ${escapeHtml(order.customer.email)}\n`;
  }
  if (order.shippingAddress) {
    message += `• <b>عنوان الشحن:</b> ${escapeHtml(order.shippingAddress)}\n`;
  }
  if (order.notes) {
    message += `• <b>ملاحظات:</b> <i>${escapeHtml(order.notes)}</i>\n`;
  }

  message += `\n📖 <b>الكتب المطلوبة (${order.items.length}):</b>\n`;

  const itemLines: string[] = [];
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const itemQty = Number(item.quantity || 1);
    const itemPrice = Number(item.unitPrice || 0);
    const itemTotal = (itemQty * itemPrice).toFixed(2);
    const title = escapeHtml(item.titleAr || item.titleEn || "كتاب بدون عنوان");

    itemLines.push(
      `${i + 1}. <b>${title}</b>\n   الكمية: ${itemQty} × ${itemPrice.toFixed(2)} ج.م | الإجمالي: <b>${itemTotal} ج.م</b>`
    );
  }

  // Handle Telegram 4096 character limit safely
  const footer = `\n💰 <b>الإجمالي النهائي:</b> <b>${totalVal} ج.م</b>\n\nدار زحمة كتاب للنشر والتوزيع ✨`;
  let itemsCombined = itemLines.join("\n");

  if (message.length + itemsCombined.length + footer.length > 3900) {
    // Truncate item list to stay within limits
    const safeLines: string[] = [];
    let currentLen = message.length + footer.length + 100;
    for (const line of itemLines) {
      if (currentLen + line.length > 3700) {
        safeLines.push(`... وباقي الكتب (${order.items.length - safeLines.length} كتب أخرى)`);
        break;
      }
      safeLines.push(line);
      currentLen += line.length + 1;
    }
    itemsCombined = safeLines.join("\n");
  }

  message += itemsCombined + footer;
  return message;
}

/**
 * Dispatches an HTML message to the configured Telegram Chat via Telegram Bot API.
 */
async function sendTelegramMessage(text: string): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const { token, chatId } = getTelegramConfig();

  if (!token || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured" };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10 second timeout

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data: any = await res.json().catch(() => null);

    if (res.ok && data?.ok) {
      return { ok: true, messageId: data.result?.message_id };
    }

    const desc = data?.description || `HTTP ${res.status} ${res.statusText}`;
    return { ok: false, error: sanitizeError(desc) };
  } catch (err: any) {
    return { ok: false, error: sanitizeError(err) };
  }
}

/**
 * Attempts an atomic database claim on the order to prevent duplicate notifications.
 * If the database columns have not yet been migrated, falls back safely to in-memory locking.
 */
async function claimNotification(orderId: string): Promise<boolean> {
  // 1. In-memory check
  if (processingClaims.has(orderId) || recentlySentCache.has(orderId)) {
    return false;
  }

  processingClaims.add(orderId);

  // 2. Database atomic claim if Drizzle db is available
  if (db) {
    try {
      const result = await db.execute(sql`
        UPDATE public.orders
        SET telegram_status = 'processing'
        WHERE id = ${orderId}::uuid
          AND (telegram_status IS NULL OR telegram_status IN ('pending', 'failed'))
        RETURNING id
      `);

      const rows = (result as any).rows || result;
      if (Array.isArray(rows) && rows.length === 0) {
        // Already claimed or sent in the database
        processingClaims.delete(orderId);
        return false;
      }
    } catch (dbErr: any) {
      // If telegram_status column doesn't exist yet, gracefully fall back to in-memory locking
      const msg = dbErr?.message || "";
      if (!msg.includes("telegram_status")) {
        logger.warn({ err: sanitizeError(dbErr), orderId }, "[Telegram Service] DB claim query warning");
      }
    }
  }

  return true;
}

/**
 * Updates the delivery status of the order in the database.
 * Silently handles cases where the migration columns are not yet applied.
 */
async function updateNotificationStatus(
  orderId: string,
  status: "sent" | "failed",
  details: { messageId?: number | string; error?: string }
): Promise<void> {
  if (status === "sent") {
    recentlySentCache.set(orderId, Date.now());
  }
  processingClaims.delete(orderId);

  if (db) {
    try {
      if (status === "sent") {
        await db.execute(sql`
          UPDATE public.orders
          SET telegram_status = 'sent',
              telegram_sent_at = NOW(),
              telegram_message_id = ${String(details.messageId || "")}
          WHERE id = ${orderId}::uuid
        `);
      } else {
        await db.execute(sql`
          UPDATE public.orders
          SET telegram_status = 'failed',
              telegram_last_error = ${details.error || "Unknown error"},
              telegram_attempts = COALESCE(telegram_attempts, 0) + 1
          WHERE id = ${orderId}::uuid
        `);
      }
    } catch {
      // Ignore if table columns do not exist yet
    }
  }
}

/**
 * Loads order, customer profile, and order items from the database.
 * Supports Drizzle and Supabase JS Client with RLS bypass (when service key is configured)
 * or user token forwarding.
 */
async function loadOrderData(orderId: string, authHeader?: string): Promise<OrderNotificationData | null> {
  // 1. Try Drizzle if direct DB pool is connected
  if (db) {
    try {
      const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (orderRows && orderRows.length > 0) {
        const order = orderRows[0];
        const profileRows = await db.select().from(profiles).where(eq(profiles.id, order.userId)).limit(1);
        const profile = profileRows[0];

        const itemsData = await db
          .select({
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            titleAr: books.titleAr,
            titleEn: books.titleEn,
          })
          .from(orderItems)
          .leftJoin(books, eq(orderItems.bookId, books.id))
          .where(eq(orderItems.orderId, orderId));

        return {
          orderId: order.id,
          userId: order.userId || undefined,
          createdAt: order.createdAt,
          status: order.status,
          paymentMethod: order.paymentMethod || undefined,
          transactionId: order.transactionId || undefined,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress || undefined,
          notes: order.notes || undefined,
          customer: {
            fullName: profile?.fullName || undefined,
            phone: profile?.phone || undefined,
            email: profile?.email || undefined,
          },
          items: itemsData.map((i: any) => ({
            titleAr: i.titleAr || "كتاب بدون عنوان",
            titleEn: i.titleEn || undefined,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        };
      }
    } catch (err: any) {
      logger.warn({ err: sanitizeError(err), orderId }, "[Telegram Service] Drizzle load failed, falling back to Supabase client.");
    }
  }

  // 2. Fallback to Supabase PostgREST via direct HTTPS fetch (Zero-dependency, no WebSocket / Realtime)
  const { url, anonKey, serviceKey } = getSupabaseConfig();
  const keyToUse = serviceKey || anonKey;
  const authToUse = serviceKey ? `Bearer ${serviceKey}` : (authHeader || `Bearer ${anonKey}`);

  try {
    const orderRes = await fetch(`${url}/rest/v1/orders?id=eq.${orderId}&select=*`, {
      headers: {
        apikey: keyToUse,
        Authorization: authToUse,
      },
    });

    if (!orderRes.ok) {
      logger.warn({ orderId, status: orderRes.status }, "[Telegram Service] PostgREST order lookup failed.");
      return null;
    }

    const orderRows: any = await orderRes.json().catch(() => []);
    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      logger.warn({ orderId }, "[Telegram Service] Order not found in database.");
      return null;
    }
    const order = orderRows[0];

    // Fetch customer profile
    let profile: any = null;
    if (order.user_id) {
      const profileRes = await fetch(`${url}/rest/v1/profiles?id=eq.${order.user_id}&select=*`, {
        headers: {
          apikey: keyToUse,
          Authorization: authToUse,
        },
      });
      if (profileRes.ok) {
        const profileRows: any = await profileRes.json().catch(() => []);
        if (Array.isArray(profileRows) && profileRows.length > 0) {
          profile = profileRows[0];
        }
      }
    }

    // Fetch items with joined book titles
    const itemsRes = await fetch(
      `${url}/rest/v1/order_items?order_id=eq.${orderId}&select=quantity,unit_price,books(title_ar,title_en)`,
      {
        headers: {
          apikey: keyToUse,
          Authorization: authToUse,
        },
      }
    );

    const rawItems: any = itemsRes.ok ? await itemsRes.json().catch(() => []) : [];
    const items = (Array.isArray(rawItems) ? rawItems : []).map((i: any) => ({
      titleAr: i.books?.title_ar || "كتاب بدون عنوان",
      titleEn: i.books?.title_en || undefined,
      quantity: i.quantity || 1,
      unitPrice: i.unit_price || 0,
    }));

    return {
      orderId: order.id,
      userId: order.user_id || undefined,
      createdAt: order.created_at,
      status: order.status,
      paymentMethod: order.payment_method || undefined,
      transactionId: order.transaction_id || undefined,
      totalAmount: order.total_amount,
      shippingAddress: order.shipping_address || undefined,
      notes: order.notes || undefined,
      customer: {
        fullName: profile?.full_name || undefined,
        phone: profile?.phone || undefined,
        email: profile?.email || undefined,
      },
      items,
    };
  } catch (err: any) {
    logger.error({ orderId, err: sanitizeError(err) }, "[Telegram Service] Exception in fallback PostgREST order lookup.");
    return null;
  }
}

/**
 * Main entry point: Loads order data from the trusted database, verifies ownership/eligibility,
 * claims atomic lock to prevent duplicate notifications, and sends the notification to Telegram.
 *
 * Never throws exceptions. Always returns a TelegramSendResult.
 */
export async function notifyNewOrder(
  orderId: string,
  options: NotifyOrderOptions = {}
): Promise<TelegramSendResult> {
  const { token, chatId } = getTelegramConfig();

  // 1. Validate configuration
  if (!token || !chatId) {
    logger.warn(
      { orderId },
      "[Telegram Service] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured — notification skipped safely."
    );
    return { success: false, reason: "NOT_CONFIGURED" };
  }

  // 2. Prevent concurrent duplicate dispatch
  const claimed = await claimNotification(orderId);
  if (!claimed) {
    logger.info({ orderId }, "[Telegram Service] Notification already sent or currently processing — duplicate prevented.");
    return { success: false, reason: "ALREADY_SENT" };
  }

  try {
    // 3. Load order details from trusted database
    const orderData = await loadOrderData(orderId, options.authHeader);
    if (!orderData) {
      processingClaims.delete(orderId);
      return { success: false, reason: "ORDER_NOT_FOUND" };
    }

    // 4. Verify Authorization if triggered by a user checkout call
    if (options.callerUserId) {
      const orderOwnerId = orderData.userId;
      if (orderOwnerId && orderOwnerId !== options.callerUserId) {
        let isAdmin = false;
        if (db) {
          try {
            const rows = await db
              .select({ role: profiles.role })
              .from(profiles)
              .where(eq(profiles.id, options.callerUserId))
              .limit(1);
            if (rows.length > 0 && rows[0].role === "admin") {
              isAdmin = true;
            }
          } catch {
            // Fall through to PostgREST check
          }
        }

        if (!isAdmin) {
          const { url, anonKey, serviceKey } = getSupabaseConfig();
          const keyToUse = serviceKey || anonKey;
          const authToUse = serviceKey ? `Bearer ${serviceKey}` : (options.authHeader || `Bearer ${anonKey}`);

          try {
            const pRes = await fetch(`${url}/rest/v1/profiles?id=eq.${options.callerUserId}&select=role`, {
              headers: { apikey: keyToUse, Authorization: authToUse },
            });
            if (pRes.ok) {
              const pData: any = await pRes.json().catch(() => []);
              if (Array.isArray(pData) && pData.length > 0 && pData[0].role === "admin") {
                isAdmin = true;
              }
            }
          } catch {
            // Treat as non-admin on network error
          }
        }

        if (!isAdmin) {
          logger.warn(
            { orderId, caller: options.callerUserId, owner: orderOwnerId },
            "[Telegram Service] Unauthorized attempt to trigger notification for another user's order."
          );
          processingClaims.delete(orderId);
          return { success: false, reason: "UNAUTHORIZED" };
        }
      }
    }

    // 5. Build Arabic HTML message
    const messageText = buildOrderTelegramMessage(orderData);

    // 6. Send to Telegram
    const sendResult = await sendTelegramMessage(messageText);

    if (sendResult.ok) {
      await updateNotificationStatus(orderId, "sent", { messageId: sendResult.messageId });
      logger.info(
        { orderId, messageId: sendResult.messageId, source: options.source || "checkout" },
        "[Telegram Service] Telegram notification delivered successfully."
      );
      return { success: true, messageId: sendResult.messageId };
    } else {
      await updateNotificationStatus(orderId, "failed", { error: sendResult.error });
      logger.error(
        { orderId, error: sendResult.error },
        "[Telegram Service] Telegram delivery failed."
      );
      return { success: false, reason: "SEND_FAILED", error: sendResult.error };
    }
  } catch (err: any) {
    const errorMsg = sanitizeError(err);
    await updateNotificationStatus(orderId, "failed", { error: errorMsg });
    logger.error({ orderId, error: errorMsg }, "[Telegram Service] Exception in notifyNewOrder.");
    return { success: false, reason: "SEND_FAILED", error: errorMsg };
  }
}

/**
 * Test utility for verifying Telegram Bot Token and Chat ID without exposing secrets.
 */
export async function testTelegramConnection(): Promise<{ ok: boolean; message?: string; error?: string }> {
  const { token, chatId } = getTelegramConfig();

  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN is missing" };
  if (!chatId) return { ok: false, error: "TELEGRAM_CHAT_ID is missing" };

  const testMessage = `🔔 <b>اختبار اتصال بوت زحمة كتاب</b>\n\nتم الاتصال بنجاح بين خادم المتجر ومجموعة التيليجرام الخاصة بالطلبات! ✅\nالوقت: ${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`;
  const res = await sendTelegramMessage(testMessage);

  if (res.ok) {
    return { ok: true, message: `Notification test passed! Message ID: ${res.messageId}` };
  }
  return { ok: false, error: res.error };
}
