import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Loader2, Sparkles, Atom } from 'lucide-react';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/physics-chat`;

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessages: ChatMessage[]) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error('تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.');
      }
      if (response.status === 402) {
        throw new Error('يرجى إعادة شحن الرصيد للاستمرار في استخدام المساعد الذكي.');
      }
      throw new Error(errorData.error || 'فشل الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.');
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="border-b border-border/30 bg-card/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">المساعد الذكي للفيزياء</h1>
                <p className="text-xs text-muted-foreground">اسألني أي سؤال في الفيزياء</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="container mx-auto px-4 py-6 max-w-3xl">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                  <Atom className="w-12 h-12 text-primary animate-float" />
                </div>
                <h2 className="text-2xl font-bold gradient-text mb-3">مرحباً بك!</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  أنا المساعد الذكي للفيزياء. يمكنني مساعدتك في فهم المفاهيم وحل المسائل وشرح القوانين الفيزيائية.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['ما هو قانون نيوتن الثاني؟', 'اشرح لي الحركة المستقيمة', 'كيف أحسب السرعة؟'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-4 py-2 rounded-full bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-primary'
                          : 'bg-gradient-to-br from-primary to-accent'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div
                      className={`flex-1 p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'glass-card rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="glass-card p-4 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border/30 bg-card/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 max-w-3xl">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 bg-secondary border-border"
                disabled={isLoading}
              />
              <Button type="submit" variant="hero" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
