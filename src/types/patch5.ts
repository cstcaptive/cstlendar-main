/**
 * PATCH5: AI Chat Types
 */

export interface ChatMessagePatch5 {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
