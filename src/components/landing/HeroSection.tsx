
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import main from './1.png';
import { CheckCircle } from 'lucide-react';

export function HeroSection() {
  return (
    <section id="hero" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background to-muted/50">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px]">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Manage Your Tasks, Master Your Day
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                TaskMaster helps you organize, track, and complete your projects efficiently. Say goodbye to chaos and hello to productivity.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Intuitive task management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Assign tasks and track progress</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>AI-powered deadline suggestions</span>
              </div>
            </div>
          </div>
          <Image
            src={main}
            alt="TaskMaster App Screenshot"
            width={650}
            height={450}
            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last "
            data-ai-hint="productivity app interface"
          />
        </div>
      </div>
    </section>
  );
}
