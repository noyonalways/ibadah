'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDateRangeForPeriod, type ReportPeriod } from '@/lib/report/report-api';
import { generateUserReportPDF } from '@/lib/pdf-generator';
import { statsApi } from '@/lib/stats/stats-api';
import { useCurrentUser } from '@/hooks/use-auth';
import { toDayKey } from '@/lib/utils';

export function ReportDownload() {
  const t = useTranslations('Reports');
  const locale = useLocale();
  const { user } = useCurrentUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPeriod, setGeneratingPeriod] = useState<ReportPeriod | null>(null);

  const handleDownload = async (period: ReportPeriod) => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    setIsGenerating(true);
    setGeneratingPeriod(period);

    try {
      const dateRange = getDateRangeForPeriod(period);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const fromStr = toDayKey(startDate);
      const toStr = toDayKey(endDate);

      // Fetch data
      const [dailyPoints, streaks] = await Promise.all([
        statsApi.daily(fromStr, toStr),
        statsApi.streaks(),
      ]);

      // Calculate totals
      const totalPoints = dailyPoints.reduce((sum, day) => sum + day.total, 0);
      const totalSalahPoints = dailyPoints.reduce((sum, day) => sum + day.salah, 0);
      const totalHabitPoints = dailyPoints.reduce((sum, day) => sum + day.habit, 0);
      const totalChecklistPoints = dailyPoints.reduce((sum, day) => sum + day.checklist, 0);
      const totalQuranPages = dailyPoints.reduce((sum, day) => sum + day.quranPages, 0);
      const activeDays = dailyPoints.filter((day) => day.total > 0).length;

      // Get recent 7 days
      const recentDays = dailyPoints.slice(-7).map(day => ({
        date: new Date(day.date).toLocaleDateString(locale),
        total: day.total,
        salah: day.salah,
        habit: day.habit,
        checklist: day.checklist,
      }));

      // Generate PDF
      await generateUserReportPDF({
        userName: user.name,
        userEmail: user.email,
        startDate: startDate.toLocaleDateString(locale),
        endDate: endDate.toLocaleDateString(locale),
        totalPoints,
        activeDays,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        salahPoints: totalSalahPoints,
        habitPoints: totalHabitPoints,
        checklistPoints: totalChecklistPoints,
        quranPages: totalQuranPages,
        recentDays,
      });

      toast.success(t('downloadSuccess'));
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error(t('downloadError'));
    } finally {
      setIsGenerating(false);
      setGeneratingPeriod(null);
    }
  };

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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('selectPeriod')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDownload('daily')}
          disabled={isGenerating}
          className="cursor-pointer"
        >
          {generatingPeriod === 'daily' && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          {t('daily')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDownload('weekly')}
          disabled={isGenerating}
          className="cursor-pointer"
        >
          {generatingPeriod === 'weekly' && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          {t('weekly')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDownload('monthly')}
          disabled={isGenerating}
          className="cursor-pointer"
        >
          {generatingPeriod === 'monthly' && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          {t('monthly')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
