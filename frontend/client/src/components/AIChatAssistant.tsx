import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi! I'm your Movement AI assistant. I can help you draft poll questions, analyze trends, or suggest survey structures. What do you need help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: getMockResponse(userMsg.content),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const getMockResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes("poll") || q.includes("question")) return "For a decentralized governance poll, I suggest asking: 'Should we allocate 20% of the treasury to the new ecosystem grant program?' with options: 'Yes', 'No', 'Abstain'.";
    if (q.includes("survey")) return "To get better completion rates, keep your survey under 5 questions. Start with broad demographic questions before diving into specifics.";
    if (q.includes("movement")) return "Movement is all about speed and liquidity. Consider incentivizing your poll with MOVE tokens to increase participation.";
    return "That's an interesting idea! I can help you structure that into a poll project. Would you like me to draft a project description?";
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 rounded-full w-14 h-14 shadow-2xl z-50 transition-all duration-300 hover:scale-110",
          isOpen ? "bg-destructive rotate-45" : "bg-gradient-to-r from-primary to-accent animate-pulse hover:animate-none"
        )}
        data-testid="btn-ai-chat"
      >
        {isOpen ? <PlusCircleIcon className="w-6 h-6 text-white" /> : <Bot className="w-8 h-8 text-primary-foreground" />}
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-36 md:bottom-24 right-4 md:right-8 w-[90vw] md:w-96 h-[500px] z-40 transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Card className="w-full h-full flex flex-col overflow-hidden border-primary/20 shadow-2xl bg-background/95 backdrop-blur-xl">
          <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold font-display">MoveAI Assistant</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI to generate a poll..."
                className="bg-muted/50 border-transparent focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
