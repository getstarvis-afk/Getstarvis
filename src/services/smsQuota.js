import { getPlanSmsLimit } from '../config/pricing';

// Year-month key, e.g. "2026-06". Used to roll the SMS counter over each month.
export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// First instant of next month — when the monthly allowance resets.
export function monthResetISO(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();
}

// Normalized view of the CURRENT month's usage. If the stored monthKey is from
// a previous month, the effective count is 0 (a fresh month has started).
export function resolveSmsUsage(billing = {}, smsUsage = {}) {
  const monthKey = currentMonthKey();
  const limit = getPlanSmsLimit(billing?.plan);
  const sameMonth = smsUsage?.monthKey === monthKey;
  const count = sameMonth ? Math.max(Number(smsUsage?.count) || 0, 0) : 0;
  return {
    monthKey,
    count,
    limit,
    resetAt: monthResetISO(),
    remaining: Math.max(limit - count, 0),
    reached: count >= limit,
  };
}

// The usage object to persist after recording one more sent SMS (handles the
// month rollover automatically).
export function usageAfterSend(billing = {}, smsUsage = {}) {
  const view = resolveSmsUsage(billing, smsUsage);
  return {
    monthKey: view.monthKey,
    count: view.count + 1,
    limit: view.limit,
    resetAt: view.resetAt,
  };
}
