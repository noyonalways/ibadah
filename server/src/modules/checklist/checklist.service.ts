import { Types } from 'mongoose';
import { toDayKey } from '../../utils/date.js';
import { ChecklistDay } from './checklist.model.js';
import { User } from '../user/user.model.js';
import type { IChecklistItem } from './checklist.interface.js';

export const checklistService = {
  /**
   * Returns the day's checklist. If the user hasn't touched today's list yet
   * AND has configured a default-checklist template, the template seeds the
   * day so they don't start from an empty list every morning.
   */
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const userObj = new Types.ObjectId(userId);
    const existing = await ChecklistDay.findOne({ user: userObj, date });
    if (existing) {
      return existing.toObject();
    }

    // No record — try to seed from the user's default template (today only).
    const today = toDayKey(new Date());
    const isToday = date.getTime() === today.getTime();
    if (isToday) {
      const u = await User.findById(userObj).select('defaultChecklistItems').lean();
      const template = u?.defaultChecklistItems ?? [];
      if (template.length > 0) {
        const seeded = await ChecklistDay.create({
          user: userObj,
          date,
          items: template.map((t) => ({
            title: t.title,
            rewardPoints: t.rewardPoints,
            completed: false,
          })),
          totalPoints: 0,
        });
        return seeded.toObject();
      }
    }

    // Otherwise, return a virtual empty day so the UI can render consistently.
    return { date: dateStr, items: [], totalPoints: 0 };
  },

  async upsertDay(userId: string, dateStr: string, items: IChecklistItem[]) {
    const date = toDayKey(dateStr);
    const totalPoints = items
      .filter((i) => i.completed)
      .reduce((sum, i) => sum + (i.rewardPoints ?? 0), 0);

    return ChecklistDay.findOneAndUpdate(
      { user: new Types.ObjectId(userId), date },
      { $set: { items, totalPoints } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  },
};
