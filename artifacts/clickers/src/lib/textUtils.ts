/**
 * Utility functions for text processing and Arabic typography normalization.
 */

/**
 * Normalizes Arabic text:
 * - Collapses excessive consecutive Arabic tatweel (kashida U+0640)
 * - Trims redundant whitespace
 */
export function normalizeArabicText(text?: string | null): string {
  if (!text) return '';
  // Collapse 2 or more consecutive Arabic tatweels
  return text.replace(/[\u0640]{2,}/g, '').trim();
}
