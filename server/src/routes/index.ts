import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes.js';
import { userRouter } from '../modules/user/user.routes.js';
import { salahRouter } from '../modules/salah/salah.routes.js';
import { quranRouter } from '../modules/quran/quran.routes.js';
import { dhikrRouter } from '../modules/dhikr/dhikr.routes.js';
import { habitRouter } from '../modules/habit/habit.routes.js';
import { checklistRouter } from '../modules/checklist/checklist.routes.js';
import { statsRouter } from '../modules/stats/stats.routes.js';
import { adminRouter } from '../modules/admin/admin.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({ name: 'Ibadah API', version: 'v1' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/salah', salahRouter);
apiRouter.use('/quran', quranRouter);
apiRouter.use('/dhikr', dhikrRouter);
apiRouter.use('/habits', habitRouter);
apiRouter.use('/checklist', checklistRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/admin', adminRouter);
