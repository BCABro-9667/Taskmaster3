
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '@/ai/flows/chat';
import type { MessageData } from 'genkit';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { getCurrentUser } from '@/lib/client-auth';
import type { User as UserType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


interface ChatWindowProps {
  closeChat: () => void;
}

export function ChatWindow({ closeChat }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const welcomeMessage: MessageData = {
        role: 'model',
        content: [{ text: `Hi ${user?.name || 'there'}, how have you been today?` }],
    };
    setMessages([welcomeMessage]);
  }, []);

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: async (newMessages: MessageData[]) => {
      return await sendChatMessage(newMessages);
    },
    onSuccess: (response) => {
      setMessages((prev) => [...prev, response]);
    },
    onError: (error) => {
      const errorMessage: MessageData = {
        role: 'model',
        content: [{ text: `Sorry, something went wrong: ${error.message}` }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSend = () => {
    if (input.trim() === '') return;
    const userMessage: MessageData = {
      role: 'user',
      content: [{ text: input }],
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    sendMessage(newMessages);
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const getUserInitials = (name: string | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold">TaskMaster Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={closeChat}>
          <X className="w-5 h-5" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={cn(
                  'p-3 max-w-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-3xl rounded-br-lg'
                    : 'bg-muted rounded-3xl rounded-bl-lg'
                )}
              >
                {message.content.map((part, partIndex) => {
                  if (part.text) {
                    return <p key={partIndex} className="whitespace-pre-wrap">{part.text}</p>;
                  }
                  if (part.toolRequest) {
                    return (
                        <div key={partIndex} className="text-xs text-muted-foreground italic">
                            ...
                        </div>
                    );
                  }
                  if (part.toolResponse) {
                    return null; // Don't display tool responses directly
                  }
                  return null;
                })}
              </div>
              {message.role === 'user' && (
                 <Avatar className="w-8 h-8 flex-shrink-0">
                  {currentUser?.profileImageUrl && <AvatarImage src={currentUser.profileImageUrl} alt={currentUser.name} />}
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {currentUser ? getUserInitials(currentUser.name) : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t">
        <div className="relative flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="rounded-full h-12 pr-14"
          />
          <Button onClick={handleSend} disabled={isLoading} size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
