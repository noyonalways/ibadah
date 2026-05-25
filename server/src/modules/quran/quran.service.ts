import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../utils/ApiError.js';
import { toDayKey } from '../../utils/date.js';
import { QuranDay } from './quran.model.js';

export const quranService = {
  async getDay(userId: string, dateStr: string) {
    const date = toDayKey(dateStr);
    const doc = await QuranDay.findOne({ user: new Types.ObjectId(userId), date }).lean();
    return (
      doc ?? {
        date: dateStr,
        pagesRead: 0,
        minutesRead: 0,
      }
    );
  },

  async upsertDay(userId: string, dateStr: string, payload: Record<string, unknown>) {
    const date = toDayKey(dateStr);
    const doc = await QuranDay.findOneAndUpdate(
      { user: new Types.ObjectId(userId), date },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc;
  },

  async listRange(userId: string, fromStr: string, toStr: string) {
    const from = toDayKey(fromStr);
    const to = toDayKey(toStr);
    if (from > to) throw new ApiError(StatusCodes.BAD_REQUEST, '`from` must be ≤ `to`');
    return QuranDay.find({ user: new Types.ObjectId(userId), date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean();
  },
};
