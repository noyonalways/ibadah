# AI Module

This module provides AI assistant functionality and PDF report generation for both client and admin users.

## Features

### 1. Client AI Assistant
- **Endpoint**: `POST /api/v1/ai/client/chat`
- **Authentication**: Required (regular users)
- **Purpose**: Help users with worship tracking, Islamic guidance, and app usage
- **Personas**: 
  - `landing`: For unauthenticated landing page visitors
  - `dashboard`: For authenticated users in their dashboard

### 2. Admin AI Assistant
- **Endpoint**: `POST /api/v1/ai/admin/chat`
- **Authentication**: Required (admin only)
- **Purpose**: Help admins analyze platform data, understand metrics, and make decisions
- **Features**:
  - Platform analytics insights
  - User behavior analysis
  - Moderation assistance
  - System health monitoring

### 3. Client PDF Reports
- **Endpoint**: `POST /api/v1/ai/client/pdf`
- **Authentication**: Required (regular users)
- **Purpose**: Generate personalized worship progress reports
- **Includes**:
  - Overall statistics (points, streaks)
  - Salah (prayer) completion rates
  - Quran reading progress
  - Dhikr (remembrance) counts
  - Habit tracking completion

### 4. Admin PDF Reports
- **Endpoint**: `POST /api/v1/ai/admin/pdf`
- **Authentication**: Required (admin only)
- **Purpose**: Generate platform analytics and management reports
- **Report Types**:
  - `analytics`: Platform-wide metrics and engagement
  - `users`: User statistics and demographics
  - `moderation`: Content moderation summary
  - `audit`: Audit log summary

## Configuration

Add these environment variables to your `.env` file:

```env
# AI Provider (openrouter, openai, anthropic, gemini)
AI_PROVIDER=openrouter

# Model (provider-specific)
AI_MODEL=openai/gpt-4o-mini

# API Keys (set the one matching your provider)
AI_API_KEY=your-api-key-here
OPENROUTER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# Optional settings
AI_MAX_TOKENS=1024
AI_TEMPERATURE=0.4
AI_SITE_URL=https://your-site.com
AI_SITE_NAME=Ibadah
```

## API Examples

### Client Chat

```bash
curl -X POST http://localhost:5000/api/v1/ai/client/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How can I improve my prayer consistency?"}
    ],
    "surface": "dashboard"
  }'
```

### Admin Chat

```bash
curl -X POST http://localhost:5000/api/v1/ai/admin/chat \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are the top engagement metrics this week?"}
    ],
    "context": "Current DAU: 1250, WAU: 3400"
  }'
```

### Generate User PDF

```bash
curl -X POST http://localhost:5000/api/v1/ai/client/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-05-31T23:59:59Z",
    "includeCharts": true,
    "locale": "en"
  }' \
  --output report.pdf
```

### Generate Admin PDF

```bash
curl -X POST http://localhost:5000/api/v1/ai/admin/pdf \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "analytics",
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-05-31T23:59:59Z"
  }' \
  --output admin-report.pdf
```

## Architecture

```
ai/
├── ai.types.ts           # TypeScript interfaces
├── ai.config.ts          # Configuration management
├── ai.validation.ts      # Zod schemas
├── ai.controller.ts      # Request handlers
├── ai.routes.ts          # Route definitions
├── system-prompts.ts     # AI personas
├── pdf.service.ts        # PDF generation
└── providers/            # AI provider implementations
    ├── index.ts          # Provider factory
    ├── openai.provider.ts
    ├── anthropic.provider.ts
    ├── gemini.provider.ts
    └── openrouter.provider.ts
```

## Supported AI Providers

1. **OpenRouter** (default)
   - Access to multiple models through one API
   - Cost-effective
   - Model: `openai/gpt-4o-mini`

2. **OpenAI**
   - Direct OpenAI API access
   - Model: `gpt-4o-mini`

3. **Anthropic**
   - Claude models
   - Model: `claude-3-5-haiku-latest`

4. **Google Gemini**
   - Google's AI models
   - Model: `gemini-1.5-flash`

## Security

- All endpoints require authentication
- Admin endpoints require admin role
- System prompts are server-controlled (clients cannot inject)
- API keys are never exposed to clients
- Streaming responses support client disconnect handling

## PDF Styling

PDFs are generated with:
- Professional A4 layout
- Brand colors (blue header: #2563eb)
- Clear typography and spacing
- Consistent margins (50pt all sides)
- Automatic page breaks
- Footer with generation timestamp
