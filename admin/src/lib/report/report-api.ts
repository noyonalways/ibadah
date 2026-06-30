/**
 * API functions for generating and downloading admin PDF reports
 */
import { axiosInstance } from '../axios';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export type AdminReportType = 'analytics' | 'users' | 'moderation' | 'audit';

interface GenerateAdminReportParams {
  reportType: AdminReportType;
  startDate: string; // ISO datetime string
  endDate: string; // ISO datetime string
  filters?: Record<string, unknown>;
}

/**
 * Generate and download an admin report PDF
 */
export async function downloadAdminReport(params: GenerateAdminReportParams): Promise<void> {
  const response = await axiosInstance.post<Blob>('/reports/admin/pdf', params, {
    responseType: 'blob',
  });

  const blob = response.data;

  // Create a download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `admin-${params.reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Helper to get date range for a report period
 */
export function getDateRangeForPeriod(period: ReportPeriod): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: Date;

  switch (period) {
    case 'daily':
      // Last 24 hours
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      // Last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      // Last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate,
  };
}
