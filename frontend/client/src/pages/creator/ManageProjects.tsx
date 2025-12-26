import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { CreatorLayout } from "@/components/layouts/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  RefreshCcw,
  Plus,
  AlertCircle,
  FolderKanban,
  BarChart3,
  Users,
  FileText,
  Vote,
  MoreVertical,
  Trash2,
  Settings,
  Eye,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import {
  useProjects,
  useCreateProject,
  useArchiveProject,
  PROJECT_STATUS,
  PROJECT_ROLE,
  getProjectRoleLabel,
  type ProjectWithRole,
} from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

// Color presets for projects
const COLOR_PRESETS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

export default function ManageProjects() {
  const [, navigate] = useLocation();
  const { isConnected, address } = useWalletConnection();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(COLOR_PRESETS[0]);

  // Fetch projects
  const { data: projects, isLoading, refetch } = useProjects(address);

  const createProjectMutation = useCreateProject();
  const archiveProjectMutation = useArchiveProject();

  // Filter by tab and search
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects;

    // Filter by tab
    if (activeTab === "owned") {
      filtered = filtered.filter((p) => p.userRole === PROJECT_ROLE.OWNER);
    } else if (activeTab === "shared") {
      filtered = filtered.filter((p) => p.userRole !== PROJECT_ROLE.OWNER);
    } else if (activeTab === "archived") {
      filtered = filtered.filter((p) => p.status === PROJECT_STATUS.ARCHIVED);
    } else if (activeTab === "active") {
      filtered = filtered.filter((p) => p.status === PROJECT_STATUS.ACTIVE);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [projects, activeTab, searchQuery]);

  // Count by tab
  const tabCounts = useMemo(() => {
    if (!projects) {
      return { all: 0, active: 0, owned: 0, shared: 0, archived: 0 };
    }
    return {
      all: projects.length,
      active: projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE).length,
      owned: projects.filter((p) => p.userRole === PROJECT_ROLE.OWNER).length,
      shared: projects.filter((p) => p.userRole !== PROJECT_ROLE.OWNER).length,
      archived: projects.filter((p) => p.status === PROJECT_STATUS.ARCHIVED).length,
    };
  }, [projects]);

  // Create project handler
  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !address) return;

    try {
      await createProjectMutation.mutateAsync({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        color: newProjectColor,
        ownerAddress: address,
      });

      toast({
        title: "Project created",
        description: `"${newProjectName}" has been created.`,
      });

      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectColor(COLOR_PRESETS[0]);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Archive project handler
  const handleArchive = async (projectId: string) => {
    if (!address) return;

    try {
      await archiveProjectMutation.mutateAsync({
        projectId,
        address,
      });

      toast({
        title: "Project archived",
        description: "The project has been archived.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Failed to archive project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Project Card component
  const ProjectCard = ({ project }: { project: ProjectWithRole }) => {
    const isOwner = project.userRole === PROJECT_ROLE.OWNER;
    const isArchived = project.status === PROJECT_STATUS.ARCHIVED;

    return (
      <Card
        className={`relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
          isArchived ? "opacity-60" : ""
        }`}
        onClick={() => navigate(`/creator/projects/${project.id}`)}
      >
        {/* Color bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: project.color || COLOR_PRESETS[0] }}
        />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderKanban
                  className="w-5 h-5"
                  style={{ color: project.color || COLOR_PRESETS[0] }}
                />
                {project.name}
              </CardTitle>
              {project.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isOwner ? "default" : "secondary"}>
                {getProjectRoleLabel(project.userRole)}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/creator/projects/${project.id}`);
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/creator/projects/${project.id}/manage`);
                      }}>
                        <Layers className="mr-2 h-4 w-4" />
                        Manage Content
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/creator/projects/${project.id}?tab=settings`);
                      }}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(project.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Vote className="w-4 h-4" />
              <span>{project.cachedTotalPolls} polls</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{project.cachedTotalQuestionnaires} questionnaires</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="w-4 h-4" />
              <span>{project.cachedTotalVotes} votes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading skeleton
  const CardSkeleton = () => <Skeleton className="h-40 w-full rounded-xl" />;

  if (!isConnected) {
    return (
      <CreatorLayout
        title="Manage Projects"
        description="Organize your polls and questionnaires into projects"
      >
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-600 dark:text-yellow-400">
              Please connect your wallet to view your projects.
            </p>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout
      title="Manage Projects"
      description="Organize your polls and questionnaires into projects"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a project to organize your polls and questionnaires.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My Project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project..."
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newProjectColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewProjectColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({tabCounts.active})</TabsTrigger>
          <TabsTrigger value="owned">Owned ({tabCounts.owned})</TabsTrigger>
          <TabsTrigger value="shared">Shared ({tabCounts.shared})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({tabCounts.archived})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search terms."
                    : "Create your first project to get started."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </CreatorLayout>
  );
}
