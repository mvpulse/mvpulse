import { useState, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { CreatorLayout } from "@/components/layouts/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowLeft,
  FolderKanban,
  FileText,
  Vote,
  Search,
  GripVertical,
  Plus,
  X,
  Check,
} from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import {
  useProject,
  useAddPollsToProject,
  useRemovePollFromProject,
  useAddQuestionnairesToProject,
  useRemoveQuestionnaireFromProject,
  canUserEditProject,
} from "@/hooks/useProjects";
import { useQuestionnaires } from "@/hooks/useQuestionnaire";
import { usePolls } from "@/hooks/usePolls";
import { useToast } from "@/hooks/use-toast";

export default function ManageProjectContent() {
  const { id: projectId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isConnected, address } = useWalletConnection();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"polls" | "questionnaires">("polls");
  const [searchQuery, setSearchQuery] = useState("");

  // Drag state
  const [draggedItem, setDraggedItem] = useState<{ type: "poll" | "questionnaire"; id: number | string } | null>(null);

  // Fetch project data
  const { data: project, isLoading: isLoadingProject, refetch } = useProject(projectId, address);

  // Fetch all polls from blockchain
  const { polls: allPollsRaw, isLoading: isLoadingPolls } = usePolls();

  // Filter to creator's polls
  const allPolls = useMemo(() => {
    if (!address) return [];
    return allPollsRaw.filter(
      (p) => p.creator.toLowerCase() === address.toLowerCase()
    );
  }, [allPollsRaw, address]);

  // Fetch user's questionnaires
  const { data: allQuestionnaires, isLoading: isLoadingQuestionnaires } = useQuestionnaires({
    creator: address || undefined,
  });

  // Mutations
  const addPollsMutation = useAddPollsToProject();
  const removePollMutation = useRemovePollFromProject();
  const addQuestionnairesMutation = useAddQuestionnairesToProject();
  const removeQuestionnaireMutation = useRemoveQuestionnaireFromProject();

  // Get polls already in project
  const projectPollIds = useMemo(() => {
    return new Set(project?.polls?.map((p) => p.pollId) || []);
  }, [project?.polls]);

  // Get questionnaires already in project
  const projectQuestionnaireIds = useMemo(() => {
    return new Set(project?.questionnaires?.map((q) => q.id) || []);
  }, [project?.questionnaires]);

  // Filter available polls (not in project)
  const availablePolls = useMemo(() => {
    let filtered = allPolls.filter((p) => !projectPollIds.has(p.id));
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(query));
    }
    return filtered;
  }, [allPolls, projectPollIds, searchQuery]);

  // Filter available questionnaires (not in project)
  const availableQuestionnaires = useMemo(() => {
    if (!allQuestionnaires) return [];
    let filtered = allQuestionnaires.filter((q) => !projectQuestionnaireIds.has(q.id));
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q) => q.title.toLowerCase().includes(query));
    }
    return filtered;
  }, [allQuestionnaires, projectQuestionnaireIds, searchQuery]);

  // Check permissions
  const userRole = project?.userRole ?? null;
  const canEdit = canUserEditProject(userRole);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, type: "poll" | "questionnaire", id: number | string) => {
      setDraggedItem({ type, id });
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify({ type, id }));
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropToProject = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedItem || !projectId || !address) return;

      try {
        if (draggedItem.type === "poll") {
          const poll = allPolls.find((p) => p.id === draggedItem.id);
          await addPollsMutation.mutateAsync({
            projectId,
            pollIds: [draggedItem.id as number],
            address,
            cachedTitles: poll ? [poll.title] : undefined,
          });
          toast({ title: "Poll added to project" });
        } else {
          await addQuestionnairesMutation.mutateAsync({
            projectId,
            questionnaireIds: [draggedItem.id as string],
            address,
          });
          toast({ title: "Questionnaire added to project" });
        }
        refetch();
      } catch (error) {
        toast({
          title: "Failed to add item",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }

      setDraggedItem(null);
    },
    [draggedItem, projectId, address, allPolls, addPollsMutation, addQuestionnairesMutation, refetch, toast]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // Quick add handlers (click to add)
  const handleAddPoll = async (pollId: number) => {
    if (!projectId || !address) return;

    try {
      const poll = allPolls.find((p) => p.id === pollId);
      await addPollsMutation.mutateAsync({
        projectId,
        pollIds: [pollId],
        address,
        cachedTitles: poll ? [poll.title] : undefined,
      });
      toast({ title: "Poll added to project" });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to add poll",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleAddQuestionnaire = async (questionnaireId: string) => {
    if (!projectId || !address) return;

    try {
      await addQuestionnairesMutation.mutateAsync({
        projectId,
        questionnaireIds: [questionnaireId],
        address,
      });
      toast({ title: "Questionnaire added to project" });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to add questionnaire",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Remove handlers
  const handleRemovePoll = async (pollId: number) => {
    if (!projectId || !address) return;

    try {
      await removePollMutation.mutateAsync({ projectId, pollId, address });
      toast({ title: "Poll removed from project" });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to remove poll",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleRemoveQuestionnaire = async (questionnaireId: string) => {
    if (!projectId || !address) return;

    try {
      await removeQuestionnaireMutation.mutateAsync({ projectId, questionnaireId, address });
      toast({ title: "Questionnaire removed from project" });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to remove questionnaire",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <CreatorLayout>
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-600 dark:text-yellow-400">
              Please connect your wallet to manage this project.
            </p>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  if (isLoadingProject) {
    return (
      <CreatorLayout>
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </CreatorLayout>
    );
  }

  if (!project) {
    return (
      <CreatorLayout>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <Button onClick={() => navigate("/creator/projects")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  if (!canEdit) {
    return (
      <CreatorLayout>
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-600 dark:text-yellow-400">
              You don't have permission to edit this project.
            </p>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        onClick={() => navigate(`/creator/projects/${projectId}`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Project
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: project.color || "#6366f1" }}
        >
          <FolderKanban className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Manage Content</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "polls" | "questionnaires")}>
        <TabsList className="mb-6">
          <TabsTrigger value="polls">
            <Vote className="w-4 h-4 mr-2" />
            Polls
          </TabsTrigger>
          <TabsTrigger value="questionnaires">
            <FileText className="w-4 h-4 mr-2" />
            Questionnaires
          </TabsTrigger>
        </TabsList>

        <TabsContent value="polls">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Polls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Polls</CardTitle>
                <CardDescription>Drag or click to add polls to project</CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search polls..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {isLoadingPolls ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : availablePolls.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchQuery ? "No matching polls found" : "All your polls are in this project"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availablePolls.map((poll) => (
                      <div
                        key={poll.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "poll", poll.id)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{poll.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {poll.votes.reduce((a, b) => a + b, 0)} votes
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddPoll(poll.id)}
                          disabled={addPollsMutation.isPending}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Polls */}
            <Card
              className={`transition-colors ${
                draggedItem?.type === "poll" ? "border-primary border-2 bg-primary/5" : ""
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDropToProject}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Vote className="w-5 h-5" />
                  Project Polls ({project.polls?.length || 0})
                </CardTitle>
                <CardDescription>
                  {draggedItem?.type === "poll"
                    ? "Drop here to add poll"
                    : "Polls currently in this project"}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {!project.polls?.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                    <Vote className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Drag polls here or click + to add
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.polls.map((poll) => (
                      <div
                        key={poll.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5"
                      >
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {poll.cachedTitle || `Poll #${poll.pollId}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {poll.cachedTotalVotes || 0} votes
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemovePoll(poll.pollId)}
                          disabled={removePollMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questionnaires">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Questionnaires */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Questionnaires</CardTitle>
                <CardDescription>Drag or click to add questionnaires to project</CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questionnaires..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {isLoadingQuestionnaires ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : availableQuestionnaires.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchQuery
                      ? "No matching questionnaires found"
                      : "All your questionnaires are in this project"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableQuestionnaires.map((q) => (
                      <div
                        key={q.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, "questionnaire", q.id)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{q.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {q.pollCount} polls - {q.completionCount} completions
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddQuestionnaire(q.id)}
                          disabled={addQuestionnairesMutation.isPending}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Questionnaires */}
            <Card
              className={`transition-colors ${
                draggedItem?.type === "questionnaire" ? "border-primary border-2 bg-primary/5" : ""
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDropToProject}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Questionnaires ({project.questionnaires?.length || 0})
                </CardTitle>
                <CardDescription>
                  {draggedItem?.type === "questionnaire"
                    ? "Drop here to add questionnaire"
                    : "Questionnaires currently in this project"}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {!project.questionnaires?.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                    <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Drag questionnaires here or click + to add
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.questionnaires.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5"
                      >
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{q.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {q.pollCount} polls - {q.completionCount} completions
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveQuestionnaire(q.id)}
                          disabled={removeQuestionnaireMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </CreatorLayout>
  );
}
