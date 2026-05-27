import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/ApiError.js';
import { User } from './user.model.js';
import type { IChecklistTemplateItem, SafeUser } from './user.interface.js';
import { SALAH_DEFAULT_POINTS, type SalahScoring } from '../salah/salah.constants.js';

interface UpdateMeDto {
  name?: string;
  avatarUrl?: string;
  locale?: 'en' | 'bn' | 'ar';
  timezone?: string;
  scoring?: {
    onTimeAwwal?: number;
    onTimeMid?: number;
    onTimeLast?: number;
    missed?: number;
    sunnahNafil?: number;
    witr?: number;
  };
  defaultChecklistItems?: IChecklistTemplateItem[];
}

type Profile = SafeUser & {
  scoring: SalahScoring;
  defaultChecklistItems: IChecklistTemplateItem[];
};

function projectProfile(
  user: { toSafeJSON: () => SafeUser; scoring?: Partial<SalahScoring>; defaultChecklistItems?: IChecklistTemplateItem[] },
): Profile {
  return {
    ...user.toSafeJSON(),
    scoring: { ...SALAH_DEFAULT_POINTS, ...(user.scoring ?? {}) },
    defaultChecklistItems: user.defaultChecklistItems ?? [],
  };
}

export const userService = {
  async getMe(userId: string): Promise<Profile> {
    const user = await User.findById(new Types.ObjectId(userId));
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    return projectProfile(user);
  },

  async updateMe(userId: string, dto: UpdateMeDto): Promise<Profile> {
    const user = await User.findById(new Types.ObjectId(userId));
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl || undefined;
    if (dto.locale !== undefined) user.locale = dto.locale;
    if (dto.timezone !== undefined) user.timezone = dto.timezone;
    if (dto.scoring) {
      user.scoring = { ...(user.scoring ?? {}), ...dto.scoring };
    }
    if (dto.defaultChecklistItems !== undefined) {
      user.defaultChecklistItems = dto.defaultChecklistItems;
    }

    await user.save();
    return projectProfile(user);
  },

  async resetScoring(userId: string): Promise<Profile> {
    const user = await User.findById(new Types.ObjectId(userId));
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    user.scoring = undefined;
    await user.save();
    return projectProfile(user);
  },
};
