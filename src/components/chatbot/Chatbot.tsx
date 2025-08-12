
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatWindow } from './ChatWindow';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 transition-transform duration-300 ease-in-out',
          isOpen ? 'scale-0' : 'scale-100'
        )}
      >
        <Button
          size="icon"
          className="rounded-full w-16 h-16 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="w-8 h-8" />
        </Button>
      </div>

      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 m-0 sm:m-6 w-full h-[90vh] sm:h-[800px] sm:max-h-[calc(100dvh-3rem)] sm:w-[440px] rounded-lg bg-card shadow-xl border border-border transition-all duration-300 ease-in-out origin-bottom-right',
          isOpen
            ? 'scale-100 opacity-100'
            : 'scale-0 opacity-0 pointer-events-none'
        )}
      >
        <ChatWindow closeChat={() => setIsOpen(false)} />
      </div>
    </>
  );
}
