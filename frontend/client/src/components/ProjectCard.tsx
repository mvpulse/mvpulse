import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, MoreVertical, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectProps {
  title: string;
  pollCount: number;
  responses: number;
  status: "active" | "archived";
  color?: string;
}

export function ProjectCard({ title, pollCount, responses, status, color = "bg-primary" }: ProjectProps) {
  return (
    <Card className="group border-border/50 hover:border-accent/50 transition-all duration-300 hover:bg-accent/5">
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <div className={`p-2 rounded-lg ${color}/10 text-${color}-500`}>
          <Folder className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg font-display mb-2 group-hover:text-accent transition-colors">
          {title}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <PieChart className="w-4 h-4" />
            {pollCount} Polls
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={status === "active" ? "default" : "secondary"} className="h-5 text-[10px]">
              {status}
            </Badge>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Total Responses</span>
          <span className="font-mono font-bold text-foreground">{responses.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
