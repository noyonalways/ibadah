# AI Module Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Ibadah Platform                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐                              ┌──────────────┐     │
│  │ Client App   │                              │  Admin App   │     │
│  │ (Next.js)    │                              │  (Next.js)   │     │
│  └──────┬───────┘                              └──────┬───────┘     │
│         │                                             │              │
│         │ HTTP/SSE                          HTTP/SSE  │              │
│         │                                             │              │
│         └─────────────────┬───────────────────────────┘              │
│                           │                                          │
│                           ▼                                          │
│              ┌────────────────────────┐                              │
│              │   Express Server       │                              │
│              │   (Node.js)            │                              │
│              └────────────┬───────────┘                              │
│                           │                                          │
│         ┌─────────────────┼─────────────────┐                       │
│         │                 │                 │                        │
│         ▼                 ▼                 ▼                        │
│  ┌─────────────┐   ┌─────────────┐  ┌─────────────┐                │
│  │ Client AI   │   │  Admin AI   │  │ PDF Service │                │
│  │ Endpoints   │   │  Endpoints  │  │             │                │
│  └──────┬──────┘   └──────┬──────┘  └──────┬──────┘                │
│         │                 │                 │                        │
│         └─────────────────┼─────────────────┘                       │
│                           │                                          │
│                           ▼                                          │
│              ┌────────────────────────┐                              │
│              │   AI Provider Factory  │                              │
│              └────────────┬───────────┘                              │
│                           │                                          │
│         ┌─────────────────┼─────────────────┬──────────────┐        │
│         │                 │                 │              │        │
│         ▼                 ▼                 ▼              ▼        │
│  ┌──────────┐      ┌──────────┐     ┌──────────┐   ┌──────────┐   │
│  │ OpenAI   │      │Anthropic │     │  Gemini  │   │OpenRouter│   │
│  │ Provider │      │ Provider │     │ Provider │   │ Provider │   │
│  └────┬─────┘      └────┬─────┘     └────┬─────┘   └────┬─────┘   │
│       │                 │                 │              │          │
└───────┼─────────────────┼─────────────────┼──────────────┼──────────┘
        │                 │                 │              │
        │                 │                 │              │
        ▼                 ▼                 ▼              ▼
   ┌─────────┐       ┌─────────┐      ┌─────────┐   ┌─────────┐
   │ OpenAI  │       │Anthropic│      │ Google  │   │OpenRouter│
   │   API   │       │   API   │      │   API   │   │   API   │
   └─────────┘       └─────────┘      └─────────┘   └─────────┘
```

## Request Flow

### Chat Request Flow

```
Client/Admin App
      │
      │ 1. User sends message
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/v1/ai/client/chat  OR  /api/v1/ai/admin/chat     │
│                                                              │
│ Headers:                                                     │
│   Authorization: Bearer <token>                             │
│   Content-Type: application/json                            │
│                                                              │
│ Body:                                                        │
│   {                                                          │
│     "messages": [{"role": "user", "content": "..."}],       │
│     "surface": "dashboard",  // client only                 │
│     "context": "..."         // optional                    │
│   }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 2. Validate request
                       │
                       ▼
              ┌────────────────┐
              │ AI Controller  │
              └────────┬───────┘
                       │
                       │ 3. Get AI config
                       │
                       ▼
              ┌────────────────┐
              │  AI Config     │
              │  - Provider    │
              │  - Model       │
              │  - API Key     │
              └────────┬───────┘
                       │
                       │ 4. Create provider
                       │
                       ▼
              ┌────────────────┐
              │Provider Factory│
              └────────┬───────┘
                       │
                       │ 5. Select provider
                       │
                       ▼
         ┌─────────────────────────┐
         │  OpenAI / Anthropic /   │
         │  Gemini / OpenRouter    │
         └────────┬────────────────┘
                  │
                  │ 6. Stream tokens
                  │
                  ▼
         ┌─────────────────────────┐
         │   External AI API       │
         └────────┬────────────────┘
                  │
                  │ 7. Return stream
                  │
                  ▼
         ┌─────────────────────────┐
         │  SSE Stream to Client   │
         │                         │
         │  data: {"type":"chunk", │
         │         "content":"Hi"} │
         │  data: {"type":"chunk", │
         │         "content":" th"}│
         │  data: {"type":"done"}  │
         └─────────────────────────┘
```

### PDF Generation Flow

```
Client/Admin App
      │
      │ 1. Request PDF
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/v1/ai/client/pdf  OR  /api/v1/ai/admin/pdf       │
│                                                              │
│ Headers:                                                     │
│   Authorization: Bearer <token>                             │
│   Content-Type: application/json                            │
│                                                              │
│ Body:                                                        │
│   {                                                          │
│     "startDate": "2026-05-01T00:00:00Z",                    │
│     "endDate": "2026-05-31T23:59:59Z",                      │
│     "reportType": "analytics"  // admin only                │
│   }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 2. Validate request
                       │
                       ▼
              ┌────────────────┐
              │ AI Controller  │
              └────────┬───────┘
                       │
                       │ 3. Call PDF service
                       │
                       ▼
              ┌────────────────┐
              │  PDF Service   │
              └────────┬───────┘
                       │
                       │ 4. Fetch data
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐
    │ Stats  │   │ User   │   │Analytics│
    │Service │   │Service │   │ Service │
    └────┬───┘   └────┬───┘   └────┬───┘
         │            │            │
         └────────────┼────────────┘
                      │
                      │ 5. Query MongoDB
                      │
                      ▼
              ┌────────────────┐
              │    MongoDB     │
              └────────┬───────┘
                       │
                       │ 6. Return data
                       │
                       ▼
              ┌────────────────┐
              │  PDF Service   │
              │  - Create doc  │
              │  - Add content │
              │  - Style it    │
              └────────┬───────┘
                       │
                       │ 7. Generate PDF
                       │
                       ▼
              ┌────────────────┐
              │   PDF Buffer   │
              └────────┬───────┘
                       │
                       │ 8. Send to client
                       │
                       ▼
         ┌─────────────────────────┐
         │  application/pdf        │
         │  Content-Disposition:   │
         │  attachment; filename=  │
         │  "report.pdf"           │
         └─────────────────────────┘
```

## Module Structure

```
server/src/modules/ai/
│
├── ai.types.ts              # TypeScript interfaces
│   ├── ProviderName
│   ├── SystemSurface
│   ├── ChatMessage
│   ├── AiConfig
│   ├── StreamChatOptions
│   ├── AiProvider
│   ├── PdfGenerationOptions
│   └── AdminPdfOptions
│
├── ai.config.ts             # Configuration management
│   ├── getAiConfig()
│   └── AiConfigError
│
├── ai.validation.ts         # Zod schemas
│   ├── chatMessageSchema
│   ├── clientChatSchema
│   ├── adminChatSchema
│   ├── userPdfSchema
│   └── adminPdfSchema
│
├── ai.controller.ts         # Request handlers
│   ├── clientChat()
│   ├── adminChat()
│   ├── generateUserPdf()
│   └── generateAdminPdf()
│
├── ai.routes.ts             # Route definitions
│   ├── clientAiRouter
│   │   ├── POST /chat
│   │   └── POST /pdf
│   └── adminAiRouter
│       ├── POST /chat
│       └── POST /pdf
│
├── system-prompts.ts        # AI personas
│   ├── CLIENT_LANDING_PROMPT
│   ├── CLIENT_DASHBOARD_PROMPT
│   ├── ADMIN_PROMPT
│   └── getSystemPrompt()
│
├── pdf.service.ts           # PDF generation
│   ├── generateUserReport()
│   ├── generateAdminReport()
│   ├── addReportHeader()
│   ├── addReportFooter()
│   ├── addAnalyticsSection()
│   ├── addUsersSection()
│   ├── addModerationSection()
│   └── addAuditSection()
│
├── providers/               # AI provider implementations
│   ├── index.ts            # Provider factory
│   ├── openai.provider.ts
│   ├── anthropic.provider.ts
│   ├── gemini.provider.ts
│   └── openrouter.provider.ts
│
└── docs/
    ├── README.md           # Module documentation
    ├── INTEGRATION.md      # Integration guide
    ├── QUICKSTART.md       # Quick start guide
    └── ARCHITECTURE.md     # This file
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Authentication Layer                      │
│  ┌──────────────┐                        ┌──────────────┐       │
│  │ requireAuth  │───────────────────────▶│ requireAdmin │       │
│  │ middleware   │                        │  middleware  │       │
│  └──────┬───────┘                        └──────┬───────┘       │
│         │                                       │                │
│         │ Validates JWT                         │ Checks role    │
│         │ Attaches user                         │                │
│         │                                       │                │
└─────────┼───────────────────────────────────────┼────────────────┘
          │                                       │
          ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Route Layer                              │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │ Client Routes    │              │  Admin Routes    │         │
│  │ /ai/client/*     │              │  /ai/admin/*     │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Controller Layer                            │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │ Client Methods   │              │  Admin Methods   │         │
│  │ - clientChat()   │              │  - adminChat()   │         │
│  │ - generateUserPdf│              │  - generateAdmin │         │
│  │                  │              │    Pdf()         │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            ├──────────────┬───────────────────┤
            │              │                   │
            ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ AI Config    │  │ PDF Service  │  │ Providers    │          │
│  │ Service      │  │              │  │ Factory      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Environment  │  │ MongoDB      │  │ External     │          │
│  │ Variables    │  │ Collections  │  │ AI APIs      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
│                                                                   │
│  Layer 1: Network Security                                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - HTTPS/TLS encryption                                 │     │
│  │ - CORS configuration                                   │     │
│  │ - Rate limiting (300 req/15min per IP)                │     │
│  │ - Helmet.js security headers                           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 2: Authentication                                         │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - JWT bearer token validation                          │     │
│  │ - Token expiration checks                              │     │
│  │ - User suspension checks                               │     │
│  │ - Session management                                   │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 3: Authorization                                          │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - Role-based access control (RBAC)                     │     │
│  │ - Admin privilege verification                         │     │
│  │ - Resource ownership checks                            │     │
│  │ - Endpoint-level permissions                           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 4: Input Validation                                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - Zod schema validation                                │     │
│  │ - Type checking                                        │     │
│  │ - Length limits (messages, context)                   │     │
│  │ - Sanitization                                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 5: API Key Protection                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - Server-side only storage                             │     │
│  │ - Environment variable isolation                       │     │
│  │ - Never exposed to clients                             │     │
│  │ - Separate keys per provider                           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 6: System Prompt Protection                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ - Server-controlled prompts                            │     │
│  │ - Client cannot inject system messages                 │     │
│  │ - Separate prompts for client/admin                    │     │
│  │ - Prompt versioning                                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Stateless design allows multiple server instances
- Load balancer distributes requests
- Shared MongoDB for data consistency
- Session-less JWT authentication

### Vertical Scaling
- Streaming responses reduce memory usage
- Async/await for non-blocking I/O
- Connection pooling for MongoDB
- Efficient PDF generation

### Caching Strategy
- System prompts cached in memory
- AI config cached per request
- User data cached with TTL
- PDF templates reusable

### Performance Optimization
- Parallel data fetching (Promise.all)
- Streaming responses (SSE)
- Efficient MongoDB queries
- Minimal dependencies

## Error Handling

```
Request
   │
   ▼
┌──────────────────┐
│ Validation Error │──▶ 400 Bad Request
└──────────────────┘    { success: false, message: "..." }
   │
   ▼
┌──────────────────┐
│  Auth Error      │──▶ 401 Unauthorized
└──────────────────┘    { success: false, message: "..." }
   │
   ▼
┌──────────────────┐
│ Permission Error │──▶ 403 Forbidden
└──────────────────┘    { success: false, message: "..." }
   │
   ▼
┌──────────────────┐
│ Not Found Error  │──▶ 404 Not Found
└──────────────────┘    { success: false, message: "..." }
   │
   ▼
┌──────────────────┐
│ AI Config Error  │──▶ 503 Service Unavailable
└──────────────────┘    { success: false, message: "..." }
   │
   ▼
┌──────────────────┐
│ Stream Error     │──▶ SSE error event
└──────────────────┘    data: { type: "error", message: "..." }
   │
   ▼
┌──────────────────┐
│ Server Error     │──▶ 500 Internal Server Error
└──────────────────┘    { success: false, message: "..." }
```

## Monitoring & Logging

### Metrics to Track
- Request count per endpoint
- Response time (p50, p95, p99)
- Error rate by type
- AI provider usage
- Token consumption
- PDF generation time
- Active streaming connections

### Logging Strategy
- Request/response logging (Morgan)
- Error logging (Winston)
- AI provider calls
- PDF generation events
- Authentication failures
- Rate limit hits

## Future Enhancements

### Planned Features
- [ ] Conversation history persistence
- [ ] Multi-turn context management
- [ ] Custom AI personas per user
- [ ] A/B testing different prompts
- [ ] Cost tracking per user
- [ ] Usage analytics dashboard
- [ ] Webhook notifications
- [ ] Batch PDF generation
- [ ] PDF templates customization
- [ ] Multi-language support for PDFs

### Scalability Improvements
- [ ] Redis caching layer
- [ ] Message queue for PDF generation
- [ ] CDN for PDF delivery
- [ ] Database read replicas
- [ ] Microservices architecture
- [ ] Kubernetes deployment

---

**Last Updated**: June 1, 2026
**Version**: 1.0.0
**Maintainer**: Development Team
