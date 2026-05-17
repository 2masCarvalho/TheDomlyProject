import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/supabase-client';
import { Button } from '@/components/ui/button';
import { Bot, Send, User } from 'lucide-react';

import { ChatActionButtons } from '@/components/chat/ChatActionButtons';
import type { ChatAction } from '@/lib/chatActions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}

const SUGGESTIONS = [
  'Quantos edifícios tenho?',
  'Quando é a próxima manutenção?',
  'Mostra-me as ocorrências em aberto',
  'Gera o relatório do mês passado',
];

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content:
    'Olá! Sou o assistente Domly. Posso responder a perguntas sobre os teus condomínios, ativos, ocorrências e trabalhos — e gerar relatórios e PDFs por ti. Como posso ajudar?',
};

export const SuportePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build the message history for the API (exclude the initial greeting id '0')
      const history = updatedMessages
        .filter((m) => m.id !== '0')
        .map(({ role, content }) => ({ role, content }));

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: history },
      });

      if (error) {
        // Surface the underlying error message (FunctionsHttpError has a `.context.response` we can read)
        let detail = error.message ?? 'Erro desconhecido.';
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          } catch {
            /* ignore parse failure */
          }
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);

      // Server returns { text, actions } (legacy clients also see `reply`)
      const replyText: string = data?.text ?? data?.reply ?? 'Não consegui obter uma resposta. Tenta novamente.';
      const actions: ChatAction[] | undefined = Array.isArray(data?.actions) ? data.actions : undefined;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        actions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[chat] failed', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Ocorreu um erro ao contactar o assistente.' +
            (err?.message ? `\n\nDetalhe: ${err.message}` : ''),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-base leading-tight">Assistente Domly</h1>
          <p className="text-xs text-muted-foreground">
            Pergunta sobre os teus dados ou pede um relatório
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 p-1.5 rounded-full bg-primary/10 text-primary mb-0.5">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && msg.actions ? (
                <ChatActionButtons actions={msg.actions} />
              ) : null}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 p-1.5 rounded-full bg-muted mb-0.5">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="flex-shrink-0 p-1.5 rounded-full bg-primary/10 text-primary mb-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {/* Suggestion chips — only show before user sends first message */}
        {messages.length === 1 && !loading && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground text-center mb-3">Sugestões para começar</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreve uma mensagem... (Enter para enviar)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            size="icon"
            className="rounded-xl h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Shift+Enter para nova linha · Enter para enviar
        </p>
      </div>
    </div>
  );
};
