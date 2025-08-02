
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Users, BrainCircuit, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import img1 from './11.png';
import img2 from './2.png';
import img3 from './3.png';
import img4 from './4.png';

const features = [
  {
    icon: <ListChecks className="h-8 w-8 text-primary" />,
    title: 'Comprehensive Task Management',
    description: 'Create, assign, and track tasks with deadlines, statuses, and notes. Keep everything organized in one place.',
    image: img1,
    imageAlt: 'Task list interface showing tasks and assignees.',
    imageHint: 'task list'
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Assignee Management',
    description: 'Easily manage assignees, view their workload, and delegate tasks effectively to team members.',
    image: img2,
    imageAlt: 'Assignee profile page with task statistics.',
    imageHint: 'team collaboration'
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Deadline Suggestions',
    description: 'Leverage artificial intelligence to get smart deadline suggestions based on task details and workload.',
    image: img3,
    imageAlt: 'AI suggestion for a task deadline.',
    imageHint: 'artificial intelligence'
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: 'Progress Tracking',
    description: 'Visualize task progress for assignees with intuitive charts and reports to stay on top of your projects.',
    image: img4,
    imageAlt: 'Dashboard showing a bar chart of task progress.',
    imageHint: 'dashboard chart'
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
            Key Features
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
            Everything You Need to Succeed
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            TaskMaster offers a robust set of features designed to streamline your workflow and enhance productivity.
          </p>
        </div>
        <div className="grid gap-12 md:gap-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${
                index % 2 !== 0 ? 'lg:grid-flow-row-dense' : ''
              }`}
            >
              <div className={`space-y-4 ${index % 2 !== 0 ? 'lg:col-start-2' : ''}`}>
                <div className="inline-block rounded-lg bg-primary/10 p-3">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold font-headline">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
              <Image
                src={feature.image}
                alt={feature.imageAlt}
                width={550}
                height={310}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full shadow-lg"
                data-ai-hint={feature.imageHint}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
