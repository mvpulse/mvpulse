import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { Plus } from "lucide-react";

export default function Projects() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">Group your polls into projects to organize insights.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard 
          title="Q3 Governance"
          pollCount={4}
          responses={3420}
          status="active"
          color="bg-primary"
        />
        <ProjectCard 
          title="Product Research 2024"
          pollCount={12}
          responses={8500}
          status="active"
          color="bg-accent"
        />
        <ProjectCard 
          title="Community Engagement"
          pollCount={8}
          responses={1200}
          status="active"
          color="bg-blue-500"
        />
        <ProjectCard 
          title="Legacy Surveys"
          pollCount={24}
          responses={15600}
          status="archived"
          color="bg-muted-foreground"
        />
      </div>
    </div>
  );
}
