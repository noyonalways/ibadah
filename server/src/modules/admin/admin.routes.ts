import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { adminController } from './admin.controller.js';
import {
  activeUsersSchema,
  leaderboardSchema,
  listUsersSchema,
  updateDefaultsSchema,
  updateUserSchema,
  userIdParamsSchema,
} from './admin.validation.js';

export const adminRouter = Router();

// All /admin/* routes require an authenticated admin. Anything below
// receives a populated `req.user` with `role === 'admin'`.
adminRouter.use(requireAuth, requireAdmin);

// --- Analytics ---
adminRouter.get('/metrics', adminController.metrics);
adminRouter.get('/leaderboard', validate(leaderboardSchema), adminController.leaderboard);
adminRouter.get('/active-users', validate(activeUsersSchema), adminController.activeUsers);
adminRouter.get('/health', adminController.health);

// --- User management ---
adminRouter.get('/users', validate(listUsersSchema), adminController.listUsers);
adminRouter.get('/users/:id', validate(userIdParamsSchema), adminController.getUser);
adminRouter.patch('/users/:id', validate(updateUserSchema), adminController.updateUser);
adminRouter.delete('/users/:id', validate(userIdParamsSchema), adminController.deleteUser);

// --- Defaults catalog (starter templates for new users) ---
adminRouter.get('/defaults', adminController.getDefaults);
adminRouter.put('/defaults', validate(updateDefaultsSchema), adminController.updateDefaults);
