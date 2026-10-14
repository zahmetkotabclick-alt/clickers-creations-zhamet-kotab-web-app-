-- ================================================================
-- Migration: Add Telegram Notification Tracking to Orders Table
-- For Zahmet Ketab (دار زحمة كتاب)
-- ================================================================

-- 1. Add Telegram notification tracking columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_status TEXT DEFAULT 'pending' CHECK (telegram_status IN ('pending', 'processing', 'sent', 'failed'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_sent_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_attempts INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_last_error TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_message_id TEXT;

-- 2. Create partial index for fast lookup of pending or failed notifications
CREATE INDEX IF NOT EXISTS idx_orders_telegram_status ON public.orders(telegram_status) WHERE telegram_status IN ('pending', 'failed');

-- 3. Comments for documentation
COMMENT ON COLUMN public.orders.telegram_status IS 'Delivery status of the Telegram order notification: pending, processing, sent, failed';
COMMENT ON COLUMN public.orders.telegram_sent_at IS 'Timestamp when the notification was successfully sent to the Telegram group';
COMMENT ON COLUMN public.orders.telegram_attempts IS 'Number of delivery attempts made to Telegram';
COMMENT ON COLUMN public.orders.telegram_last_error IS 'Sanitized error message from the last failed attempt (secrets stripped)';
COMMENT ON COLUMN public.orders.telegram_message_id IS 'Telegram message ID returned by the Telegram Bot API';
