import { Habit, HabitStatus } from './types';

export function computeHabitStatus(
  habits: Habit[],
  spentByCat: Record<string, number>,
): HabitStatus[] {
  return habits.map(h => {
    const spent = spentByCat[h.categoryId] ?? 0;
    const progress = h.thresholdMinutes > 0 ? Math.min(1, spent / h.thresholdMinutes) : 0;
    return {
      habitId: h.id,
      spentMinutes: spent,
      satisfied: spent >= h.thresholdMinutes,
      progress,
    };
  });
}
