'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getDateRangeForPeriod,
  type ReportPeriod,
  type AdminReportType,
} from '@/lib/report-api';
import { generateAdminReportPDF } from '@/lib/pdf-generator';
import { analyticsApi } from '@/lib/admin-api';
import { formatDayKey } from '@/lib/utils';

export function AdminReportDownload() {
  const t = useTranslations('Reports');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  const handleDownload = async (reportType: AdminReportType, period: ReportPeriod) => {
    const key = `${reportType}-${period}`;
    setIsGenerating(true);
    setGeneratingKey(key);

    try {
      const dateRange = getDateRangeForPeriod(period);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      let reportData: any = {
        reportType,
        startDate: startDate.toLocaleDateString(),
        endDate: endDate.toLocaleDateString(),
      };

      // Fetch analytics data if analytics report
      if (reportType === 'analytics') {
        const analytics = await analyticsApi.overview({
          from: formatDayKey(startDate),
          to: formatDayKey(endDate),
        });

        reportData = {
          ...reportData,
          totalSignups: analytics.signups?.total || 0,
          activeUsers: analytics.activeUsers?.unique || 0,
          salahPoints: analytics.pillars?.salah?.totalPoints || 0,
          habitsPoints: analytics.pillars?.habits?.totalPoints || 0,
          checklistPoints: analytics.pillars?.checklist?.totalPoints || 0,
          quranPages: analytics.pillars?.quran?.totalPages || 0,
          dhikrCount: analytics.pillars?.dhikr?.totalCount || 0,
        };
      }

      await generateAdminReportPDF(reportData);
      toast.success(t('downloadSuccess'));
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error(t('downloadError'));
    } finally {
      setIsGenerating(false);
      setGeneratingKey(null);
    }
  };

  const reportTypes: { value: AdminReportType; labelKey: string }[] = [
    { value: 'analytics', labelKey: 'analytics' },
    { value: 'users', labelKey: 'users' },
    { value: 'moderation', labelKey: 'moderation' },
    { value: 'audit', labelKey: 'audit' },
  ];

  const periods: { value: ReportPeriod; labelKey: string }[] = [
    { value: 'daily', labelKey: 'daily' },
    { value: 'weekly', labelKey: 'weekly' },
    { value: 'monthly', labelKey: 'monthly' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          <span>{t('downloadReport')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('selectReportType')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {reportTypes.map((reportType) => (
          <DropdownMenuSub key={reportType.value}>
            <DropdownMenuSubTrigger>
              {t(reportType.labelKey)}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {periods.map((period) => {
                const key = `${reportType.value}-${period.value}`;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleDownload(reportType.value, period.value)}
                    disabled={isGenerating}
                    className="cursor-pointer"
                  >
                    {generatingKey === key && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {t(period.labelKey)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
