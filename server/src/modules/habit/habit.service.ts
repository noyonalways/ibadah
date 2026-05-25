import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/ApiError.js';
import { toDayKey } from '../../utils/date.js';
import { Habit, HabitDay } from './habit.model.js';
import type { IHabitDayEntry } from './habit.interface.js';

export const habitService = {
  // --- Habit definitions ---
  async listHabits(userId: string) {
    return Habit.find({ user: new Types.ObjectId(userId), archived: false })
      .sort({ createdAt: -1 })
      .lean();
  },

  async createHabit(userId: string, payload: Record<string, unknown>) {
    return Habit.create({ ...payload, user: new Types.ObjectId(userId) });
  },

  async updateHabit(userId: string, id: string, payload: Record<string, unknown>) {
    const doc = await Habit.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId) },
      { $set: payload },
      { new: true },
    );
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Habit not found');
    return doc;
  },

  async deleteHabit(userId: string, id: string) {
    const doc = await Habit.findOneAndDelete({ _id: id, user: new Types.ObjectId(userId) });
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Habit not found');
  },

  // --- Daily completions ---
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const doc = await HabitDay.findOne({ user: new Types.ObjectId(userId), date }).lean();
    return doc ?? { date: dateStr, entries: [], totalPoints: 0 };
  },

  async upsertDay(userId: string, dateStr: string, entries: IHabitDayEntry[]) {
    const date = toDayKey(dateStr);
    const userObj = new Types.ObjectId(userId);

    // Compute totalPoints from completed habits' rewardPoints.
    const habitIds = entries.filter((e) => e.completed).map((e) => e.habit);
    const habits = await Habit.find({ _id: { $in: habitIds }, user: userObj })
      .select('rewardPoints')
      .lean();
    const totalPoints = habits.reduce((sum, h) => sum + (h.rewardPoints ?? 0), 0);

    return HabitDay.findOneAndUpdate(
      { user: userObj, date },
      { $set: { entries, totalPoints } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  },
};
