import { Router } from 'express';

import { authRouter } from '@/modules/auth/auth.routes';
import { userRouter } from '@/modules/user/user.routes';
import { salahRouter } from '@/modules/salah/salah.routes';
import { quranRouter } from '@/modules/quran/quran.routes';
import { dhikrRouter } from '@/modules/dhikr/dhikr.routes';
import { habitRouter } from '@/modules/habit/habit.routes';
import { checklistRouter } from '@/modules/checklist/checklist.routes';
import { statsRouter } from '@/modules/stats/stats.routes';
import { adminRouter } from '@/modules/admin/admin.routes';
import { guestAiRouter, clientAiRouter, adminAiRouter } from '@/modules/ai/ai.routes';
import { aiConfigRouter } from '@/modules/ai/ai-config.routes';
import { clientReportRouter, adminReportRouter } from '@/modules/report/report.routes';
import {
  adminOnboardingRouter,
  clientOnboardingRouter,
} from '@/modules/onboarding/onboarding.routes';

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
apiRouter.use('/ai/guest', guestAiRouter);
apiRouter.use('/ai/client', clientAiRouter);
apiRouter.use('/ai/admin', adminAiRouter);
apiRouter.use('/ai/config', aiConfigRouter);
apiRouter.use('/reports/client', clientReportRouter);
apiRouter.use('/reports/admin', adminReportRouter);
apiRouter.use('/onboarding', clientOnboardingRouter);
apiRouter.use('/admin/onboarding', adminOnboardingRouter);
