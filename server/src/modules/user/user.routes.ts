import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { userController } from './user.controller.js';
import { updateMeSchema } from './user.validation.js';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get('/me', userController.getMe);
userRouter.patch('/me', validate(updateMeSchema), userController.updateMe);
userRouter.post('/me/scoring/reset', userController.resetScoring);
