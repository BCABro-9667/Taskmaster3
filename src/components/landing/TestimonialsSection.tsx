
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah L.',
    role: 'Project Manager',
    avatar: 'https://placehold.co/100x100.png',
    avatarFallback: 'SL',
    avatarHint: 'profile photo',
    stars: 5,
    text: "TaskMaster has revolutionized how our team handles projects. The AI deadline suggestions are a game-changer!",
  },
  {
    name: 'John B.',
    role: 'Freelance Developer',
    avatar: 'https://placehold.co/100x100.png',
    avatarFallback: 'JB',
    avatarHint: 'profile photo',
    stars: 5,
    text: "As a freelancer, staying organized is key. TaskMaster's intuitive interface and progress tracking help me stay on top of all my client work.",
  },
  {
    name: 'Emily K.',
    role: 'Startup Founder',
    avatar: 'https://placehold.co/100x100.png',
    avatarFallback: 'EK',
    avatarHint: 'profile photo',
    stars: 4,
    text: "We adopted TaskMaster early on, and it's scaled perfectly with our growing team. The assignee management is simple yet powerful.",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-accent/10 px-3 py-1 text-sm text-accent font-medium">
            Testimonials
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
            Loved by Teams and Individuals
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Hear what our users have to say about their experience with TaskMaster.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.avatarHint} />
                    <AvatarFallback>{testimonial.avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-semibold">{testimonial.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex mb-2">
                  {Array(testimonial.stars).fill(0).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  {Array(5 - testimonial.stars).fill(0).map((_, i) => (
                     <Star key={i+testimonial.stars} className="h-5 w-5 text-muted-foreground" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">"{testimonial.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
