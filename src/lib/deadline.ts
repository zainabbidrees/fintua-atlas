/**
 * Filing deadlines written as a rule — "EOP + 20 days", the end of the return
 * period plus a number of days — and the next calendar date that rule gives.
 *
 * The rule is what Comply stores; the date is what an expert checks it
 * against ("so October's return is due on 20 November — right"). The date is
 * worked out from the rule rather than stored beside it, so correcting the
 * rule corrects the date with it.
 */

const RULE = /^EOP\s*\+\s*(\d+)\s*days?$/i;

/** The days after the end of the period, or null when the value isn't a rule. */
export function deadlineDays(value: string): number | null {
  const match = RULE.exec(value.trim());
  return match ? Number(match[1]) : null;
}

/** Months in one return period, read from a frequency like "Monthly". */
export function periodMonths(frequency: string | null | undefined): number | null {
  const f = (frequency ?? "").toLowerCase();
  if (f.includes("month")) return 1;
  if (f.includes("quarter")) return 3;
  if (f.includes("annual") || f.includes("year")) return 12;
  return null;
}

/**
 * The next due date on or after `today`. Periods are calendar-aligned, so the
 * period that ended most recently may still be open — on 5 November, the
 * October return is the one due next, not November's.
 */
export function nextDeadline(
  value: string,
  frequency: string | null | undefined,
  today: Date = new Date(),
): Date | null {
  const days = deadlineDays(value);
  const months = periodMonths(frequency);
  if (days === null || months === null) return null;

  const start = Math.floor(today.getMonth() / months) * months;
  const year = today.getFullYear();
  const midnight = new Date(year, today.getMonth(), today.getDate());

  // Day 0 of a month is the last day of the month before it.
  const previousEnd = new Date(year, start, 0);
  const currentEnd = new Date(year, start + months, 0);

  const fromPrevious = addDays(previousEnd, days);
  return fromPrevious >= midnight ? fromPrevious : addDays(currentEnd, days);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
