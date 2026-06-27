/**
 * Google Gemini provider implementation
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiProvider, StreamChatOptions } from '@/modules/ai/ai.types';

export class GeminiProvider implements AiProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async *streamChat(options: StreamChatOptions): AsyncIterable<string> {
    const model = this.client.getGenerativeModel({ model: options.model });

    // Gemini uses a different message format
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const chatMessages = options.messages.filter((m) => m.role !== 'system');

    const chat = model.startChat({
      history: chatMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
      },
      systemInstruction: systemMessage?.content,
    });

    const lastMessage = chatMessages[chatMessages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}
