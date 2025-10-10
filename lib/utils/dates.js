export function parseDateMaybe(val) {
  if (!val) return undefined;
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T12:00:00`);
  const d = new Date(s);
  return isNaN(d) ? undefined : d;
}

export function sameDayRange(d) {
  if (!(d instanceof Date) || isNaN(d)) return null;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { $gte: start, $lt: end };
}
