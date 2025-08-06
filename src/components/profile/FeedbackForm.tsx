
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const feedbackFormSchema = z.object({
  uiExperience: z.string().min(1, 'Please select an option.'),
  loadingExperience: z.string().min(1, 'Please select an option.'),
  rating: z.number().min(1, 'Please provide a rating.').max(5),
  suggestion: z.string().max(500, 'Suggestion is too long.').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(2000, 'Description is too long.'),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

const StarRating = ({ field }: { field: any }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            onClick={() => field.onChange(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                ratingValue <= (hover || field.value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};


export function FeedbackForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      uiExperience: '',
      loadingExperience: '',
      rating: 0,
      suggestion: '',
      description: '',
    },
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    console.log('Feedback submitted:', data);
    
    // Simulate API call
    setTimeout(() => {
        toast({
          title: 'Feedback Submitted!',
          description: "Thank you for your valuable input.",
          variant: 'success',
        });
        form.reset();
        setIsSubmitting(false);
    }, 1500);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>User Interface Experience</Label>
                <Controller
                    name="uiExperience"
                    control={form.control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select UI experience..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="better">Better</SelectItem>
                            <SelectItem value="improvement">Needs Improvement</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                    {form.formState.errors.uiExperience && <p className="text-sm text-destructive">{form.formState.errors.uiExperience.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Website Loading Speed</Label>
                    <Controller
                    name="loadingExperience"
                    control={form.control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select loading experience..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="better">Better</SelectItem>
                            <SelectItem value="too-much-time">Takes too much time</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {form.formState.errors.loadingExperience && <p className="text-sm text-destructive">{form.formState.errors.loadingExperience.message}</p>}
            </div>
        </div>

        <div className="space-y-2">
            <Label>How do you like this application?</Label>
            <Controller
                name="rating"
                control={form.control}
                render={({ field }) => <StarRating field={field} />}
            />
                {form.formState.errors.rating && <p className="text-sm text-destructive">{form.formState.errors.rating.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="suggestion">Suggestion (Optional)</Label>
            <Input
            id="suggestion"
            {...form.register('suggestion')}
            placeholder="e.g., Add a dark mode toggle"
            />
            {form.formState.errors.suggestion && <p className="text-sm text-destructive">{form.formState.errors.suggestion.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="description">Feedback / Description</Label>
            <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Tell us more about your experience, what you liked, or what could be better."
            className="min-h-[120px]"
            />
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
        </div>

        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
            </Button>
        </div>
    </form>
  );
}
