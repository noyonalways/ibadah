/**
 * Beautiful, colorful PDF generator using @react-pdf/renderer
 * Matches Ibadah's Islamic design with emerald greens and warm golds
 */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

interface UserReportData {
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  salahPoints: number;
  habitPoints: number;
  checklistPoints: number;
  quranPages: number;
  recentDays: Array<{
    date: string;
    total: number;
    salah: number;
    habit: number;
    checklist: number;
  }>;
}

// Ibadah color palette
const colors = {
  primary: '#059669',      // emerald-600
  primaryLight: '#10b981', // emerald-500
  primaryDark: '#047857',  // emerald-700
  accent: '#f59e0b',       // amber-500
  accentLight: '#fbbf24',  // amber-400
  background: '#f0fdf4',   // emerald-50
  cardBg: '#ffffff',
  text: '#0f172a',         // slate-900
  textMuted: '#64748b',    // slate-500
  border: '#d1fae5',       // emerald-200
  success: '#10b981',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.primary,
    padding: 40,
    color: 'white',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 11,
    marginBottom: 8,
    opacity: 0.9,
  },
  dateRange: {
    fontSize: 11,
    opacity: 0.85,
  },
  content: {
    padding: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pillarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pillarCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  pillarCardSalah: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  pillarCardHabits: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  pillarCardChecklist: {
    backgroundColor: '#fce7f3',
    borderColor: '#f9a8d4',
  },
  pillarCardQuran: {
    backgroundColor: '#e0e7ff',
    borderColor: '#a5b4fc',
  },
  pillarIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  pillarName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  pillarValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  activityBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activityDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  activityPoints: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  activityTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  activityBreakdown: {
    fontSize: 9,
    color: colors.textMuted,
  },
  encouragement: {
    backgroundColor: '#fef3c7',
    padding: 24,
    borderRadius: 12,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#fcd34d',
    marginTop: 24,
  },
  encouragementIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  encouragementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 1.6,
  },
  footer: {
    backgroundColor: '#f8fafc',
    padding: 20,
    textAlign: 'center',
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  footerBrand: {
    fontWeight: 'bold',
    color: colors.primary,
  },
});

const UserReportDocument: React.FC<{ data: UserReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Ibadah</Text>
          <Text style={styles.tagline}>Journey Towards Allah</Text>
          <Text style={styles.reportTitle}>Progress Report</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{data.userName}</Text>
            <Text style={styles.userEmail}>{data.userEmail}</Text>
            <Text style={styles.dateRange}>📅 {data.startDate} — {data.endDate}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Overall Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Points</Text>
                <Text style={styles.statValue}>{data.totalPoints.toLocaleString()}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Active Days</Text>
                <Text style={styles.statValue}>
                  {data.activeDays}
                  <Text style={styles.statUnit}> days</Text>
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>
                  {data.currentStreak}
                  <Text style={styles.statUnit}> days</Text>
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Longest Streak</Text>
                <Text style={styles.statValue}>
                  {data.longestStreak}
                  <Text style={styles.statUnit}> days</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Points by Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points by Activity</Text>
            <View style={styles.pillarGrid}>
              <View style={[styles.pillarCard, styles.pillarCardSalah]}>
                <Text style={styles.pillarIcon}>🕌</Text>
                <Text style={styles.pillarName}>Salah (Prayer)</Text>
                <Text style={styles.pillarValue}>{data.salahPoints}</Text>
              </View>
              <View style={[styles.pillarCard, styles.pillarCardHabits]}>
                <Text style={styles.pillarIcon}>⭐</Text>
                <Text style={styles.pillarName}>Habits</Text>
                <Text style={styles.pillarValue}>{data.habitPoints}</Text>
              </View>
              <View style={[styles.pillarCard, styles.pillarCardChecklist]}>
                <Text style={styles.pillarIcon}>✓</Text>
                <Text style={styles.pillarName}>Checklist</Text>
                <Text style={styles.pillarValue}>{data.checklistPoints}</Text>
              </View>
              <View style={[styles.pillarCard, styles.pillarCardQuran]}>
                <Text style={styles.pillarIcon}>📖</Text>
                <Text style={styles.pillarName}>Quran Pages</Text>
                <Text style={styles.pillarValue}>{data.quranPages}</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityBox}>
              {data.recentDays.map((day, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.activityItem,
                    index === data.recentDays.length - 1 ? { borderBottomWidth: 0 } : {}
                  ]}
                >
                  <Text style={styles.activityDate}>{day.date}</Text>
                  <View style={styles.activityPoints}>
                    <Text style={styles.activityTotal}>{day.total} pts</Text>
                    <Text style={styles.activityBreakdown}>
                      Salah: {day.salah} • Habits: {day.habit} • Tasks: {day.checklist}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Encouragement */}
          <View style={styles.encouragement}>
            <Text style={styles.encouragementIcon}>🌟</Text>
            <Text style={styles.encouragementTitle}>Keep up the great work!</Text>
            <Text style={styles.encouragementText}>
              Consistency is key to building lasting spiritual habits.{'\n'}
              May Allah accept your efforts and grant you steadfastness.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleString()} • <Text style={styles.footerBrand}>Ibadah Platform</Text>
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export async function generateUserReportPDF(data: UserReportData): Promise<void> {
  const blob = await pdf(<UserReportDocument data={data} />).toBlob();
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ibadah-report-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
