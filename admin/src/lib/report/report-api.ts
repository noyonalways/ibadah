/**
 * API functions for generating and downloading admin PDF reports
 */
import { authStorage } from './auth-storage';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export type AdminReportType = 'analytics' | 'users' | 'moderation' | 'audit';

interface GenerateAdminReportParams {
  reportType: AdminReportType;
  startDate: string; // ISO datetime string
  endDate: string; // ISO datetime string
  filters?: Record<string, unknown>;
}

const token = () => authStorage.getAccess();

/**
 * Generate and download an admin report PDF
 */
export async function downloadAdminReport(params: GenerateAdminReportParams): Promise<void> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/admin/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  // Get the PDF blob
  const blob = await response.blob();
  
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
