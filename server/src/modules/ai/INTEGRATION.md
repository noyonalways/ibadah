# AI Module Integration Guide

This guide explains how to integrate the server-side AI functionality into the client and admin Next.js applications.

## Overview

The AI functionality has been moved from the Next.js apps to the Express server. This provides:
- Centralized AI configuration
- Better security (API keys never exposed to clients)
- Consistent behavior across client and admin
- Easier maintenance and updates

## Server Endpoints

### Client Endpoints (Regular Users)

#### 1. Chat Endpoint
```
POST /api/v1/ai/client/chat
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "How can I improve my prayer consistency?"}
  ],
  "surface": "dashboard",  // or "landing"
  "context": "Optional context string"
}

Response: Server-Sent Events (SSE) stream
```

#### 2. PDF Generation
```
POST /api/v1/ai/client/pdf
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "startDate": "2026-05-01T00:00:00Z",
  "endDate": "2026-05-31T23:59:59Z",
  "includeCharts": true,
  "locale": "en"
}

Response: application/pdf
```

### Admin Endpoints (Admin Users Only)

#### 1. Chat Endpoint
```
POST /api/v1/ai/admin/chat
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "What are the top engagement metrics?"}
  ],
  "context": "Optional operator context"
}

Response: Server-Sent Events (SSE) stream
```

#### 2. PDF Generation
```
POST /api/v1/ai/admin/pdf
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reportType": "analytics",  // or "users", "moderation", "audit"
  "startDate": "2026-05-01T00:00:00Z",
  "endDate": "2026-05-31T23:59:59Z",
  "filters": {}
}

Response: application/pdf
```

## Client App Integration

### 1. Update API Client

Create or update `client/src/lib/ai-api.ts`:

```typescript
import { getAuthToken } from './auth-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function* streamClientChat(
  messages: ChatMessage[],
  surface: 'landing' | 'dashboard' = 'dashboard',
  context?: string
): AsyncGenerator<string> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/ai/client/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ messages, surface, context }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk') {
          yield data.content;
        } else if (data.type === 'error') {
          throw new Error(data.message);
        }
      }
    }
  }
}

export async function downloadUserReport(
  startDate: Date,
  endDate: Date,
  options?: { includeCharts?: boolean; locale?: string }
): Promise<Blob> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE}/ai/client/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...options,
    }),
  });

  if (!response.ok) {
    throw new Error(`PDF generation failed: ${response.statusText}`);
  }

  return response.blob();
}
```

### 2. Update AI Components

Update `client/src/components/ai/ai-widget.tsx` to use the new API:

```typescript
import { streamClientChat } from '@/lib/ai-api';

// In your chat handler:
const handleSend = async (message: string) => {
  const newMessages = [...messages, { role: 'user' as const, content: message }];
  setMessages(newMessages);

  let assistantMessage = '';
  setIsLoading(true);

  try {
    for await (const chunk of streamClientChat(newMessages, 'dashboard')) {
      assistantMessage += chunk;
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
    }
  } catch (error) {
    console.error('Chat error:', error);
    // Handle error
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Add PDF Download Button

```typescript
import { downloadUserReport } from '@/lib/ai-api';

const handleDownloadReport = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const blob = await downloadUserReport(startDate, endDate, {
      includeCharts: true,
      locale: 'en',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ibadah-report-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download error:', error);
  }
};
```

## Admin App Integration

### 1. Update API Client

Create or update `admin/src/lib/ai-api.ts`:

```typescript
import { getAuthToken } from './auth-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function* streamAdminChat(
  messages: ChatMessage[],
  context?: string
): AsyncGenerator<string> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE}/ai/admin/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk') {
          yield data.content;
        } else if (data.type === 'error') {
          throw new Error(data.message);
        }
      }
    }
  }
}

export async function downloadAdminReport(
  reportType: 'analytics' | 'users' | 'moderation' | 'audit',
  startDate: Date,
  endDate: Date,
  filters?: Record<string, unknown>
): Promise<Blob> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE}/ai/admin/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reportType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      filters,
    }),
  });

  if (!response.ok) {
    throw new Error(`PDF generation failed: ${response.statusText}`);
  }

  return response.blob();
}
```

### 2. Update Admin AI Components

Update `admin/src/components/ai/admin-ai-widget.tsx`:

```typescript
import { streamAdminChat } from '@/lib/ai-api';

// Similar to client implementation but using streamAdminChat
```

### 3. Add Admin PDF Download

```typescript
import { downloadAdminReport } from '@/lib/ai-api';

const handleDownloadReport = async (reportType: 'analytics' | 'users' | 'moderation' | 'audit') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const blob = await downloadAdminReport(reportType, startDate, endDate);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-${reportType}-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download error:', error);
  }
};
```

## Environment Variables

### Server (.env)
```env
# AI Configuration
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
AI_API_KEY=your-api-key-here
AI_MAX_TOKENS=1024
AI_TEMPERATURE=0.4
```

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Admin (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Migration Checklist

### Client App
- [ ] Remove `client/src/app/api/ai/chat/route.ts`
- [ ] Remove `client/src/lib/ai/` directory (config, providers, etc.)
- [ ] Create `client/src/lib/ai-api.ts` with new API client
- [ ] Update AI components to use new API
- [ ] Add PDF download functionality
- [ ] Test chat streaming
- [ ] Test PDF generation
- [ ] Remove AI-related environment variables from client

### Admin App
- [ ] Remove `admin/src/app/api/ai/chat/route.ts`
- [ ] Remove `admin/src/lib/ai/` directory (config, providers, etc.)
- [ ] Create `admin/src/lib/ai-api.ts` with new API client
- [ ] Update AI components to use new API
- [ ] Add PDF download functionality
- [ ] Test chat streaming
- [ ] Test PDF generation
- [ ] Remove AI-related environment variables from admin

### Server
- [x] Install dependencies (`openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `pdfkit`)
- [x] Create AI module structure
- [x] Implement providers (OpenAI, Anthropic, Gemini, OpenRouter)
- [x] Create chat endpoints (client and admin)
- [x] Create PDF generation endpoints
- [x] Add routes to main router
- [x] Update .env.example with AI configuration
- [ ] Add AI configuration to production .env
- [ ] Test all endpoints
- [ ] Deploy

## Testing

### Test Chat Endpoints

```bash
# Client chat
curl -X POST http://localhost:5000/api/v1/ai/client/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"surface":"dashboard"}'

# Admin chat
curl -X POST http://localhost:5000/api/v1/ai/admin/chat \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Show me platform stats"}]}'
```

### Test PDF Endpoints

```bash
# Client PDF
curl -X POST http://localhost:5000/api/v1/ai/client/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-31T23:59:59Z"}' \
  --output user-report.pdf

# Admin PDF
curl -X POST http://localhost:5000/api/v1/ai/admin/pdf \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportType":"analytics","startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-31T23:59:59Z"}' \
  --output admin-report.pdf
```

## Benefits of Server-Side AI

1. **Security**: API keys never exposed to clients
2. **Consistency**: Same AI behavior across all apps
3. **Cost Control**: Centralized usage monitoring
4. **Flexibility**: Easy to switch providers or models
5. **Performance**: Server-side streaming is more reliable
6. **Maintenance**: Single codebase for AI logic
