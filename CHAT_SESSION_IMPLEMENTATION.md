# Chat Session History Implementation

## Overview
This document describes the implementation of chat session history storage for the AI assistant. The system uses **two separate MongoDB collections** following best practices for scalability and performance.

## Database Architecture

### Collections

#### 1. `chat_sessions` Collection
Stores session metadata without embedded messages.

**Schema:**
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  title: String (max 200 chars),
  surface: 'landing' | 'dashboard' | 'admin',
  messageCount: Number (default: 0),
  lastMessageAt: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (single field index)
- `lastMessageAt` (single field index)
- `{ userId: 1, lastMessageAt: -1 }` (compound index for efficient queries)

#### 2. `chat_messages` Collection
Stores individual messages separately for better scalability.

**Schema:**
```typescript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: ChatSession, indexed),
  role: 'system' | 'user' | 'assistant',
  content: String,
  createdAt: Date
}
```

**Indexes:**
- `sessionId` (single field index)
- `{ sessionId: 1, createdAt: 1 }` (compound index for efficient message retrieval)

### Benefits of Separate Collections

1. **Scalability**: Sessions with thousands of messages don't bloat the session document
2. **Performance**: Faster queries when listing sessions (no need to load all messages)
3. **Flexibility**: Easy to implement pagination, pruning, and message-level operations
4. **MongoDB Best Practice**: Avoids 16MB document size limit
5. **Efficient Updates**: Adding messages doesn't require rewriting entire session document

## Backend API

### Base URL
- Client: `/api/v1/ai/client/*`
- Admin: `/api/v1/ai/admin/*`
- Sessions: `/api/v1/ai/sessions/*` (shared)

### Endpoints

#### Session Management

**Create Session**
```
POST /api/v1/ai/sessions
Authorization: Bearer <token>

Body:
{
  "surface": "dashboard" | "landing" | "admin",
  "title": "Optional title" // defaults to "New Chat"
}

Response:
{
  "success": true,
  "data": {
    "id": "session_id",
    "title": "New Chat",
    "surface": "dashboard",
    "lastMessageAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**List Sessions**
```
GET /api/v1/ai/sessions?surface=dashboard&limit=50&skip=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_id",
        "title": "How to improve Salah score?",
        "surface": "dashboard",
        "messageCount": 12,
        "lastMessageAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

**Get Session with Messages**
```
GET /api/v1/ai/sessions/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "session_id",
    "title": "How to improve Salah score?",
    "surface": "dashboard",
    "messageCount": 12,
    "messages": [
      {
        "id": "message_id",
        "role": "user",
        "content": "How can I improve my Salah score?",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "message_id",
        "role": "assistant",
        "content": "Here are some tips...",
        "createdAt": "2024-01-01T00:00:01.000Z"
      }
    ],
    "lastMessageAt": "2024-01-01T00:00:01.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:01.000Z"
  }
}
```

**Update Session Title**
```
PATCH /api/v1/ai/sessions/:id
Authorization: Bearer <token>

Body:
{
  "title": "New title"
}

Response:
{
  "success": true,
  "data": {
    "id": "session_id",
    "title": "New title"
  }
}
```

**Delete Session**
```
DELETE /api/v1/ai/sessions/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Add Message to Session**
```
POST /api/v1/ai/sessions/:id/messages
Authorization: Bearer <token>

Body:
{
  "role": "user" | "assistant",
  "content": "Message content"
}

Response:
{
  "success": true,
  "data": {
    "id": "message_id",
    "sessionId": "session_id",
    "role": "user",
    "content": "Message content",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Backend Files

### Core Files
- `server/src/modules/ai/chat-session.interface.ts` - TypeScript interfaces
- `server/src/modules/ai/chat-session.model.ts` - Session Mongoose model
- `server/src/modules/ai/chat-message.model.ts` - Message Mongoose model
- `server/src/modules/ai/chat-session.service.ts` - Business logic
- `server/src/modules/ai/chat-session.controller.ts` - HTTP endpoints
- `server/src/modules/ai/ai.routes.ts` - Route definitions
- `server/src/routes/index.ts` - Route registration

### Service Methods

**ChatSessionService:**
- `createSession(userId, surface, title)` - Create new session
- `addMessage(sessionId, role, content)` - Add single message
- `addMessages(sessionId, messages[])` - Batch add messages
- `getUserSessions(userId, options)` - List user sessions
- `getSession(sessionId, userId)` - Get session metadata
- `getSessionMessages(sessionId, options)` - Get messages for session
- `getSessionWithMessages(sessionId, userId, options)` - Combined query
- `updateSessionTitle(sessionId, title, userId)` - Update title
- `deleteSession(sessionId, userId)` - Delete session and messages
- `deleteUserSessions(userId)` - Delete all user sessions
- `getUserSessionCount(userId, surface)` - Count sessions
- `getMostRecentSession(userId, surface)` - Get latest session
- `pruneSessionMessages(sessionId, keepCount)` - Delete old messages

## Frontend Integration (To Be Implemented)

### Client Files (To Create)
- `client/src/lib/session-api.ts` - API functions
- `client/src/components/ai/chat-history.tsx` - Session list
- `client/src/components/ai/chat-session-item.tsx` - Single session item
- `client/src/hooks/use-chat-sessions.ts` - React hook for sessions

### Admin Files (To Create)
- `admin/src/lib/session-api.ts` - API functions
- `admin/src/components/ai/chat-history.tsx` - Session list
- `admin/src/components/ai/chat-session-item.tsx` - Single session item
- `admin/src/hooks/use-chat-sessions.ts` - React hook for sessions

### Integration Points

1. **Auto-save during chat**: Update `use-ai-chat` hook to save messages
2. **Session selector**: Add UI to switch between sessions
3. **History panel**: Show list of past sessions
4. **Session management**: Rename, delete, create new sessions

## Features

### Implemented (Backend)
- ✅ Separate collections for sessions and messages
- ✅ Create, read, update, delete sessions
- ✅ Add messages to sessions
- ✅ List sessions with pagination
- ✅ Auto-generate titles from first message
- ✅ Efficient indexes for performance
- ✅ User ownership verification
- ✅ Message pruning capability

### To Implement (Frontend)
- ⏳ Session list UI component
- ⏳ Session switcher in AI panel
- ⏳ Auto-save messages during chat
- ⏳ Session rename functionality
- ⏳ Session delete with confirmation
- ⏳ Load previous session messages
- ⏳ Translations for all UI text

## Usage Example

### Creating and Using a Session

```typescript
// 1. Create a new session
const session = await createSession('dashboard', 'New Chat');

// 2. Add messages during chat
await addMessage(session.id, 'user', 'How do I improve my score?');
await addMessage(session.id, 'assistant', 'Here are some tips...');

// 3. List all sessions
const sessions = await listSessions({ surface: 'dashboard', limit: 20 });

// 4. Load a previous session
const { session, messages } = await getSessionWithMessages(sessionId);

// 5. Update session title
await updateSessionTitle(sessionId, 'Tips for improving score');

// 6. Delete session
await deleteSession(sessionId);
```

## Performance Considerations

1. **Pagination**: Always use limit/skip for large result sets
2. **Indexes**: Compound indexes optimize common query patterns
3. **Message Pruning**: Consider pruning old messages for very long sessions
4. **Caching**: Frontend can cache recent sessions in memory
5. **Lazy Loading**: Load messages only when session is opened

## Security

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own sessions
3. **Validation**: Zod schemas validate all inputs
4. **Ownership**: Session ownership verified before operations

## Next Steps

1. Create frontend API functions (`session-api.ts`)
2. Build session list UI components
3. Integrate with existing `use-ai-chat` hook
4. Add translations for all languages (en, bn, ar)
5. Test end-to-end flow
6. Add loading states and error handling
7. Implement session search/filter
