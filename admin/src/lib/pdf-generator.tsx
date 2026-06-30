/**
 * Beautiful, colorful admin PDF generator using @react-pdf/renderer
 * Dark theme matching Ibadah Admin's design
 */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { AdminReportType } from './report/report-api';

export interface AdminReportData {
  reportType: AdminReportType;
  startDate: string;
  endDate: string;
  totalSignups?: number;
  activeUsers?: number;
  salahPoints?: number;
  habitsPoints?: number;
  checklistPoints?: number;
  quranPages?: number;
  dhikrCount?: number;
}

// Ibadah Admin dark color palette
const colors = {
  primary: '#10b981',      // emerald-500
  primaryDark: '#059669',  // emerald-600
  accent: '#fbbf24',       // amber-400
  background: '#1e293b',   // slate-800
  cardBg: '#334155',       // slate-700
  text: '#f8fafc',         // slate-50
  textMuted: '#94a3b8',    // slate-400
  border: 'rgba(16, 185, 129, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0f172a',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    backgroundColor: colors.primary,
    padding: 40,
    color: 'white',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '4 12',
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  reportTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 12,
    fontSize: 12,
  },
  content: {
    padding: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  pillarsSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  pillarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pillarIcon: {
    fontSize: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    paddingTop: 8,
  },
  pillarName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  pillarValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
  },
  summaryIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 1.6,
  },
  confidential: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    padding: '4 12',
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignSelf: 'center',
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 20,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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

const reportTitles: Record<AdminReportType, string> = {
  analytics: 'Platform Analytics',
  users: 'User Statistics',
  moderation: 'Moderation Report',
  audit: 'Audit Log Summary',
};

const AdminReportDocument: React.FC<{ data: AdminReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Ibadah Admin</Text>
          <View style={styles.adminBadge}>
            <Text>Operations Console</Text>
          </View>
          <Text style={styles.reportTitle}>{reportTitles[data.reportType]}</Text>
          <View style={styles.dateInfo}>
            <Text>📅 Report Period: {data.startDate} — {data.endDate}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {data.reportType === 'analytics' ? (
            <>
              {/* Platform Metrics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platform Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricIcon}>👥</Text>
                    <Text style={styles.metricLabel}>Total Signups</Text>
                    <Text style={styles.metricValue}>
                      {data.totalSignups?.toLocaleString() || '—'}
                    </Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricIcon}>✨</Text>
                    <Text style={styles.metricLabel}>Active Users</Text>
                    <Text style={styles.metricValue}>
                      {data.activeUsers?.toLocaleString() || '—'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Activity by Pillar */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity by Pillar</Text>
                <View style={styles.pillarsSection}>
                  <View style={styles.pillarItem}>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarIcon}>🕌</Text>
                      <Text style={styles.pillarName}>Salah (Prayer)</Text>
                    </View>
                    <Text style={styles.pillarValue}>
                      {data.salahPoints?.toLocaleString() || 0} pts
                    </Text>
                  </View>
                  <View style={styles.pillarItem}>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarIcon}>⭐</Text>
                      <Text style={styles.pillarName}>Habits</Text>
                    </View>
                    <Text style={styles.pillarValue}>
                      {data.habitsPoints?.toLocaleString() || 0} pts
                    </Text>
                  </View>
                  <View style={styles.pillarItem}>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarIcon}>✓</Text>
                      <Text style={styles.pillarName}>Checklist</Text>
                    </View>
                    <Text style={styles.pillarValue}>
                      {data.checklistPoints?.toLocaleString() || 0} pts
                    </Text>
                  </View>
                  <View style={styles.pillarItem}>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarIcon}>📖</Text>
                      <Text style={styles.pillarName}>Quran</Text>
                    </View>
                    <Text style={styles.pillarValue}>
                      {data.quranPages?.toLocaleString() || 0} pages
                    </Text>
                  </View>
                  <View style={[styles.pillarItem, { borderBottomWidth: 0 }]}>
                    <View style={styles.pillarInfo}>
                      <Text style={styles.pillarIcon}>🤲</Text>
                      <Text style={styles.pillarName}>Dhikr</Text>
                    </View>
                    <Text style={styles.pillarValue}>
                      {data.dhikrCount?.toLocaleString() || 0} count
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.section}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryIcon}>📊</Text>
                <Text style={styles.summaryTitle}>{reportTitles[data.reportType]}</Text>
                <Text style={styles.summaryText}>
                  Detailed {data.reportType} data for the selected period.{'\n'}
                  This report provides comprehensive insights into platform operations.
                </Text>
              </View>
            </View>
          )}

          {/* Confidential Notice */}
          <View style={styles.section}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryIcon}>🔒</Text>
              <Text style={styles.summaryTitle}>Confidential Report</Text>
              <Text style={styles.summaryText}>
                This document contains sensitive operational data.{'\n'}
                Handle with care and maintain confidentiality.
              </Text>
              <View style={styles.confidential}>
                <Text>Internal Use Only</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleString()} • <Text style={styles.footerBrand}>Ibadah Admin Console</Text>
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export async function generateAdminReportPDF(data: AdminReportData): Promise<void> {
  const blob = await pdf(<AdminReportDocument data={data} />).toBlob();
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `admin-${data.reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
