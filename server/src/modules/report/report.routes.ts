/**
 * Report routes — PDF report generation, split by audience.
 *
 *   - clientReportRouter →  /reports/client/*  (any authenticated user)
 *   - adminReportRouter  →  /reports/admin/*   (admins only)
 */
import { Router } from 'express';
import { ReportController } from '@/modules/report/report.controller';
import { requireAuth, requireAdmin } from '@/middleware/auth';

const controller = new ReportController();

// Client report routes — available to any authenticated user.
export const clientReportRouter = Router();
clientReportRouter.use(requireAuth);
clientReportRouter.post('/pdf', controller.generateUserPdf);

// Admin report routes — admins only.
export const adminReportRouter = Router();
adminReportRouter.use(requireAuth, requireAdmin);
adminReportRouter.post('/pdf', controller.generateAdminPdf);
