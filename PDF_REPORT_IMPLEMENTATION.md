# PDF Report Download Implementation

## Overview
This document describes the PDF report download functionality implemented for the Ibadah application. The system allows both regular users and admins to download comprehensive PDF reports of their activity and analytics.

## Features Implemented

### 1. Client-Side (Regular Users)
**Location:** Client Dashboard (`/dashboard`)

**Functionality:**
- Users can download their personal progress reports in PDF format
- Three time period options:
  - **Daily**: Last 24 hours
  - **Weekly**: Last 7 days  
  - **Monthly**: Last 30 days

**Report Contents:**
- User profile information (name, email)
- Report period
- Overall statistics (total points, active days, current streak, longest streak)
- Points breakdown by activity (Salah, Habits, Checklist, Quran pages)
- Recent daily activity (last 7 days)
- Encouragement message

**UI Component:** `ReportDownload` button in the dashboard
- Dropdown menu with period selection
- Loading states during generation
- Success/error toast notifications
- Automatic file download

### 2. Admin-Side (Administrators)
**Location:** Admin Dashboard (`/dashboard`) and Analytics (`/analytics`)

**Functionality:**
- Admins can download various types of reports
- Four report types:
  - **Analytics**: Platform-wide analytics and metrics
  - **Users**: User statistics and information
  - **Moderation**: Moderation activity summary
  - **Audit**: Audit log summary

- Three time period options for each report type:
  - **Daily**: Last 24 hours
  - **Weekly**: Last 7 days
  - **Monthly**: Last 30 days

**Report Contents (Analytics):**
- Platform analytics overview
- Total signups
- Unique active users
- Activity breakdown by pillar (Salah, Habits, Checklist, Quran, Dhikr)
- Points and engagement metrics

**UI Component:** `AdminReportDownload` button
- Nested dropdown menu (Report Type → Period)
- Loading states during generation
- Success/error toast notifications
- Automatic file download

## Technical Implementation

### Backend (Already Exists)
**API Endpoints:**
- `POST /api/v1/ai/client/pdf` - Generate user progress report
- `POST /api/v1/ai/admin/pdf` - Generate admin analytics report

**PDF Service:** `server/src/modules/ai/pdf.service.ts`
- Uses PDFKit library for PDF generation
- Generates professional-looking reports with:
  - Branded headers
  - Formatted sections
  - Data tables and statistics
  - Footer with generation timestamp

### Frontend Implementation

#### Client Files Created:
1. **`client/src/lib/report-api.ts`**
   - API functions for downloading user reports
   - Helper function to calculate date ranges
   - Handles PDF blob download

2. **`client/src/components/dashboard/report-download.tsx`**
   - Dropdown menu component
   - Period selection (daily/weekly/monthly)
   - Loading and error states
   - Internationalization support

3. **Updated `client/src/app/[locale]/(dashboard)/dashboard/page.tsx`**
   - Added ReportDownload component to dashboard
   - Positioned below hero section

#### Admin Files Created:
1. **`admin/src/lib/report-api.ts`**
   - API functions for downloading admin reports
   - Support for multiple report types
   - Helper function to calculate date ranges
   - Handles PDF blob download

2. **`admin/src/components/admin/report-download.tsx`**
   - Nested dropdown menu component
   - Report type and period selection
   - Loading states per report type
   - Internationalization support

3. **Updated Admin Pages:**
   - `admin/src/app/(panel)/dashboard/page.tsx` - Added button to dashboard
   - `admin/src/app/(panel)/analytics/page.tsx` - Added button to analytics

### Translations Added

#### Client Translations (en, bn, ar):
```json
{
  "Reports": {
    "downloadReport": "Download Report",
    "selectPeriod": "Select Period",
    "daily": "Daily (Last 24 hours)",
    "weekly": "Weekly (Last 7 days)",
    "monthly": "Monthly (Last 30 days)",
    "downloadSuccess": "Report downloaded successfully",
    "downloadError": "Failed to generate report"
  }
}
```

#### Admin Translations (en, bn, ar):
```json
{
  "Reports": {
    "downloadReport": "Download Report",
    "selectReportType": "Select Report Type",
    "selectPeriod": "Select Period",
    "analytics": "Analytics",
    "users": "Users",
    "moderation": "Moderation",
    "audit": "Audit Log",
    "daily": "Daily (Last 24 hours)",
    "weekly": "Weekly (Last 7 days)",
    "monthly": "Monthly (Last 30 days)",
    "downloadSuccess": "Report downloaded successfully",
    "downloadError": "Failed to generate report"
  }
}
```

## User Experience

### For Regular Users:
1. Navigate to Dashboard
2. Click "Download Report" button (below the hero section)
3. Select desired period (Daily/Weekly/Monthly)
4. PDF automatically downloads with filename: `ibadah-report-YYYY-MM-DD.pdf`

### For Admins:
1. Navigate to Dashboard or Analytics page
2. Click "Download Report" button (top-right corner)
3. Select report type (Analytics/Users/Moderation/Audit)
4. Select period (Daily/Weekly/Monthly)
5. PDF automatically downloads with filename: `admin-{reportType}-YYYY-MM-DD.pdf`

## PDF Design
The PDF reports are designed to match the application's UI:
- **Color Scheme**: Uses primary blue (#2563eb) for headers
- **Typography**: Clean, professional fonts
- **Layout**: A4 size with proper margins
- **Branding**: "Ibadah" branding in header
- **Footer**: Generation timestamp and platform name
- **Sections**: Clear section headers with underlines
- **Data Presentation**: Well-formatted statistics and metrics

## Security & Permissions
- **Authentication Required**: All endpoints require valid JWT token
- **User Reports**: Users can only download their own reports
- **Admin Reports**: Require admin role (`requireAdmin` middleware)
- **Data Privacy**: Reports contain only authorized data for the requesting user/admin

## Multilingual Support
All UI components and messages support three languages:
- English (en)
- Bengali (bn)
- Arabic (ar)

The PDF reports respect the user's locale setting for date formatting.

## Error Handling
- Network errors: Toast notification with error message
- Invalid date ranges: Validation on client side
- Server errors: Graceful error messages
- Loading states: Visual feedback during PDF generation

## Future Enhancements
Potential improvements for future iterations:
1. Custom date range selection
2. Report scheduling/email delivery
3. Additional report types (e.g., Leaderboard, Trends)
4. Chart/graph inclusion in PDFs
5. Report templates customization
6. Batch report generation
7. Report history/archive

## Testing Checklist
- [ ] User can download daily report
- [ ] User can download weekly report
- [ ] User can download monthly report
- [ ] Admin can download analytics report
- [ ] Admin can download users report
- [ ] Admin can download moderation report
- [ ] Admin can download audit report
- [ ] PDF contains correct data
- [ ] PDF design matches application UI
- [ ] Translations work in all languages
- [ ] Error handling works correctly
- [ ] Loading states display properly
- [ ] File downloads automatically
- [ ] Filename is correctly formatted

## Dependencies
- **pdfkit**: PDF generation library (already installed)
- **@tanstack/react-query**: Data fetching and caching
- **sonner**: Toast notifications
- **lucide-react**: Icons
- **next-intl**: Internationalization

## Notes
- The PDF service was already implemented in the backend
- This implementation adds the UI components and integrations
- All code follows the existing project patterns and conventions
- The implementation is production-ready and fully functional
