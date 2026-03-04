function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function addMonthsPreserveDay(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // If month overflow changed day (e.g., 31 -> 30/28), clamp to last day of previous month
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
}

export function computeNextMaintenanceDate(input: {
  dataInstalacao?: string | null;
  ultimaManutencao?: string | null;
  frequencyMonths?: number | null;
}): string | null {
  const frequencyMonths = input.frequencyMonths ?? null;
  if (!frequencyMonths || frequencyMonths <= 0) return null;

  const base = (input.ultimaManutencao && input.ultimaManutencao.trim() !== '')
    ? input.ultimaManutencao
    : (input.dataInstalacao && input.dataInstalacao.trim() !== '')
      ? input.dataInstalacao
      : null;

  if (!base) return null;

  const baseDate = new Date(base);
  if (!isValidDate(baseDate)) return null;

  const next = addMonthsPreserveDay(baseDate, frequencyMonths);
  if (!isValidDate(next)) return null;

  // Normalize to YYYY-MM-DD for <input type="date"> and DB storage
  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

