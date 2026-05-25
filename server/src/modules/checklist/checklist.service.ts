import { Types } from 'mongoose';
import { toDayKey } from '../../utils/date.js';
import { ChecklistDay } from './checklist.model.js';
import type { IChecklistItem } from './checklist.interface.js';

export const checklistService = {
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const doc = await ChecklistDay.findOne({ user: new Types.ObjectId(userId), date }).lean();
    return doc ?? { date: dateStr, items: [], totalPoints: 0 };
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
