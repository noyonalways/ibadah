/**
 * PDF generation service for client and admin reports
 */
import PDFDocument from 'pdfkit';
import type { PdfGenerationOptions, AdminPdfOptions } from '@/modules/ai/ai.types';
import { statsService } from '@/modules/stats/stats.service';
import { userService } from '@/modules/user/user.service';
import { adminAnalyticsService } from '@/modules/admin/analytics.service';
import { formatDayKey } from '@/utils/date';

export class PdfService {
  /**
   * Generate a user progress report PDF
   */
  async generateUserReport(options: PdfGenerationOptions): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Fetch user data
    const user = await userService.getMe(options.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const fromStr = formatDayKey(options.dateRange.start);
    const toStr = formatDayKey(options.dateRange.end);

    const [dailyPoints, streaks] = await Promise.all([
      statsService.dailyPoints(options.userId, fromStr, toStr),
      statsService.streaks(options.userId),
    ]);

    // Calculate totals
    const totalPoints = dailyPoints.reduce((sum, day) => sum + day.total, 0);
    const totalSalahPoints = dailyPoints.reduce((sum, day) => sum + day.salah, 0);
    const totalHabitPoints = dailyPoints.reduce((sum, day) => sum + day.habit, 0);
    const totalChecklistPoints = dailyPoints.reduce((sum, day) => sum + day.checklist, 0);
    const totalQuranPages = dailyPoints.reduce((sum, day) => sum + day.quranPages, 0);
    const activeDays = dailyPoints.filter((day) => day.total > 0).length;

    // Header
    this.addReportHeader(doc, 'Ibadah Progress Report');
    doc.moveDown();

    // User info
    doc.fontSize(14).fillColor('#1e293b').text(`User: ${user.name}`);
    doc.fontSize(10).fillColor('#475569').text(`Email: ${user.email}`);
    doc.text(
      `Report Period: ${options.dateRange.start.toLocaleDateString(options.locale)} - ${options.dateRange.end.toLocaleDateString(options.locale)}`,
    );
    doc.moveDown(2);

    // Overall statistics
    doc.fontSize(16).fillColor('#1e293b').text('Overall Statistics', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#334155');
    doc.text(`Total Points Earned: ${totalPoints}`);
    doc.text(`Active Days: ${activeDays}`);
    doc.text(`Current Streak: ${streaks.current} days`);
    doc.text(`Longest Streak: ${streaks.longest} days`);
    doc.moveDown(2);

    // Breakdown by pillar
    doc.fontSize(16).fillColor('#1e293b').text('Points by Activity', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#334155');
    doc.text(`Salah (Prayer): ${totalSalahPoints} points`);
    doc.text(`Habits: ${totalHabitPoints} points`);
    doc.text(`Checklist: ${totalChecklistPoints} points`);
    doc.text(`Quran Pages Read: ${totalQuranPages} pages`);
    doc.moveDown(2);

    // Daily breakdown (last 7 days)
    if (dailyPoints.length > 0) {
      doc.fontSize(16).fillColor('#1e293b').text('Recent Activity', { underline: true });
      doc.moveDown();
      doc.fontSize(10).fillColor('#334155');

      const recentDays = dailyPoints.slice(-7);
      recentDays.forEach((day) => {
        doc.text(
          `${new Date(day.date).toLocaleDateString(options.locale)}: ${day.total} points (Salah: ${day.salah}, Habits: ${day.habit}, Checklist: ${day.checklist})`,
        );
      });
      doc.moveDown(2);
    }

    // Encouragement message
    doc.fontSize(12).fillColor('#2563eb').text('Keep up the great work! 🌟', { align: 'center' });
    doc.fontSize(10).fillColor('#475569').text(
      'Consistency is key to building lasting spiritual habits.',
      { align: 'center' },
    );

    // Footer
    this.addReportFooter(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  /**
   * Generate an admin analytics report PDF
   */
  async generateAdminReport(options: AdminPdfOptions): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    this.addReportHeader(doc, `Admin Report: ${options.reportType.toUpperCase()}`);
    doc.moveDown();

    // Date range
    doc.fontSize(10).fillColor('#475569').text(
      `Report Period: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}`,
    );
    doc.moveDown(2);

    // Fetch data based on report type
    switch (options.reportType) {
      case 'analytics':
        await this.addAnalyticsSection(doc, options);
        break;
      case 'users':
        await this.addUsersSection(doc, options);
        break;
      case 'moderation':
        await this.addModerationSection(doc, options);
        break;
      case 'audit':
        await this.addAuditSection(doc, options);
        break;
    }

    // Footer
    this.addReportFooter(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  private addReportHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .fontSize(24)
      .fillColor('#2563eb')
      .text(title, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown();
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown();
  }

  private addReportFooter(doc: PDFKit.PDFDocument): void {
    const bottomY = doc.page.height - 50;
    doc
      .fontSize(8)
      .fillColor('#6b7280')
      .text(
        `Generated on ${new Date().toLocaleString()} | Ibadah Platform`,
        50,
        bottomY,
        { align: 'center' },
      );
  }

  private async addAnalyticsSection(
    doc: PDFKit.PDFDocument,
    options: AdminPdfOptions,
  ): Promise<void> {
    const analytics = await adminAnalyticsService.overview({
      from: formatDayKey(options.dateRange.start),
      to: formatDayKey(options.dateRange.end),
    });

    doc.fontSize(16).fillColor('#1e293b').text('Platform Analytics', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#334155');

    if (analytics.signups) {
      doc.text(`Total Signups: ${analytics.signups.total || 0}`);
    }

    if (analytics.activeUsers) {
      doc.text(`Unique Active Users: ${analytics.activeUsers.unique || 0}`);
      doc.moveDown();
    }

    if (analytics.pillars) {
      doc.fontSize(14).fillColor('#1e293b').text('Activity by Pillar:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#334155');
      
      if (analytics.pillars.salah) {
        doc.text(`Salah: ${analytics.pillars.salah.totalPoints || 0} points`);
      }
      if (analytics.pillars.habits) {
        doc.text(`Habits: ${analytics.pillars.habits.totalPoints || 0} points`);
      }
      if (analytics.pillars.checklist) {
        doc.text(`Checklist: ${analytics.pillars.checklist.totalPoints || 0} points`);
      }
      if (analytics.pillars.quran) {
        doc.text(`Quran: ${analytics.pillars.quran.totalPages || 0} pages`);
      }
      if (analytics.pillars.dhikr) {
        doc.text(`Dhikr: ${analytics.pillars.dhikr.totalCount || 0} count`);
      }
    }
  }

  private async addUsersSection(
    doc: PDFKit.PDFDocument,
    _options: AdminPdfOptions,
  ): Promise<void> {
    doc.fontSize(16).fillColor('#1e293b').text('User Statistics', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#334155');
    doc.text('User report data will be populated here.');
    // Add actual user statistics implementation
  }

  private async addModerationSection(
    doc: PDFKit.PDFDocument,
    _options: AdminPdfOptions,
  ): Promise<void> {
    doc.fontSize(16).fillColor('#1e293b').text('Moderation Report', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#334155');
    doc.text('Moderation report data will be populated here.');
    // Add actual moderation statistics implementation
  }

  private async addAuditSection(
    doc: PDFKit.PDFDocument,
    _options: AdminPdfOptions,
  ): Promise<void> {
    doc.fontSize(16).fillColor('#1e293b').text('Audit Log Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#334155');
    doc.text('Audit log summary will be populated here.');
    // Add actual audit log implementation
  }
}
