'use client';

import * as React from 'react';
import { MessageSquare, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useChatSessions } from '@/hooks/use-chat-sessions';
import type { ChatSession } from '@/lib/chat-session-api';

interface ChatHistorySidebarProps {
  surface?: 'dashboard' | 'admin';
  activeSessionId: string | null;
  onSelectSession: (sessionId: string | null) => void;
  onNewSession: () => void;
  onSessionsChange?: (sessions: ChatSession[]) => void;
  className?: string;
}

/**
 * Sidebar component showing chat session history with ability to create,
 * select, rename, and delete sessions.
 */
export function ChatHistorySidebar({
  surface = 'dashboard',
  activeSessionId,
  onSelectSession,
  onNewSession,
  onSessionsChange,
  className,
}: ChatHistorySidebarProps) {
  const {
    sessions,
    isLoading,
    isCreating,
    isDeleting,
    error,
    createSession,
    deleteSession,
    renameSession,
  } = useChatSessions({ surface });

  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');

  React.useEffect(() => {
    onSessionsChange?.(sessions);
  }, [sessions, onSessionsChange]);

  const handleNewSession = async () => {
    const session = await createSession();
    if (session) {
      onNewSession();
    }
  };

  const handleRename = async (sessionId: string) => {
    if (editTitle.trim()) {
      await renameSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHours < 48) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      className={cn(
        'flex w-64 flex-col border-r border-border/60 bg-card/30 p-3',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Chat History</h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleNewSession}
          disabled={isCreating}
          className="h-7 w-7 p-0"
          aria-label="New chat"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {error && (
        <p className="mb-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-muted/50"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-4 text-center">
            <MessageSquare className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No chat sessions yet</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <div
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50',
                    activeSessionId === session.id && 'bg-muted',
                  )}
                  onClick={() => onSelectSession(session.id)}
                >
                  <MessageSquare className="size-3.5 text-muted-foreground" />
                  {editingSessionId === session.id ? (
                    <>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(session.id);
                          }
                          if (e.key === 'Escape') {
                            setEditingSessionId(null);
                          }
                        }}
                        className="flex-1 rounded border border-border bg-background px-1 text-xs outline-none"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(session.id);
                        }}
                        className="h-5 w-5 p-0"
                        aria-label="Save"
                      >
                        <Check className="size-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{session.title}</span>
                      <span className="hidden text-[10px] text-muted-foreground group-hover:inline">
                        {formatDate(session.lastMessageAt)}
                      </span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(session.id);
                            setEditTitle(session.title);
                          }}
                          className="h-5 w-5 p-0"
                          aria-label="Rename session"
                        >
                          <Edit2 className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                          aria-label="Delete session"
                          disabled={isDeleting}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}