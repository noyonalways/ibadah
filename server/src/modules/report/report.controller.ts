/**
 * Report controller — generates downloadable PDF reports for users and admins.
 */
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ReportService } from '@/modules/report/report.service';
import { userReportSchema, adminReportSchema } from '@/modules/report/report.validation';

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  /**
   * Generate user progress report PDF
   * POST /api/v1/reports/client/pdf
   */
  generateUserPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = userReportSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const pdfBuffer = await this.reportService.generateUserReport({
        userId,
        dateRange: {
          start: new Date(parsed.startDate),
          end: new Date(parsed.endDate),
        },
        includeCharts: parsed.includeCharts,
        locale: parsed.locale,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ibadah-report-${userId}-${Date.now()}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate admin analytics report PDF
   * POST /api/v1/reports/admin/pdf
   */
  generateAdminPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = adminReportSchema.parse(req.body);

      const pdfBuffer = await this.reportService.generateAdminReport({
        reportType: parsed.reportType,
        dateRange: {
          start: new Date(parsed.startDate),
          end: new Date(parsed.endDate),
        },
        filters: parsed.filters,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="admin-${parsed.reportType}-${Date.now()}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
