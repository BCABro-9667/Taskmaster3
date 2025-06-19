import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/types";
import { CheckCircle2, Circle, Zap, Archive } from "lucide-react"; // Zap for inprogress, Archive for archived

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const statusConfig = {
    todo: { label: "To Do", variant: "secondary", Icon: Circle },
    inprogress: { label: "In Progress", variant: "default", Icon: Zap }, // Using primary color for In Progress
    done: { label: "Done", variant: "outline", Icon: CheckCircle2 }, // Changed to outline to better fit with primary bg.
    archived: { label: "Archived", variant: "outline", Icon: Archive },
  };

  // Custom styling for 'done' to be greenish
  if (status === 'done') {
     statusConfig.done.variant = 'default'; // to allow custom bg
     const Icon = statusConfig[status].Icon;
     return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
         <Icon className="mr-1 h-3 w-3" />
         {statusConfig[status].label}
       </Badge>
     );
  }
  
  if (status === 'inprogress') {
    const Icon = statusConfig[status].Icon;
    return (
      <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Icon className="mr-1 h-3 w-3" />
        {statusConfig[status].label}
      </Badge>
    );
  }


  const { label, variant, Icon } = statusConfig[status] || statusConfig.todo;

  return (
    <Badge variant={variant as any}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}
