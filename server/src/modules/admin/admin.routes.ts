import { Router } from 'express';

import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { adminController } from './admin.controller.js';
import {
  activeUsersSchema,
  analyticsRangeSchema,
  leaderboardSchema,
  listUsersSchema,
  updateDefaultsSchema,
  updateUserSchema,
  userAnalyticsSchema,
  userIdParamsSchema,
} from './admin.validation.js';
import { moderationController } from '../moderation/moderation.controller.js';
import {
  decideSchema,
  flagManualSchema,
  listModerationSchema,
} from '../moderation/moderation.validation.js';
import { auditController } from '../audit/audit.controller.js';
import { listAuditSchema } from '../audit/audit.validation.js';

export const adminRouter = Router();

// All /admin/* routes require an authenticated admin. Anything below
// receives a populated `req.user` with `role === 'admin'`.
adminRouter.use(requireAuth, requireAdmin);

// --- Analytics ---
adminRouter.get('/metrics', adminController.metrics);
adminRouter.get('/leaderboard', validate(leaderboardSchema), adminController.leaderboard);
adminRouter.get('/active-users', validate(activeUsersSchema), adminController.activeUsers);
adminRouter.get('/health', adminController.health);
// Rich analytics: timeline + pillar breakdown + score distribution.
adminRouter.get(
  '/analytics/overview',
  validate(analyticsRangeSchema),
  adminController.analyticsOverview,
);

// --- User management ---
adminRouter.get('/users', validate(listUsersSchema), adminController.listUsers);
adminRouter.get('/users/:id', validate(userIdParamsSchema), adminController.getUser);
adminRouter.patch('/users/:id', validate(updateUserSchema), adminController.updateUser);
adminRouter.delete('/users/:id', validate(userIdParamsSchema), adminController.deleteUser);
adminRouter.get(
  '/users/:id/analytics',
  validate(userAnalyticsSchema),
  adminController.userAnalytics,
);

// --- Defaults catalog (starter templates for new users) ---
adminRouter.get('/defaults', adminController.getDefaults);
adminRouter.put('/defaults', validate(updateDefaultsSchema), adminController.updateDefaults);

// --- System dashboard (combines metrics + extended health) ---
adminRouter.get('/dashboard', adminController.dashboard);

// --- Moderation queue ---
adminRouter.get(
  '/moderation/overview',
  moderationController.overview,
);
adminRouter.get(
  '/moderation/queue',
  validate(listModerationSchema),
  moderationController.list,
);
adminRouter.post('/moderation/scan', moderationController.scan);
adminRouter.post(
  '/moderation/flags',
  validate(flagManualSchema),
  moderationController.flag,
);
adminRouter.post(
  '/moderation/flags/:id/decision',
  validate(decideSchema),
  moderationController.decide,
);

// --- Audit log ---
adminRouter.get('/audit', validate(listAuditSchema), auditController.list);
adminRouter.get('/audit/actions', auditController.actions);
adminRouter.get('/audit/summary', auditController.summary);
