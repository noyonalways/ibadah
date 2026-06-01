# AI Module Quick Start Guide

## 1. Configure AI Provider (5 minutes)

### Option A: OpenRouter (Recommended for Development)
```env
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=your-key-here
```

Get your key at: https://openrouter.ai/keys

### Option B: OpenAI
```env
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your-key-here
```

Get your key at: https://platform.openai.com/api-keys

### Option C: Anthropic (Claude)
```env
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-haiku-latest
ANTHROPIC_API_KEY=your-key-here
```

Get your key at: https://console.anthropic.com/

### Option D: Google Gemini
```env
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=your-key-here
```

Get your key at: https://makersuite.google.com/app/apikey

## 2. Test the Server (2 minutes)

### Start the server
```bash
cd server
pnpm dev
```

### Test client chat (in another terminal)
```bash
# Get a user token first (login via your client app or use existing token)
export TOKEN="your-user-token-here"

curl -X POST http://localhost:5000/api/v1/ai/client/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello! Can you help me?"}
    ],
    "surface": "dashboard"
  }'
```

### Test admin chat
```bash
# Get an admin token first
export ADMIN_TOKEN="your-admin-token-here"

curl -X POST http://localhost:5000/api/v1/ai/admin/chat \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me platform overview"}
    ]
  }'
```

### Test PDF generation
```bash
# Client PDF
curl -X POST http://localhost:5000/api/v1/ai/client/pdf \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-05-31T23:59:59Z",
    "includeCharts": true,
    "locale": "en"
  }' \
  --output test-report.pdf

# Open the PDF
start test-report.pdf  # Windows
# open test-report.pdf   # macOS
# xdg-open test-report.pdf  # Linux
```

## 3. Integrate into Client App (15 minutes)

### Step 1: Create API client
Create `client/src/lib/ai-api.ts`:

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

### Step 2: Update AI widget
Update your existing AI widget component:

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

### Step 3: Add PDF download button
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

// In your component JSX:
<button onClick={handleDownloadReport}>
  Download Report
</button>
```

### Step 4: Update environment
Add to `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Step 5: Clean up old code
```bash
# Remove old AI implementation
rm -rf client/src/app/api/ai
rm -rf client/src/lib/ai
```

## 4. Integrate into Admin App (15 minutes)

Follow the same steps as client app, but use:
- `streamAdminChat()` instead of `streamClientChat()`
- `downloadAdminReport()` instead of `downloadUserReport()`
- Admin endpoints: `/api/v1/ai/admin/chat` and `/api/v1/ai/admin/pdf`

See `INTEGRATION.md` for detailed admin integration code.

## 5. Deploy to Production

### Update production .env
```env
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-v1-xxxxx
AI_MAX_TOKENS=1024
AI_TEMPERATURE=0.4
```

### Deploy server
```bash
cd server
pnpm build
pnpm start
```

### Update client/admin env
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## Troubleshooting

### "AI is not configured on this server"
- Check that AI_PROVIDER is set in .env
- Check that the corresponding API key is set (e.g., OPENROUTER_API_KEY)
- Restart the server after changing .env

### "Invalid or expired token"
- Make sure you're sending a valid JWT token
- Check that the token hasn't expired
- Verify the Authorization header format: `Bearer <token>`

### "Admin privileges required"
- This endpoint requires admin role
- Check that your user has role: 'admin' in the database
- Use an admin token, not a regular user token

### PDF generation fails
- Check that the user has data in the date range
- Verify the date format is ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- Check server logs for specific errors

### Streaming doesn't work
- Make sure you're using Server-Sent Events (SSE) properly
- Check that the client is reading the stream correctly
- Verify the response Content-Type is 'text/event-stream'

## Cost Optimization

### OpenRouter (Recommended)
- gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Very cost-effective for development and production

### OpenAI Direct
- gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Same pricing as OpenRouter but direct access

### Anthropic
- claude-3-5-haiku: ~$0.80 per 1M input tokens, ~$4.00 per 1M output tokens
- More expensive but higher quality

### Google Gemini
- gemini-1.5-flash: Free tier available, then ~$0.075 per 1M tokens
- Most cost-effective option

## Support

- **Module Documentation**: `README.md`
- **Integration Guide**: `INTEGRATION.md`
- **Implementation Summary**: `../../AI_IMPLEMENTATION_SUMMARY.md`

## Next Steps

1. ✅ Configure AI provider
2. ✅ Test server endpoints
3. ⏳ Integrate into client app
4. ⏳ Integrate into admin app
5. ⏳ Deploy to production
6. ⏳ Monitor usage and costs

Happy coding! 🚀
