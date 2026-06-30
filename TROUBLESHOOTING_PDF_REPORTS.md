# Troubleshooting PDF Report Implementation

## Errors Fixed

### 1. Missing DropdownMenuSubContent Export (Admin)
**Error:** `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined`

**Fix Applied:** Added the missing `DropdownMenuSubContent` export to `admin/src/components/ui/dropdown-menu.tsx`

### 2. Missing dropdown-menu Component (Client)
**Error:** `Module not found: Can't resolve '@/components/ui/dropdown-menu'`

**Fix Applied:** Created the complete dropdown-menu component at `client/src/components/ui/dropdown-menu.tsx`

## Steps to Resolve Build Errors

### 1. Clear Build Cache
Run these commands in both `client` and `admin` directories:

```bash
# For Client
cd client
rm -rf .next
rm -rf node_modules/.cache
pnpm install
pnpm run dev

# For Admin
cd admin
rm -rf .next
rm -rf node_modules/.cache
pnpm install
pnpm run dev
```

### 2. Verify All Files Are Created

**Client Files:**
- ✅ `client/src/components/ui/dropdown-menu.tsx` (CREATED)
- ✅ `client/src/lib/report-api.ts` (CREATED)
- ✅ `client/src/components/dashboard/report-download.tsx` (CREATED)
- ✅ `client/src/app/[locale]/(dashboard)/dashboard/page.tsx` (UPDATED)

**Admin Files:**
- ✅ `admin/src/components/ui/dropdown-menu.tsx` (UPDATED - added DropdownMenuSubContent)
- ✅ `admin/src/lib/report-api.ts` (CREATED)
- ✅ `admin/src/components/admin/report-download.tsx` (CREATED)
- ✅ `admin/src/app/(panel)/dashboard/page.tsx` (UPDATED)
- ✅ `admin/src/app/(panel)/analytics/page.tsx` (UPDATED)

**Translation Files:**
- ✅ `client/messages/en.json` (UPDATED)
- ✅ `client/messages/bn.json` (UPDATED)
- ✅ `client/messages/ar.json` (UPDATED)
- ✅ `admin/messages/en.json` (UPDATED)
- ✅ `admin/messages/bn.json` (UPDATED)
- ✅ `admin/messages/ar.json` (UPDATED)

### 3. Verify Dependencies

Both client and admin should have these dependencies (already installed):
```json
{
  "@radix-ui/react-dropdown-menu": "^2.1.4",
  "@tanstack/react-query": "^5.x.x",
  "sonner": "^1.x.x",
  "lucide-react": "^0.x.x"
}
```

### 4. Check Import Paths

Make sure all imports use the correct paths:

**Client:**
```typescript
import { downloadUserReport, getDateRangeForPeriod } from '@/lib/report/report-api';
import { DropdownMenu, DropdownMenuContent, ... } from '@/components/ui/dropdown-menu';
```

**Admin:**
```typescript
import { downloadAdminReport, getDateRangeForPeriod } from '@/lib/report/report-api';
import { DropdownMenu, DropdownMenuContent, ... } from '@/components/ui/dropdown-menu';
```

## Testing After Fix

### Client Testing:
1. Navigate to `/dashboard`
2. Look for "Download Report" button below the hero section
3. Click and select a period (Daily/Weekly/Monthly)
4. PDF should download automatically

### Admin Testing:
1. Navigate to `/dashboard` or `/analytics`
2. Look for "Download Report" button in top-right corner
3. Click and select report type, then period
4. PDF should download automatically

## Common Issues

### Issue: "Cannot find module" errors
**Solution:** Run `pnpm install` in the affected directory

### Issue: Build cache errors
**Solution:** Delete `.next` folder and restart dev server

### Issue: TypeScript errors
**Solution:** Restart TypeScript server in your IDE

### Issue: Component not rendering
**Solution:** Check browser console for detailed error messages

## Verification Checklist

- [ ] Client dev server starts without errors
- [ ] Admin dev server starts without errors
- [ ] No TypeScript errors in IDE
- [ ] Client dashboard page loads
- [ ] Admin dashboard page loads
- [ ] Admin analytics page loads
- [ ] Report download button visible on client
- [ ] Report download button visible on admin
- [ ] Dropdown menus open correctly
- [ ] PDF downloads work

## If Issues Persist

1. Check the browser console for detailed error messages
2. Verify all file paths are correct
3. Ensure no typos in component names
4. Check that all exports are named correctly
5. Restart both dev servers
6. Clear browser cache

## Backend Requirements

The backend PDF service should already be running. Verify:
- Server is running on the correct port
- Environment variables are set (NEXT_PUBLIC_API_URL)
- PDF endpoints are accessible:
  - `POST /api/v1/ai/client/pdf`
  - `POST /api/v1/ai/admin/pdf`

## Environment Variables

**Client (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Admin (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Server (.env):**
```
# Should already be configured
PORT=3000
```
