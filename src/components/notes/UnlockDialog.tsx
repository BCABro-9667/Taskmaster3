
'use client';

import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { verifyPin } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnlockDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  noteTitle: string;
  userId: string;
  onPinVerified: () => void;
}

export function UnlockDialog({
  isOpen,
  onOpenChange,
  noteTitle,
  userId,
  onPinVerified,
}: UnlockDialogProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // If all fields are filled, submit
    if (newPin.every(digit => digit !== '') && newPin.join('').length === 4) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (finalPin: string) => {
    if (finalPin.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }
    setError('');
    setIsVerifying(true);
    
    try {
      const isCorrect = await verifyPin(userId, finalPin);
      if (isCorrect) {
        onPinVerified();
        onOpenChange(false);
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: "Error Verifying PIN",
        description: (err as Error).message,
      });
      setError('An error occurred.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock Note: "{noteTitle}"</DialogTitle>
          <DialogDescription>
            Enter your 4-digit PIN to view the contents of this note.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex justify-center gap-2">
            {pin.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="h-14 w-12 text-center text-2xl font-mono"
                disabled={isVerifying}
                autoFocus={index === 0}
              />
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button 
            onClick={() => handleSubmit(pin.join(''))} 
            disabled={isVerifying || pin.join('').length !== 4}
            className="mt-4"
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unlock Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
