import { Types } from 'mongoose';
import { toDayKey, formatDayKey } from '../../utils/date.js';
import { SalahDay } from '../salah/salah.model.js';
import { QuranDay } from '../quran/quran.model.js';
import { HabitDay } from '../habit/habit.model.js';
import { ChecklistDay } from '../checklist/checklist.model.js';

interface DayPoints {
  date: string;
  salah: number;
  habit: number;
  checklist: number;
  quranPages: number;
  total: number;
}

export const statsService = {
  /**
   * Aggregated daily points across modules within a date range. Used for
   * weekly/monthly bar charts and heatmaps.
   */
  async dailyPoints(userId: string, fromStr: string, toStr: string): Promise<DayPoints[]> {
    const userObj = new Types.ObjectId(userId);
    const from = toDayKey(fromStr);
    const to = toDayKey(toStr);

    const [salah, habit, checklist, quran] = await Promise.all([
      SalahDay.find({ user: userObj, date: { $gte: from, $lte: to } })
        .select('date totalPoints')
        .lean(),
      HabitDay.find({ user: userObj, date: { $gte: from, $lte: to } })
        .select('date totalPoints')
        .lean(),
      ChecklistDay.find({ user: userObj, date: { $gte: from, $lte: to } })
        .select('date totalPoints')
        .lean(),
      QuranDay.find({ user: userObj, date: { $gte: from, $lte: to } })
        .select('date pagesRead minutesRead')
        .lean(),
    ]);

    const map = new Map<string, DayPoints>();
    const ensure = (d: Date): DayPoints => {
      const key = formatDayKey(d);
      if (!map.has(key)) {
        map.set(key, { date: key, salah: 0, habit: 0, checklist: 0, quranPages: 0, total: 0 });
      }
      return map.get(key)!;
    };

    for (const s of salah) ensure(s.date).salah = s.totalPoints ?? 0;
    for (const h of habit) ensure(h.date).habit = h.totalPoints ?? 0;
    for (const c of checklist) ensure(c.date).checklist = c.totalPoints ?? 0;
    for (const q of quran) ensure(q.date).quranPages = q.pagesRead ?? 0;

    const out = Array.from(map.values()).map((d) => ({
      ...d,
      total: d.salah + d.habit + d.checklist,
    }));
    out.sort((a, b) => a.date.localeCompare(b.date));
    return out;
  },

  /**
   * Compute current and longest "stick" streaks based on days where the user
   * had any positive total (salah + habit + checklist).
   */
  async streaks(userId: string) {
    const userObj = new Types.ObjectId(userId);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 365); // look back 1y
    const todayKey = toDayKey(new Date());

    const points = await this.dailyPoints(
      userId,
      formatDayKey(ninetyDaysAgo),
      formatDayKey(todayKey),
    );

    const activeDays = new Set(points.filter((p) => p.total > 0).map((p) => p.date));

    // current streak (counting backwards from today)
    let current = 0;
    const cursor = new Date(todayKey);
    while (activeDays.has(formatDayKey(cursor))) {
      current += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    // longest streak in window
    let longest = 0;
    let run = 0;
    const sorted = Array.from(activeDays).sort();
    let prev: Date | null = null;
    for (const day of sorted) {
      const d = new Date(day);
      if (prev) {
        const diff = (d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    }

    void userObj; // reserved for future per-module breakdown
    return { current, longest };
  },
};
