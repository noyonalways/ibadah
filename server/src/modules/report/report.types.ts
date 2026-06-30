/**
 * Types for PDF report generation.
 */

export interface PdfGenerationOptions {
  userId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts?: boolean;
  locale?: string;
}

export interface AdminPdfOptions {
  reportType: 'analytics' | 'users' | 'moderation' | 'audit';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
}
