// Helpers de tempo. Puros.

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function minutesBetween(startMs: number, endMs: number): number {
  return Math.max(0, (endMs - startMs) / 60000);
}

export function formatHM(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const m = Math.round(Math.abs(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${sign}${mm}m`;
  if (mm === 0) return `${sign}${h}h`;
  return `${sign}${h}h${String(mm).padStart(2, '0')}`;
}

export function formatHMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Datas dos últimos N dias incluindo hoje, em ordem cronológica. */
export function lastNDates(n: number, anchor: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    out.push(todayISO(d));
  }
  return out;
}

/** Início da semana (segunda-feira) para a data dada. */
export function weekStart(d: Date = new Date()): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0 dom .. 6 sab
  const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function currentWeekDates(anchor: Date = new Date()): string[] {
  const start = weekStart(anchor);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(todayISO(d));
  }
  return out;
}
