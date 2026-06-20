export function fmtCurrency(v: unknown, fallback = "—"): string {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  if (isNaN(n)) return fallback;
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function fmtDate(
  d: string | null | undefined,
  fallback = "—"
): string {
  if (!d) return fallback;
  const fixed = d.includes("T") ? d : d + "T00:00:00";
  const date = new Date(fixed);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("pt-BR");
}

export function fmtPercent(v: unknown, fallback = "—"): string {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  if (isNaN(n)) return fallback;
  return `${n.toFixed(1)}%`;
}
