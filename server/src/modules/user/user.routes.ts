import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { userController } from '@/modules/user/user.controller';
import { updateMeSchema } from '@/modules/user/user.validation';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get('/me', userController.getMe);
userRouter.patch('/me', validate(updateMeSchema), userController.updateMe);
userRouter.post('/me/scoring/reset', userController.resetScoring);
